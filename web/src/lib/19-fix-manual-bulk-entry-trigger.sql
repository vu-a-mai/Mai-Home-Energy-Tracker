-- ============================================
-- Migration: Fix Manual Bulk Entry Trigger
-- ============================================
-- Description: 
--   Fixes the trigger_calculate_energy_cost() function to skip
--   recalculation for manual bulk entries where total_kwh and
--   calculated_cost are already provided.
--
--   This allows the Quick Energy Entry feature to work correctly
--   when users enter known kWh values (e.g., from Tesla app).
--
-- Issue: 
--   The trigger was always recalculating cost based on time range,
--   overriding manually entered kWh and cost values.
--
-- Created: 2025-10-06
-- ============================================

-- Drop and recreate the trigger to ensure clean state
DROP TRIGGER IF EXISTS energy_logs_calculate_cost ON energy_logs;

-- Update the trigger function to skip recalculation for manual bulk entries
CREATE OR REPLACE FUNCTION trigger_calculate_energy_cost()
RETURNS TRIGGER AS $$
DECLARE
  v_wattage INTEGER;
  v_result RECORD;
BEGIN
  -- Debug: Log what we're checking
  RAISE NOTICE 'Trigger called - source_type: %, total_kwh: %, calculated_cost: %', 
    NEW.source_type, NEW.total_kwh, NEW.calculated_cost;

  -- Skip automatic calculation if this is a manual entry with pre-calculated values
  -- This allows bulk entries (like Tesla monthly totals) to use their own kWh/cost
  IF NEW.source_type = 'manual' AND NEW.total_kwh IS NOT NULL AND NEW.calculated_cost IS NOT NULL THEN
    -- Keep the manually provided values
    RAISE NOTICE 'Skipping recalculation - keeping manual values';
    RETURN NEW;
  END IF;

  -- For all other entries, calculate cost automatically
  RAISE NOTICE 'Recalculating energy cost';
  
  -- Get device wattage
  SELECT wattage INTO v_wattage
  FROM devices
  WHERE id = NEW.device_id;
  
  -- Calculate cost
  SELECT * INTO v_result
  FROM calculate_energy_cost(
    v_wattage,
    NEW.start_time,
    NEW.end_time,
    NEW.usage_date
  );
  
  -- Update the energy log
  NEW.total_kwh := v_result.total_kwh;
  NEW.calculated_cost := v_result.total_cost;
  NEW.rate_breakdown := v_result.rate_breakdown;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER energy_logs_calculate_cost
  BEFORE INSERT OR UPDATE ON energy_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_energy_cost();

-- Set search_path for security (following migration 18 pattern)
ALTER FUNCTION public.trigger_calculate_energy_cost() SET search_path = public;

-- Add comment to document the change
COMMENT ON FUNCTION public.trigger_calculate_energy_cost IS 
'Calculates energy cost for logs. Skips recalculation for manual bulk entries 
with pre-calculated values (source_type=manual and total_kwh/calculated_cost provided). 
Updated: 2025-10-06';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ MANUAL BULK ENTRY FIX APPLIED';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Changes:';
  RAISE NOTICE '  - Updated trigger_calculate_energy_cost() to skip recalculation';
  RAISE NOTICE '    for manual entries with pre-calculated values';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 What this fixes:';
  RAISE NOTICE '  - Quick Energy Entry now respects manual kWh values';
  RAISE NOTICE '  - Bulk entries (e.g., Tesla monthly totals) work correctly';
  RAISE NOTICE '  - Regular time-based entries still auto-calculate';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next Steps:';
  RAISE NOTICE '  1. Test Quick Energy Entry (Bulk mode)';
  RAISE NOTICE '  2. Verify kWh and cost match your input';
  RAISE NOTICE '  3. Regular log entries should still auto-calculate';
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
END $$;
