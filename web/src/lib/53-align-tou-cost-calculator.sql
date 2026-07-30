-- ============================================
-- Migration: Align calculate_energy_cost with app TOU-D-PRIME rates
-- ============================================
-- Makes the database the authoritative cost calculator, matching
-- web/src/utils/rateCalculatorFixed.ts seasonal weekday/weekend rates.
-- Handles overnight sessions and day/season boundaries.
-- Manual bulk entries with pre-calculated values are still preserved.
-- Created: 2026-07-30
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_energy_cost(
  p_wattage INTEGER,
  p_start_time TIME,
  p_end_time TIME,
  p_usage_date DATE
)
RETURNS TABLE(
  total_kwh NUMERIC,
  total_cost NUMERIC,
  rate_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_ts TIMESTAMP;
  v_end_ts TIMESTAMP;
  v_cursor TIMESTAMP;
  v_minute_end TIMESTAMP;
  v_day DATE;
  v_tod TIME;
  v_month INTEGER;
  v_dow INTEGER;
  v_is_summer BOOLEAN;
  v_is_weekend BOOLEAN;
  v_rate NUMERIC;
  v_period TEXT;
  v_minute_hours NUMERIC := 1.0 / 60.0;
  v_minute_kwh NUMERIC;
  v_minute_cost NUMERIC;
  v_total_kwh NUMERIC := 0;
  v_total_cost NUMERIC := 0;
  v_breakdown JSONB := '[]'::JSONB;
  v_key TEXT;
  v_map JSONB := '{}'::JSONB;
  v_entry JSONB;
  v_hours NUMERIC;
  v_kwh NUMERIC;
  v_cost NUMERIC;
BEGIN
  IF p_wattage IS NULL OR p_wattage < 0 THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, '[]'::JSONB;
    RETURN;
  END IF;

  v_start_ts := p_usage_date::TIMESTAMP + p_start_time;
  v_end_ts := p_usage_date::TIMESTAMP + p_end_time;

  -- Overnight: end is on the next calendar day
  IF p_end_time <= p_start_time THEN
    v_end_ts := v_end_ts + INTERVAL '1 day';
  END IF;

  v_cursor := v_start_ts;

  WHILE v_cursor < v_end_ts LOOP
    v_minute_end := LEAST(v_cursor + INTERVAL '1 minute', v_end_ts);
    v_day := v_cursor::DATE;
    v_tod := v_cursor::TIME;
    v_month := EXTRACT(MONTH FROM v_day)::INTEGER;
    v_dow := EXTRACT(DOW FROM v_day)::INTEGER;
    v_is_summer := (v_month >= 6 AND v_month <= 9);
    v_is_weekend := (v_dow = 0 OR v_dow = 6);

    IF v_is_summer THEN
      IF v_is_weekend THEN
        IF v_tod >= TIME '16:01' AND v_tod < TIME '21:01' THEN
          v_rate := 0.37;
          v_period := 'Mid-Peak';
        ELSE
          v_rate := 0.25;
          v_period := 'Off-Peak';
        END IF;
      ELSE
        IF v_tod >= TIME '16:01' AND v_tod < TIME '21:01' THEN
          v_rate := 0.55;
          v_period := 'On-Peak';
        ELSE
          v_rate := 0.25;
          v_period := 'Off-Peak';
        END IF;
      END IF;
    ELSE
      -- Winter
      IF v_tod >= TIME '16:00' AND v_tod < TIME '21:00' THEN
        v_rate := 0.52;
        v_period := 'Mid-Peak';
      ELSIF v_tod >= TIME '08:00' AND v_tod < TIME '16:00' THEN
        v_rate := 0.24;
        v_period := 'Super Off-Peak';
      ELSE
        v_rate := 0.24;
        v_period := 'Off-Peak';
      END IF;
    END IF;

    v_minute_kwh := (p_wattage / 1000.0) * v_minute_hours;
    v_minute_cost := v_minute_kwh * v_rate;
    v_total_kwh := v_total_kwh + v_minute_kwh;
    v_total_cost := v_total_cost + v_minute_cost;

    v_key := v_period || '|' || v_rate::TEXT;
    v_entry := COALESCE(v_map -> v_key, jsonb_build_object(
      'ratePeriod', v_period,
      'hours', 0,
      'kwh', 0,
      'rate', v_rate,
      'cost', 0,
      'startTime', to_char(v_cursor, 'HH24:MI'),
      'endTime', to_char(v_minute_end, 'HH24:MI')
    ));

    v_hours := (v_entry ->> 'hours')::NUMERIC + v_minute_hours;
    v_kwh := (v_entry ->> 'kwh')::NUMERIC + v_minute_kwh;
    v_cost := (v_entry ->> 'cost')::NUMERIC + v_minute_cost;

    v_map := jsonb_set(
      v_map,
      ARRAY[v_key],
      jsonb_build_object(
        'ratePeriod', v_period,
        'hours', v_hours,
        'kwh', v_kwh,
        'rate', v_rate,
        'cost', v_cost,
        'startTime', v_entry ->> 'startTime',
        'endTime', to_char(v_minute_end, 'HH24:MI')
      ),
      true
    );

    v_cursor := v_minute_end;
  END LOOP;

  SELECT COALESCE(jsonb_agg(value), '[]'::JSONB)
  INTO v_breakdown
  FROM jsonb_each(v_map);

  RETURN QUERY SELECT
    ROUND(v_total_kwh, 2),
    ROUND(v_total_cost, 2),
    v_breakdown;
END;
$$;

COMMENT ON FUNCTION public.calculate_energy_cost(INTEGER, TIME, TIME, DATE) IS
'Authoritative TOU-D-PRIME cost calculator. Summer Jun-Sep weekday On-Peak 4:01-9:00pm $0.55; weekend Mid-Peak $0.37; Off-Peak $0.25. Winter Mid-Peak 4-9pm $0.52; Super Off-Peak 8am-4pm $0.24; Off-Peak $0.24. Handles overnight and day boundaries. Updated: 2026-07-30';

-- Keep manual bulk entries; recalculate everything else with the aligned rates
CREATE OR REPLACE FUNCTION public.trigger_calculate_energy_cost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wattage INTEGER;
  v_result RECORD;
BEGIN
  -- Preserve explicit manual bulk values (e.g. Tesla monthly totals)
  IF NEW.source_type = 'manual'
     AND NEW.total_kwh IS NOT NULL
     AND NEW.calculated_cost IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT wattage INTO v_wattage
  FROM devices
  WHERE id = NEW.device_id;

  IF v_wattage IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_result
  FROM calculate_energy_cost(
    v_wattage,
    NEW.start_time,
    NEW.end_time,
    NEW.usage_date
  );

  NEW.total_kwh := v_result.total_kwh;
  NEW.calculated_cost := v_result.total_cost;
  NEW.rate_breakdown := v_result.rate_breakdown;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS energy_logs_calculate_cost ON energy_logs;

CREATE TRIGGER energy_logs_calculate_cost
  BEFORE INSERT OR UPDATE ON energy_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_energy_cost();

COMMENT ON FUNCTION public.trigger_calculate_energy_cost() IS
'Calculates energy cost via calculate_energy_cost. Skips only manual bulk entries with total_kwh and calculated_cost set. Updated: 2026-07-30';
