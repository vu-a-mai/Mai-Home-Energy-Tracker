-- ============================================
-- Migration: Add Templates and Recurring Schedules
-- Description: Adds support for log templates and auto-recurring schedules
-- Date: 2025-10-04
-- ============================================

-- ============================================
-- 1. CREATE TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS energy_log_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  default_start_time TIME NOT NULL,
  default_end_time TIME NOT NULL,
  assigned_users UUID[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_templates_household ON energy_log_templates(household_id);
CREATE INDEX IF NOT EXISTS idx_templates_device ON energy_log_templates(device_id);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON energy_log_templates(created_by);

-- ============================================
-- 2. CREATE RECURRING SCHEDULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS recurring_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL,
  schedule_name VARCHAR(100) NOT NULL,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  recurrence_type VARCHAR(20) NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'custom')),
  days_of_week INT[] NOT NULL, -- [0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat]
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  schedule_start_date DATE NOT NULL,
  schedule_end_date DATE, -- NULL = no end date
  assigned_users UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  auto_create BOOLEAN DEFAULT true, -- auto-create logs vs manual trigger
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_schedules_household ON recurring_schedules(household_id);
CREATE INDEX IF NOT EXISTS idx_schedules_device ON recurring_schedules(device_id);
CREATE INDEX IF NOT EXISTS idx_schedules_active ON recurring_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_schedules_created_by ON recurring_schedules(created_by);

-- ============================================
-- 3. ADD SOURCE TRACKING TO ENERGY_LOGS
-- ============================================
-- Add columns to track log source (manual, template, or recurring)
ALTER TABLE energy_logs 
  ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_id UUID;

-- Add check constraint for source_type
ALTER TABLE energy_logs 
  ADD CONSTRAINT check_source_type 
  CHECK (source_type IN ('manual', 'template', 'recurring'));

-- Add index for source tracking
CREATE INDEX IF NOT EXISTS idx_energy_logs_source ON energy_logs(source_type, source_id);

-- Add comments for clarity
COMMENT ON COLUMN energy_logs.source_type IS 'Source of log creation: manual, template, or recurring';
COMMENT ON COLUMN energy_logs.source_id IS 'References template or schedule ID if applicable';

-- ============================================
-- 4. RLS POLICIES FOR TEMPLATES
-- ============================================

-- Enable RLS
ALTER TABLE energy_log_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view templates in their household" ON energy_log_templates;
DROP POLICY IF EXISTS "Users can create templates in their household" ON energy_log_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON energy_log_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON energy_log_templates;

-- SELECT: Users can view templates in their household
CREATE POLICY "Users can view templates in their household"
  ON energy_log_templates FOR SELECT
  USING (household_id = get_user_household_id());

-- INSERT: Users can create templates in their household
CREATE POLICY "Users can create templates in their household"
  ON energy_log_templates FOR INSERT
  WITH CHECK (
    household_id = get_user_household_id() AND
    created_by = auth.uid()
  );

-- UPDATE: Users can update their own templates or if they're admin
CREATE POLICY "Users can update their own templates"
  ON energy_log_templates FOR UPDATE
  USING (
    household_id = get_user_household_id() AND
    created_by = auth.uid()
  );

-- DELETE: Users can delete their own templates or if they're admin
CREATE POLICY "Users can delete their own templates"
  ON energy_log_templates FOR DELETE
  USING (
    household_id = get_user_household_id() AND
    created_by = auth.uid()
  );

-- ============================================
-- 5. RLS POLICIES FOR RECURRING SCHEDULES
-- ============================================

-- Enable RLS
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view schedules in their household" ON recurring_schedules;
DROP POLICY IF EXISTS "Users can create schedules in their household" ON recurring_schedules;
DROP POLICY IF EXISTS "Users can update their own schedules" ON recurring_schedules;
DROP POLICY IF EXISTS "Users can delete their own schedules" ON recurring_schedules;

-- SELECT: Users can view schedules in their household
CREATE POLICY "Users can view schedules in their household"
  ON recurring_schedules FOR SELECT
  USING (household_id = get_user_household_id());

-- INSERT: Users can create schedules in their household
CREATE POLICY "Users can create schedules in their household"
  ON recurring_schedules FOR INSERT
  WITH CHECK (
    household_id = get_user_household_id() AND
    created_by = auth.uid()
  );

