-- Function to calculate energy costs based on TOU rates
CREATE OR REPLACE FUNCTION calculate_energy_cost(
  wattage INTEGER,
  start_time TIME,
  end_time TIME,
  usage_date DATE
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  total_cost DECIMAL(10,2) := 0;
  duration_hours DECIMAL(10,4);
  kwh DECIMAL(10,4);
  kwh_portion DECIMAL(10,4);
  month INTEGER;
  day_of_week INTEGER;
  current_time TIME;
  rate DECIMAL(10,4);
BEGIN
  -- Calculate duration in hours
  duration_hours := EXTRACT(EPOCH FROM (end_time - start_time)) / 3600;
  
  -- If end_time is less than start_time, it crosses midnight
  IF end_time < start_time THEN
    duration_hours := duration_hours + 24;
  END IF;
  
  -- Calculate kWh
  kwh := (wattage / 1000.0) * duration_hours;
  
  -- Get month and day of week
  month := EXTRACT(MONTH FROM usage_date);
  day_of_week := EXTRACT(DOW FROM usage_date); -- 0 = Sunday, 6 = Saturday
  
  -- Determine rate based on date and time
  IF month BETWEEN 6 AND 9 THEN -- Summer rates (June - September)
    -- Summer weekday rates
    IF day_of_week BETWEEN 1 AND 5 THEN
      -- Off-Peak: 12:00 AM - 4:00 PM (00:00 - 16:00)
      IF start_time < '16:00' AND end_time <= '16:00' THEN
        rate := 0.25;
        total_cost := total_cost + (rate * kwh);
      ELSIF start_time < '16:00' AND end_time > '16:00' AND end_time <= '21:00' THEN
        -- Split across Off-Peak and On-Peak
        -- Off-Peak portion
        duration_hours := EXTRACT(EPOCH FROM (TIME '16:00' - start_time)) / 3600;
        kwh_portion := (wattage / 1000.0) * duration_hours;
        total_cost := total_cost + (0.25 * kwh_portion);
        -- On-Peak portion
        duration_hours := EXTRACT(EPOCH FROM (end_time - TIME '16:00')) / 3600;
        kwh_portion := (wattage / 1000.0) * duration_hours;
        total_cost := total_cost + (0.55 * kwh_portion);
      ELSIF start_time >= '16:00' AND end_time <= '21:00' THEN
        rate := 0.55;
        total_cost := total_cost + (rate * kwh);
      ELSIF start_time >= '16:00' AND start_time < '21:00' AND end_time > '21:00' THEN
        -- Split across On-Peak and Off-Peak
        -- On-Peak portion
        duration_hours := EXTRACT(EPOCH FROM (TIME '21:00' - start_time)) / 3600;
        kwh_portion := (wattage / 1000.0) * duration_hours;
        total_cost := total_cost + (0.55 * kwh_portion);
        -- Off-Peak portion
        duration_hours := EXTRACT(EPOCH FROM (end_time - TIME '21:00')) / 3600;
        kwh_portion := (wattage / 1000.0) * duration_hours;
        total_cost := total_cost + (0.25 * kwh_portion);
      ELSE
        rate := 0.25;
        total_cost := total_cost + (rate * kwh);
      END IF;
    ELSE -- Summer weekend rates
      -- Off-Peak: 12:00 AM - 4:00 PM (00:00 - 16:00)
      IF start_time < '16:00' AND end_time <= '16:00' THEN
        rate := 0.25;
        total_cost := total_cost + (rate * kwh);
      ELSIF start_time < '16:00' AND end_time > '16:00' AND end_time <= '21:00' THEN
        -- Split across Off-Peak and Mid-Peak
        -- Off-Peak portion
        duration_hours := EXTRACT(EPOCH FROM (TIME '16:00' - start_time)) / 3600;
        kwh_portion := (wattage / 1000.0) * duration_hours;
        total_cost := total_cost + (0.25 * kwh_portion);
        -- Mid-Peak portion
        duration_hours := EXTRACT(EPOCH FROM (end_time - TIME '16:00')) / 3600;
        kwh_portion := (wattage / 1000.0) * duration_hours;
        total_cost := total_cost + (0.37 * kwh_portion);
      ELSIF start_time >= '16:00' AND end_time <= '21:00' THEN
        rate := 0.37;
        total_cost := total_cost + (rate * kwh);
      ELSIF start_time >= '16:00' AND start_time < '21:00' AND end_time > '21:00' THEN
        -- Split across Mid-Peak and Off-Peak
        -- Mid-Peak portion
        duration_hours := EXTRACT(EPOCH FROM (TIME '21:00' - start_time)) / 3600;
        kwh_portion := (wattage / 1000.0) * duration_hours;
        total_cost := total_cost + (0.37 * kwh_portion);
        -- Off-Peak portion
        duration_hours := EXTRACT(EPOCH FROM (end_time - TIME '21:00')) / 3600;
        kwh_portion := (wattage / 1000.0) * duration_hours;
        total_cost := total_cost + (0.25 * kwh_portion);
      ELSE
        rate := 0.25;
        total_cost := total_cost + (rate * kwh);
      END IF;
    END IF;
  ELSE -- Winter rates (October - May)
    -- All Days
    IF (start_time >= '21:00' OR start_time < '08:00') AND (end_time >= '21:00' OR end_time <= '08:00') THEN
      rate := 0.24;
      total_cost := total_cost + (rate * kwh);
    ELSIF start_time >= '08:00' AND start_time < '16:00' AND end_time >= '08:00' AND end_time < '16:00' THEN
      rate := 0.24;
      total_cost := total_cost + (rate * kwh);
    ELSIF start_time >= '16:00' AND start_time < '21:00' AND end_time >= '16:00' AND end_time < '21:00' THEN
      rate := 0.52;
      total_cost := total_cost + (rate * kwh);
    ELSE
      -- Complex case - need to split across multiple periods
      -- This is a simplified approximation for now
      IF start_time < '08:00' THEN
        rate := 0.24;
      ELSIF start_time < '16:00' THEN
        rate := 0.24;
      ELSIF start_time < '21:00' THEN
        rate := 0.52;
      ELSE
        rate := 0.24;
      END IF;
      total_cost := total_cost + (rate * kwh);
    END IF;
  END IF;
  
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;
