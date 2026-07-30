-- ============================================
-- Migration: Household invites + member roles
-- ============================================
-- - users.household_role: owner | editor | viewer
-- - household_invites table + create/accept/revoke RPCs
-- - users INSERT for signup sync
-- - Block viewers from mutating household data
-- - Prevent direct household_id / role changes (use RPCs)
-- Created: 2026-07-30
-- ============================================

-- ============================================
-- 1) Role column on users
-- ============================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS household_role TEXT;

UPDATE public.users
SET household_role = 'editor'
WHERE household_role IS NULL;

ALTER TABLE public.users
  ALTER COLUMN household_role SET DEFAULT 'editor';

ALTER TABLE public.users
  ALTER COLUMN household_role SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_household_role_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_household_role_check
      CHECK (household_role IN ('owner', 'editor', 'viewer'));
  END IF;
END $$;

-- Earliest member per household becomes owner (idempotent-ish)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY household_id ORDER BY created_at ASC, id ASC) AS rn
  FROM public.users
)
UPDATE public.users u
SET household_role = 'owner'
FROM ranked r
WHERE u.id = r.id
  AND r.rn = 1
  AND u.household_role IS DISTINCT FROM 'owner';

-- ============================================
-- 2) Helpers
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_household_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT household_role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_can_edit_household()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(public.get_user_household_role(), 'viewer') IN ('owner', 'editor');
$$;

CREATE OR REPLACE FUNCTION public.user_is_household_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(public.get_user_household_role(), 'viewer') = 'owner';
$$;

CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::INT, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- ============================================
-- 3) Protect household_id / household_role from client updates
-- ============================================
CREATE OR REPLACE FUNCTION public.protect_user_household_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.household_id IS DISTINCT FROM OLD.household_id
       OR NEW.household_role IS DISTINCT FROM OLD.household_role THEN
      -- Client role is authenticated/anon; SECURITY DEFINER RPCs run as owner.
      IF CURRENT_USER IN ('authenticated', 'anon') THEN
        RAISE EXCEPTION 'Use invite RPCs to change household membership or role';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_household_fields ON public.users;
CREATE TRIGGER trg_protect_user_household_fields
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_household_fields();

-- ============================================
-- 4) Viewer mutation guard (tables)
-- ============================================
CREATE OR REPLACE FUNCTION public.enforce_editor_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF NOT public.user_can_edit_household() THEN
    RAISE EXCEPTION 'Viewers cannot modify household data';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'devices',
    'energy_logs',
    'bill_splits',
    'energy_log_templates',
    'recurring_schedules',
    'device_groups',
    'household_settings'
  ]
  LOOP
    IF to_regclass('public.' || tbl) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('DROP TRIGGER IF EXISTS trg_enforce_editor_role ON public.%I', tbl);
    EXECUTE format(
      'CREATE TRIGGER trg_enforce_editor_role
         BEFORE INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW
         EXECUTE FUNCTION public.enforce_editor_role()',
      tbl
    );
  END LOOP;
END $$;

-- ============================================
-- 5) Users INSERT for signup sync
-- ============================================
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ============================================
-- 6) Invites table
-- ============================================
CREATE TABLE IF NOT EXISTS public.household_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'editor'
    CHECK (role IN ('editor', 'viewer')),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INT NOT NULL DEFAULT 10 CHECK (max_uses > 0),
  use_count INT NOT NULL DEFAULT 0 CHECK (use_count >= 0),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_household_invites_household
  ON public.household_invites(household_id);
CREATE INDEX IF NOT EXISTS idx_household_invites_code
  ON public.household_invites(code);

ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners_select_household_invites" ON public.household_invites;
CREATE POLICY "owners_select_household_invites"
  ON public.household_invites FOR SELECT
  TO authenticated
  USING (
    household_id = public.get_user_household_id()
    AND public.user_is_household_owner()
  );

-- Mutations go through SECURITY DEFINER RPCs only
REVOKE ALL ON public.household_invites FROM anon;
REVOKE ALL ON public.household_invites FROM authenticated;
GRANT SELECT ON public.household_invites TO authenticated;

