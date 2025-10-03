-- ============================================================================
-- Fix Security Warnings: Add search_path to functions
-- ============================================================================
-- This script addresses Supabase security warnings about role mutable search_path

-- 1. Fix trigger_set_updated_at function
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Fix trigger_calculate_energy_cost function
CREATE OR REPLACE FUNCTION public.trigger_calculate_energy_cost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- This trigger is called before INSERT on energy_logs
  -- It automatically calculates the cost based on device wattage and time
  
  -- Get device wattage
  DECLARE
    device_wattage INTEGER;
  BEGIN
    SELECT wattage INTO device_wattage
    FROM devices
    WHERE id = NEW.device_id;
    
    -- Calculate kWh and cost
    -- This is a simplified calculation - the actual calculation is done in the app
    -- using the rateCalculator which considers time-of-use rates
    NEW.total_kwh := (device_wattage / 1000.0) * 
                     EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600.0;
    
    -- Basic cost calculation (will be overridden by app's accurate calculation)
    NEW.calculated_cost := NEW.total_kwh * 0.25; -- Default rate
    
    RETURN NEW;
  END;
END;
$$;

-- 3. Fix calculate_energy_cost function (if it exists)
-- Note: This function might not exist or have different parameters
-- Adjust as needed based on your actual function definition

-- ============================================================================
-- MANUAL ACTIONS REQUIRED IN SUPABASE DASHBOARD:
-- ============================================================================
-- 
-- 1. Enable HaveIBeenPwned Password Check:
--    - Go to: Authentication → Policies
--    - Find: "Password Requirements"
--    - Toggle ON: "Check passwords against HaveIBeenPwned"
--
-- 2. Enable Additional MFA Options:
--    - Go to: Authentication → Providers
--    - Enable: TOTP (Authenticator Apps)
--    - Enable: Phone (SMS) if needed
--
-- ============================================================================

COMMENT ON FUNCTION public.trigger_set_updated_at IS 'Sets updated_at to current timestamp. Fixed search_path security warning.';
COMMENT ON FUNCTION public.trigger_calculate_energy_cost IS 'Calculates energy cost for logs. Fixed search_path security warning.';

