-- FIXED: Function to calculate energy costs based on TOU rates
-- This version properly splits usage across multiple rate periods
CREATE OR REPLACE FUNCTION calculate_energy_cost(
  wattage INTEGER,
  start_time TIME,
  end_time TIME,
  usage_date DATE
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  total_cost DECIMAL(10,2) := 0;
  total_duration_hours DECIMAL(10,4);
  month INTEGER;
  day_of_week INTEGER;
  is_summer BOOLEAN;
  is_weekend BOOLEAN;
  
  -- Time boundaries for rate periods
  start_minutes INTEGER;
  end_minutes INTEGER;
  current_start INTEGER;
  current_end INTEGER;
  period_duration DECIMAL(10,4);
  period_kwh DECIMAL(10,4);
  period_cost DECIMAL(10,4);
BEGIN
  -- Get month and day of week
  month := EXTRACT(MONTH FROM usage_date);
  day_of_week := EXTRACT(DOW FROM usage_date); -- 0 = Sunday, 6 = Saturday
  
  -- Determine season and day type
  is_summer := (month BETWEEN 6 AND 9);
  is_weekend := (day_of_week = 0 OR day_of_week = 6);
  
  -- Convert times to minutes since midnight
  start_minutes := EXTRACT(HOUR FROM start_time) * 60 + EXTRACT(MINUTE FROM start_time);
  end_minutes := EXTRACT(HOUR FROM end_time) * 60 + EXTRACT(MINUTE FROM end_time);
  
  -- Handle overnight usage (crosses midnight)
  IF end_minutes <= start_minutes THEN
    end_minutes := end_minutes + (24 * 60);
  END IF;
  
  -- Calculate total duration
  total_duration_hours := (end_minutes - start_minutes) / 60.0;
  
  -- SUMMER RATES (June - September)
  IF is_summer THEN
    IF NOT is_weekend THEN
      -- SUMMER WEEKDAY
      -- Off-Peak: 00:00-16:00 ($0.25)
      -- On-Peak:  16:00-21:00 ($0.55)
      -- Off-Peak: 21:00-24:00 ($0.25)
      
      -- Off-Peak period 1: 00:00-16:00 (0-960 minutes)
      current_start := GREATEST(start_minutes, 0);
      current_end := LEAST(end_minutes, 960);
      IF current_end > current_start THEN
        period_duration := (current_end - current_start) / 60.0;
        period_kwh := (wattage / 1000.0) * period_duration;
        period_cost := period_kwh * 0.25;
        total_cost := total_cost + period_cost;
      END IF;
      
      -- On-Peak period: 16:00-21:00 (960-1260 minutes)
      current_start := GREATEST(start_minutes, 960);
      current_end := LEAST(end_minutes, 1260);
      IF current_end > current_start THEN
        period_duration := (current_end - current_start) / 60.0;
        period_kwh := (wattage / 1000.0) * period_duration;
        period_cost := period_kwh * 0.55;
        total_cost := total_cost + period_cost;
      END IF;
      
      -- Off-Peak period 2: 21:00-24:00 (1260-1440 minutes)
      current_start := GREATEST(start_minutes, 1260);
      current_end := LEAST(end_minutes, 1440);
      IF current_end > current_start THEN
        period_duration := (current_end - current_start) / 60.0;
        period_kwh := (wattage / 1000.0) * period_duration;
        period_cost := period_kwh * 0.25;
        total_cost := total_cost + period_cost;
      END IF;
      
      -- Handle overnight portion (after midnight)
      IF end_minutes > 1440 THEN
        -- Off-Peak: 00:00-16:00 next day
        current_start := GREATEST(start_minutes, 1440);
        current_end := LEAST(end_minutes, 1440 + 960);
        IF current_end > current_start THEN
          period_duration := (current_end - current_start) / 60.0;
          period_kwh := (wattage / 1000.0) * period_duration;
          period_cost := period_kwh * 0.25;
          total_cost := total_cost + period_cost;
        END IF;
        
        -- On-Peak: 16:00-21:00 next day
        current_start := GREATEST(start_minutes, 1440 + 960);
        current_end := LEAST(end_minutes, 1440 + 1260);
        IF current_end > current_start THEN
          period_duration := (current_end - current_start) / 60.0;
          period_kwh := (wattage / 1000.0) * period_duration;
          period_cost := period_kwh * 0.55;
          total_cost := total_cost + period_cost;
        END IF;
        
        -- Off-Peak: 21:00-24:00 next day
        current_start := GREATEST(start_minutes, 1440 + 1260);
        current_end := end_minutes;
        IF current_end > current_start THEN
          period_duration := (current_end - current_start) / 60.0;
          period_kwh := (wattage / 1000.0) * period_duration;
          period_cost := period_kwh * 0.25;
          total_cost := total_cost + period_cost;
        END IF;
      END IF;
      
    ELSE
      -- SUMMER WEEKEND
      -- Off-Peak:  00:00-16:00 ($0.25)
      -- Mid-Peak:  16:00-21:00 ($0.37)
      -- Off-Peak:  21:00-24:00 ($0.25)
      
      -- Off-Peak period 1: 00:00-16:00
      current_start := GREATEST(start_minutes, 0);
      current_end := LEAST(end_minutes, 960);
      IF current_end > current_start THEN
        period_duration := (current_end - current_start) / 60.0;
        period_kwh := (wattage / 1000.0) * period_duration;
        period_cost := period_kwh * 0.25;
        total_cost := total_cost + period_cost;
      END IF;
      
      -- Mid-Peak period: 16:00-21:00
      current_start := GREATEST(start_minutes, 960);
      current_end := LEAST(end_minutes, 1260);
      IF current_end > current_start THEN
        period_duration := (current_end - current_start) / 60.0;
        period_kwh := (wattage / 1000.0) * period_duration;
        period_cost := period_kwh * 0.37;
        total_cost := total_cost + period_cost;
      END IF;
      
      -- Off-Peak period 2: 21:00-24:00
      current_start := GREATEST(start_minutes, 1260);
      current_end := LEAST(end_minutes, 1440);
      IF current_end > current_start THEN
        period_duration := (current_end - current_start) / 60.0;
        period_kwh := (wattage / 1000.0) * period_duration;
        period_cost := period_kwh * 0.25;
        total_cost := total_cost + period_cost;
      END IF;
      
      -- Handle overnight portion
      IF end_minutes > 1440 THEN
        current_start := GREATEST(start_minutes, 1440);
        current_end := LEAST(end_minutes, 1440 + 960);
        IF current_end > current_start THEN
          period_duration := (current_end - current_start) / 60.0;
          period_kwh := (wattage / 1000.0) * period_duration;
          period_cost := period_kwh * 0.25;
          total_cost := total_cost + period_cost;
        END IF;
        
        current_start := GREATEST(start_minutes, 1440 + 960);
        current_end := LEAST(end_minutes, 1440 + 1260);
        IF current_end > current_start THEN
          period_duration := (current_end - current_start) / 60.0;
          period_kwh := (wattage / 1000.0) * period_duration;
          period_cost := period_kwh * 0.37;
          total_cost := total_cost + period_cost;
        END IF;
        
        current_start := GREATEST(start_minutes, 1440 + 1260);
        current_end := end_minutes;
        IF current_end > current_start THEN
          period_duration := (current_end - current_start) / 60.0;
          period_kwh := (wattage / 1000.0) * period_duration;
          period_cost := period_kwh * 0.25;
          total_cost := total_cost + period_cost;
        END IF;
      END IF;
    END IF;
    
  ELSE
    -- WINTER RATES (October - May)
    -- All Days:
    -- Off-Peak:       21:00-08:00 ($0.24) - crosses midnight
    -- Super Off-Peak: 08:00-16:00 ($0.24)
    -- Mid-Peak:       16:00-21:00 ($0.52)
    
    -- Handle the Off-Peak period that crosses midnight (21:00-08:00)
    -- Split into two parts: 21:00-24:00 and 00:00-08:00
    
    -- Off-Peak part 1: 00:00-08:00 (0-480 minutes)
    current_start := GREATEST(start_minutes, 0);
    current_end := LEAST(end_minutes, 480);
    IF current_end > current_start THEN
      period_duration := (current_end - current_start) / 60.0;
      period_kwh := (wattage / 1000.0) * period_duration;
      period_cost := period_kwh * 0.24;
      total_cost := total_cost + period_cost;
    END IF;
    
    -- Super Off-Peak: 08:00-16:00 (480-960 minutes)
    current_start := GREATEST(start_minutes, 480);
    current_end := LEAST(end_minutes, 960);
    IF current_end > current_start THEN
      period_duration := (current_end - current_start) / 60.0;
      period_kwh := (wattage / 1000.0) * period_duration;
      period_cost := period_kwh * 0.24;
      total_cost := total_cost + period_cost;
    END IF;
    
    -- Mid-Peak: 16:00-21:00 (960-1260 minutes)
    current_start := GREATEST(start_minutes, 960);
    current_end := LEAST(end_minutes, 1260);
    IF current_end > current_start THEN
      period_duration := (current_end - current_start) / 60.0;
      period_kwh := (wattage / 1000.0) * period_duration;
      period_cost := period_kwh * 0.52;
      total_cost := total_cost + period_cost;
    END IF;
    
    -- Off-Peak part 2: 21:00-24:00 (1260-1440 minutes)
    current_start := GREATEST(start_minutes, 1260);
    current_end := LEAST(end_minutes, 1440);
    IF current_end > current_start THEN
      period_duration := (current_end - current_start) / 60.0;
      period_kwh := (wattage / 1000.0) * period_duration;
      period_cost := period_kwh * 0.24;
      total_cost := total_cost + period_cost;
    END IF;
    
    -- Handle overnight portion (after midnight)
    IF end_minutes > 1440 THEN
      -- Off-Peak: 00:00-08:00 next day
      current_start := GREATEST(start_minutes, 1440);
      current_end := LEAST(end_minutes, 1440 + 480);
      IF current_end > current_start THEN
        period_duration := (current_end - current_start) / 60.0;
        period_kwh := (wattage / 1000.0) * period_duration;
        period_cost := period_kwh * 0.24;
        total_cost := total_cost + period_cost;
      END IF;
      
      -- Super Off-Peak: 08:00-16:00 next day
      current_start := GREATEST(start_minutes, 1440 + 480);
      current_end := LEAST(end_minutes, 1440 + 960);
      IF current_end > current_start THEN
        period_duration := (current_end - current_start) / 60.0;
        period_kwh := (wattage / 1000.0) * period_duration;
        period_cost := period_kwh * 0.24;
        total_cost := total_cost + period_cost;
      END IF;
      
      -- Mid-Peak: 16:00-21:00 next day
      current_start := GREATEST(start_minutes, 1440 + 960);
      current_end := LEAST(end_minutes, 1440 + 1260);
      IF current_end > current_start THEN
        period_duration := (current_end - current_start) / 60.0;
        period_kwh := (wattage / 1000.0) * period_duration;
        period_cost := period_kwh * 0.52;
        total_cost := total_cost + period_cost;
      END IF;
      
      -- Off-Peak: 21:00-24:00 next day
      current_start := GREATEST(start_minutes, 1440 + 1260);
      current_end := end_minutes;
      IF current_end > current_start THEN
        period_duration := (current_end - current_start) / 60.0;
        period_kwh := (wattage / 1000.0) * period_duration;
        period_cost := period_kwh * 0.24;
        total_cost := total_cost + period_cost;
      END IF;
    END IF;
  END IF;
  
  RETURN ROUND(total_cost, 2);
END;
$$ LANGUAGE plpgsql;

-- Test cases to verify the fix
-- Run these after creating the function:

-- Test 1: Summer Weekday - crosses On-Peak boundary
-- 3:00 PM to 5:00 PM (1 hour Off-Peak + 1 hour On-Peak)
-- Expected: (100W / 1000) * 1h * $0.25 + (100W / 1000) * 1h * $0.55 = $0.08
SELECT calculate_energy_cost(100, '15:00', '17:00', '2025-07-15'::DATE);

-- Test 2: Winter - crosses 3 rate periods
-- 7:00 AM to 5:00 PM (1h Off-Peak + 8h Super Off-Peak + 1h Mid-Peak)
-- Expected: (100W / 1000) * 1h * $0.24 + (100W / 1000) * 8h * $0.24 + (100W / 1000) * 1h * $0.52 = $0.268
SELECT calculate_energy_cost(100, '07:00', '17:00', '2025-01-15'::DATE);

-- Test 3: Overnight usage
-- 11:00 PM to 2:00 AM (3 hours Off-Peak)
-- Expected: (100W / 1000) * 3h * $0.25 = $0.075 (summer) or $0.072 (winter)
SELECT calculate_energy_cost(100, '23:00', '02:00', '2025-07-15'::DATE);
SELECT calculate_energy_cost(100, '23:00', '02:00', '2025-01-15'::DATE);