-- ============================================
-- 7) Invite RPCs
-- ============================================
CREATE OR REPLACE FUNCTION public.create_household_invite(
  p_role TEXT DEFAULT 'editor',
  p_expires_days INT DEFAULT 14,
  p_max_uses INT DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  code TEXT,
  role TEXT,
  expires_at TIMESTAMPTZ,
  max_uses INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household UUID;
  v_code TEXT;
  v_expires TIMESTAMPTZ;
  v_row public.household_invites;
  v_attempts INT := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.user_is_household_owner() THEN
    RAISE EXCEPTION 'Only household owners can create invites';
  END IF;

  IF p_role IS NULL OR p_role NOT IN ('editor', 'viewer') THEN
    RAISE EXCEPTION 'Invite role must be editor or viewer';
  END IF;

  IF p_expires_days IS NULL OR p_expires_days < 1 OR p_expires_days > 90 THEN
    RAISE EXCEPTION 'expires_days must be between 1 and 90';
  END IF;

  IF p_max_uses IS NULL OR p_max_uses < 1 OR p_max_uses > 100 THEN
    RAISE EXCEPTION 'max_uses must be between 1 and 100';
  END IF;

  v_household := public.get_user_household_id();
  IF v_household IS NULL THEN
    RAISE EXCEPTION 'No household for current user';
  END IF;

  v_expires := NOW() + make_interval(days => p_expires_days);

  LOOP
    v_attempts := v_attempts + 1;
    v_code := public.generate_invite_code();
    BEGIN
      INSERT INTO public.household_invites (
        household_id, code, role, created_by, expires_at, max_uses
      ) VALUES (
        v_household, v_code, p_role, auth.uid(), v_expires, p_max_uses
      )
      RETURNING * INTO v_row;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempts >= 8 THEN
        RAISE;
      END IF;
    END;
  END LOOP;

  id := v_row.id;
  code := v_row.code;
  role := v_row.role;
  expires_at := v_row.expires_at;
  max_uses := v_row.max_uses;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_household_invite(p_code TEXT)
RETURNS TABLE(
  household_id UUID,
  role TEXT,
  joined BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.household_invites;
  v_user public.users;
  v_normalized TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_normalized := upper(trim(COALESCE(p_code, '')));
  IF length(v_normalized) < 6 THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  SELECT * INTO v_invite
  FROM public.household_invites
  WHERE code = v_normalized
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite code not found';
  END IF;

  IF v_invite.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invite has been revoked';
  END IF;

  IF v_invite.expires_at < NOW() THEN
    RAISE EXCEPTION 'Invite has expired';
  END IF;

  IF v_invite.use_count >= v_invite.max_uses THEN
    RAISE EXCEPTION 'Invite has reached its use limit';
  END IF;

  SELECT * INTO v_user
  FROM public.users
  WHERE id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found — sign in again after signup sync';
  END IF;

  IF v_user.household_id = v_invite.household_id THEN
    household_id := v_user.household_id;
    role := v_user.household_role;
    joined := false;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Refuse leave if this user is the sole owner of a multi-member household
  IF v_user.household_role = 'owner'
     AND (
       SELECT COUNT(*) FROM public.users u WHERE u.household_id = v_user.household_id
     ) > 1 THEN
    RAISE EXCEPTION 'Transfer ownership or remove other members before joining another household';
  END IF;

  UPDATE public.users
  SET
    household_id = v_invite.household_id,
    household_role = v_invite.role,
    updated_at = NOW()
  WHERE id = auth.uid();

  UPDATE public.household_invites
  SET use_count = use_count + 1
  WHERE id = v_invite.id;

  household_id := v_invite.household_id;
  role := v_invite.role;
  joined := true;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_household_invite(p_invite_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.user_is_household_owner() THEN
    RAISE EXCEPTION 'Only household owners can revoke invites';
  END IF;

  v_household := public.get_user_household_id();

  UPDATE public.household_invites
  SET revoked_at = NOW()
  WHERE id = p_invite_id
    AND household_id = v_household
    AND revoked_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or already revoked';
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.create_household_invite(TEXT, INT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_household_invite(TEXT, INT, INT) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_household_invite(TEXT, INT, INT) TO authenticated;

REVOKE ALL ON FUNCTION public.accept_household_invite(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_household_invite(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_household_invite(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.revoke_household_invite(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_household_invite(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.revoke_household_invite(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_household_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_household_role() TO authenticated;

REVOKE ALL ON FUNCTION public.user_can_edit_household() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_edit_household() TO authenticated;

REVOKE ALL ON FUNCTION public.user_is_household_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_household_owner() TO authenticated;

COMMENT ON COLUMN public.users.household_role IS
  'Household permission: owner (manage invites), editor (read/write), viewer (read-only)';
COMMENT ON TABLE public.household_invites IS
  'Invite codes for joining a household as editor or viewer';
COMMENT ON FUNCTION public.accept_household_invite(TEXT) IS
  'Join the invite household; moves solo owners freely, blocks multi-member owners';
