-- Migration: Add Soft Delete Support for Energy Logs
-- Description: Adds soft delete columns and recovery management functionality

-- Add soft delete columns to energy_logs
ALTER TABLE energy_logs 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS permanent_delete_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_mode VARCHAR(20) DEFAULT 'soft';

-- Add comment
COMMENT ON COLUMN energy_logs.deleted_at IS 'Timestamp when log was soft deleted';
COMMENT ON COLUMN energy_logs.deleted_by IS 'User who deleted the log';
COMMENT ON COLUMN energy_logs.permanent_delete_at IS 'When to permanently delete this log';
COMMENT ON COLUMN energy_logs.deletion_mode IS 'soft or permanent deletion mode';

-- Create index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_energy_logs_deleted_at 
ON energy_logs(deleted_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_energy_logs_permanent_delete 
ON energy_logs(permanent_delete_at) 
WHERE permanent_delete_at IS NOT NULL;

-- Update RLS policies to exclude soft-deleted logs by default
DROP POLICY IF EXISTS "Users can view household energy logs" ON energy_logs;

CREATE POLICY "Users can view household energy logs"
ON energy_logs FOR SELECT
USING (
  household_id = get_user_household_id()
  AND deleted_at IS NULL  -- Exclude soft-deleted logs
);

-- Add policy to view deleted logs (for recovery page)
DROP POLICY IF EXISTS "Users can view their household's deleted logs" ON energy_logs;

CREATE POLICY "Users can view their household's deleted logs"
ON energy_logs FOR SELECT
USING (
  household_id = get_user_household_id()
  AND deleted_at IS NOT NULL
);

-- Add policy for soft delete
DROP POLICY IF EXISTS "Users can soft delete household energy logs" ON energy_logs;

CREATE POLICY "Users can soft delete household energy logs"
ON energy_logs FOR UPDATE
USING (household_id = get_user_household_id())
WITH CHECK (household_id = get_user_household_id());

-- Function to soft delete logs
CREATE OR REPLACE FUNCTION soft_delete_energy_logs(
  p_log_ids UUID[],
  p_recovery_days INT DEFAULT 30
)
RETURNS TABLE(deleted_count INT) AS $$
DECLARE
  v_user_id UUID;
  v_permanent_delete_at TIMESTAMPTZ;
  v_deleted_count INT;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Calculate permanent delete timestamp
  v_permanent_delete_at := NOW() + (p_recovery_days || ' days')::INTERVAL;
  
  -- Soft delete the logs
  UPDATE energy_logs
  SET 
    deleted_at = NOW(),
    deleted_by = v_user_id,
    permanent_delete_at = v_permanent_delete_at,
    deletion_mode = 'soft',
    updated_at = NOW()
  WHERE id = ANY(p_log_ids)
    AND household_id = get_user_household_id()
    AND deleted_at IS NULL;  -- Only delete non-deleted logs
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore deleted logs
CREATE OR REPLACE FUNCTION restore_energy_logs(
  p_log_ids UUID[]
)
RETURNS TABLE(restored_count INT) AS $$
DECLARE
  v_restored_count INT;
BEGIN
  -- Restore the logs
  UPDATE energy_logs
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    permanent_delete_at = NULL,
    deletion_mode = 'soft',
    updated_at = NOW()
  WHERE id = ANY(p_log_ids)
    AND household_id = get_user_household_id()
    AND deleted_at IS NOT NULL;  -- Only restore deleted logs
  
  GET DIAGNOSTICS v_restored_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_restored_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extend recovery period
CREATE OR REPLACE FUNCTION extend_recovery_period(
  p_log_ids UUID[],
  p_additional_days INT
)
RETURNS TABLE(extended_count INT) AS $$
DECLARE
  v_extended_count INT;
BEGIN
  -- Extend the permanent delete timestamp
  UPDATE energy_logs
  SET 
    permanent_delete_at = permanent_delete_at + (p_additional_days || ' days')::INTERVAL,
    updated_at = NOW()
  WHERE id = ANY(p_log_ids)
    AND household_id = get_user_household_id()
    AND deleted_at IS NOT NULL
    AND permanent_delete_at IS NOT NULL;
  
  GET DIAGNOSTICS v_extended_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_extended_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to permanently delete logs immediately
CREATE OR REPLACE FUNCTION permanent_delete_energy_logs(
  p_log_ids UUID[]
)
RETURNS TABLE(deleted_count INT) AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  -- Hard delete the logs
  DELETE FROM energy_logs
  WHERE id = ANY(p_log_ids)
    AND household_id = get_user_household_id();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired deleted logs (for cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_deleted_logs()
RETURNS TABLE(cleaned_count INT) AS $$
DECLARE
  v_cleaned_count INT;
BEGIN
  -- Delete logs that have passed their permanent_delete_at timestamp
  DELETE FROM energy_logs
  WHERE deleted_at IS NOT NULL
    AND permanent_delete_at IS NOT NULL
    AND permanent_delete_at <= NOW();
  
  GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION soft_delete_energy_logs TO authenticated;
GRANT EXECUTE ON FUNCTION restore_energy_logs TO authenticated;
GRANT EXECUTE ON FUNCTION extend_recovery_period TO authenticated;
GRANT EXECUTE ON FUNCTION permanent_delete_energy_logs TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_deleted_logs TO authenticated;