-- UPDATE: Users can update their own schedules
CREATE POLICY "Users can update their own schedules"
  ON recurring_schedules FOR UPDATE
  USING (
    household_id = get_user_household_id() AND
    created_by = auth.uid()
  );

-- DELETE: Users can delete their own schedules
CREATE POLICY "Users can delete their own schedules"
  ON recurring_schedules FOR DELETE
  USING (
    household_id = get_user_household_id() AND
    created_by = auth.uid()
  );

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to generate logs from recurring schedules
CREATE OR REPLACE FUNCTION generate_recurring_logs(
  p_schedule_id UUID,
  p_target_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_schedule recurring_schedules;
  v_day_of_week INT;
  v_log_id UUID;
  v_household_id UUID;
BEGIN
  -- Get schedule details
  SELECT * INTO v_schedule
  FROM recurring_schedules
  WHERE id = p_schedule_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule not found or inactive';
  END IF;
  
  -- Check if target date is within schedule range
  IF p_target_date < v_schedule.schedule_start_date THEN
    RAISE EXCEPTION 'Target date is before schedule start date';
  END IF;
  
  IF v_schedule.schedule_end_date IS NOT NULL AND p_target_date > v_schedule.schedule_end_date THEN
    RAISE EXCEPTION 'Target date is after schedule end date';
  END IF;
  
  -- Get day of week (0=Sunday, 6=Saturday)
  v_day_of_week := EXTRACT(DOW FROM p_target_date);
  
  -- Check if this day is in the schedule
  IF NOT (v_day_of_week = ANY(v_schedule.days_of_week)) THEN
    RAISE EXCEPTION 'Schedule does not run on this day of week';
  END IF;
  
  -- Check if log already exists for this date/schedule
  IF EXISTS (
    SELECT 1 FROM energy_logs
    WHERE source_type = 'recurring'
      AND source_id = p_schedule_id
      AND usage_date = p_target_date
  ) THEN
    RAISE EXCEPTION 'Log already exists for this date and schedule';
  END IF;
  
  -- Get household_id from schedule
  v_household_id := v_schedule.household_id;
  
  -- Create the log
  INSERT INTO energy_logs (
    household_id,
    device_id,
    usage_date,
    start_time,
    end_time,
    assigned_users,
    created_by,
    source_type,
    source_id
  ) VALUES (
    v_household_id,
    v_schedule.device_id,
    p_target_date,
    v_schedule.start_time,
    v_schedule.end_time,
    v_schedule.assigned_users,
    v_schedule.created_by,
    'recurring',
    p_schedule_id
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Function to auto-generate logs for all active schedules for a given date
CREATE OR REPLACE FUNCTION auto_generate_recurring_logs(p_target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(schedule_id UUID, log_id UUID, success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_schedule RECORD;
  v_day_of_week INT;
  v_log_id UUID;
BEGIN
  -- Get day of week
  v_day_of_week := EXTRACT(DOW FROM p_target_date);
  
  -- Loop through all active schedules that should run today
  FOR v_schedule IN
    SELECT *
    FROM recurring_schedules
    WHERE is_active = true
      AND auto_create = true
      AND p_target_date >= schedule_start_date
      AND (schedule_end_date IS NULL OR p_target_date <= schedule_end_date)
      AND v_day_of_week = ANY(days_of_week)
  LOOP
    BEGIN
      -- Try to generate log
      v_log_id := generate_recurring_logs(v_schedule.id, p_target_date);
      
      -- Return success
      schedule_id := v_schedule.id;
      log_id := v_log_id;
      success := true;
      error_message := NULL;
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      -- Return failure
      schedule_id := v_schedule.id;
      log_id := NULL;
      success := false;
      error_message := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$;

-- ============================================
-- 7. UPDATE TRIGGERS
-- ============================================

-- Update timestamp trigger for templates
CREATE OR REPLACE FUNCTION update_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_template_timestamp
  BEFORE UPDATE ON energy_log_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_template_timestamp();

-- Update timestamp trigger for schedules
CREATE OR REPLACE FUNCTION update_schedule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_schedule_timestamp
  BEFORE UPDATE ON recurring_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_timestamp();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'energy_log_templates') AND
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recurring_schedules') THEN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Tables created: energy_log_templates, recurring_schedules';
    RAISE NOTICE 'Columns added to energy_logs: source_type, source_id';
  ELSE
    RAISE EXCEPTION 'Migration failed - tables not created';
  END IF;
END $$;
