-- ============================================
-- Migration: Add Multi-Device Template Support
-- Description: Allows templates to store multiple devices
-- Date: 2025-10-09
-- ============================================

-- ============================================
-- 1. ADD device_ids COLUMN
-- ============================================
ALTER TABLE energy_log_templates 
  ADD COLUMN IF NOT EXISTS device_ids UUID[] DEFAULT '{}';

-- ============================================
-- 2. MAKE device_id NULLABLE (backward compatible)
-- ============================================
ALTER TABLE energy_log_templates 
  ALTER COLUMN device_id DROP NOT NULL;

-- ============================================
-- 3. ADD CHECK CONSTRAINT (data integrity)
-- ============================================
-- Ensure either device_id OR device_ids is populated (not both empty)
ALTER TABLE energy_log_templates
  DROP CONSTRAINT IF EXISTS check_device_selection;

ALTER TABLE energy_log_templates
  ADD CONSTRAINT check_device_selection
  CHECK (
    -- Old style: single device
    (device_id IS NOT NULL AND (device_ids IS NULL OR device_ids = '{}')) OR
    -- New style: multi-device
    (device_id IS NULL AND device_ids IS NOT NULL AND array_length(device_ids, 1) > 0)
  );

-- ============================================
-- 4. ADD COMMENTS
-- ============================================
COMMENT ON COLUMN energy_log_templates.device_id IS 
  'Single device ID (legacy). Use device_ids for multi-device templates.';

COMMENT ON COLUMN energy_log_templates.device_ids IS 
  'Array of device IDs for multi-device templates. When used, creates one log per device.';

-- ============================================
-- 5. CREATE INDEX FOR device_ids
-- ============================================
CREATE INDEX IF NOT EXISTS idx_templates_device_ids 
  ON energy_log_templates USING GIN (device_ids);

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  -- Check if column exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'energy_log_templates' 
    AND column_name = 'device_ids'
  ) THEN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '   - Added device_ids column';
    RAISE NOTICE '   - Made device_id nullable';
    RAISE NOTICE '   - Added check constraint';
    RAISE NOTICE '   - Created GIN index';
  ELSE
    RAISE EXCEPTION '❌ Migration failed - device_ids column not created';
  END IF;
END $$;
