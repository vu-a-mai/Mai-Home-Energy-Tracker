-- ============================================
-- FRESH DATABASE SCHEMA - Mai Home Energy Tracker
-- ============================================
-- Run this FIRST on your empty Supabase database
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  household_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: devices
-- ============================================
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL,
  name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  location TEXT NOT NULL,
  wattage INTEGER NOT NULL CHECK (wattage > 0),
  is_shared BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: energy_logs
-- ============================================
CREATE TABLE IF NOT EXISTS energy_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_kwh NUMERIC(10, 3),
  calculated_cost NUMERIC(10, 2),
  rate_breakdown JSONB,
  assigned_users UUID[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: bill_splits
-- ============================================
CREATE TABLE IF NOT EXISTS bill_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  total_bill_amount NUMERIC(10, 2) NOT NULL,
  user_allocations JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_household ON users(household_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_devices_household ON devices(household_id);
CREATE INDEX IF NOT EXISTS idx_devices_created_by ON devices(created_by);

CREATE INDEX IF NOT EXISTS idx_energy_logs_household ON energy_logs(household_id);
CREATE INDEX IF NOT EXISTS idx_energy_logs_device ON energy_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_energy_logs_date ON energy_logs(usage_date);
CREATE INDEX IF NOT EXISTS idx_energy_logs_created_by ON energy_logs(created_by);

CREATE INDEX IF NOT EXISTS idx_bill_splits_household ON bill_splits(household_id);
CREATE INDEX IF NOT EXISTS idx_bill_splits_period ON bill_splits(billing_period_start, billing_period_end);

-- ============================================
-- FUNCTION: Calculate energy cost with time-of-use rates
-- ============================================
CREATE OR REPLACE FUNCTION calculate_energy_cost(
  p_wattage INTEGER,
  p_start_time TIME,
  p_end_time TIME,
  p_usage_date DATE
)
RETURNS TABLE(
  total_kwh NUMERIC,
  total_cost NUMERIC,
  rate_breakdown JSONB
) AS $$
DECLARE
  v_current_time TIME;
  v_next_time TIME;
  v_duration_hours NUMERIC;
  v_kwh NUMERIC;
  v_cost NUMERIC;
  v_rate NUMERIC;
  v_period_name TEXT;
  v_total_kwh NUMERIC := 0;
  v_total_cost NUMERIC := 0;
  v_breakdown JSONB := '[]'::JSONB;
  v_day_of_week INTEGER;
BEGIN
  -- Get day of week (0 = Sunday, 6 = Saturday)
  v_day_of_week := EXTRACT(DOW FROM p_usage_date);
  
  v_current_time := p_start_time;
  
  -- Handle overnight sessions
  IF p_end_time < p_start_time THEN
    p_end_time := p_end_time + INTERVAL '24 hours';
  END IF;
  
  -- Loop through each hour
  WHILE v_current_time < p_end_time LOOP
    v_next_time := LEAST(
      v_current_time + INTERVAL '1 hour',
      p_end_time
    );
    
    -- Calculate duration in hours
    v_duration_hours := EXTRACT(EPOCH FROM (v_next_time - v_current_time)) / 3600.0;
    
    -- Determine rate based on time and day
    IF v_day_of_week IN (0, 6) THEN
      -- Weekend: Off-Peak all day
      v_rate := 0.082;
      v_period_name := 'Off-Peak';
    ELSIF v_current_time >= '19:00:00' OR v_current_time < '07:00:00' THEN
      -- Weekday: Off-Peak (7pm-7am)
      v_rate := 0.082;
      v_period_name := 'Off-Peak';
    ELSIF v_current_time >= '11:00:00' AND v_current_time < '17:00:00' THEN
      -- Weekday: Mid-Peak (11am-5pm)
      v_rate := 0.113;
      v_period_name := 'Mid-Peak';
    ELSE
      -- Weekday: On-Peak (7am-11am, 5pm-7pm)
      v_rate := 0.151;
      v_period_name := 'On-Peak';
    END IF;
    
    -- Calculate kWh and cost for this period
    v_kwh := (p_wattage / 1000.0) * v_duration_hours;
    v_cost := v_kwh * v_rate;
    
    -- Add to totals
    v_total_kwh := v_total_kwh + v_kwh;
    v_total_cost := v_total_cost + v_cost;
    
    -- Add to breakdown
    v_breakdown := v_breakdown || jsonb_build_object(
      'period', v_period_name,
      'rate', v_rate,
      'kwh', ROUND(v_kwh, 3),
      'cost', ROUND(v_cost, 2)
    );
    
    v_current_time := v_next_time;
  END LOOP;
  
  RETURN QUERY SELECT 
    ROUND(v_total_kwh, 3),
    ROUND(v_total_cost, 2),
    v_breakdown;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-calculate energy costs on insert/update
-- ============================================
CREATE OR REPLACE FUNCTION trigger_calculate_energy_cost()
RETURNS TRIGGER AS $$
DECLARE
  v_wattage INTEGER;
  v_result RECORD;
BEGIN
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER energy_logs_calculate_cost
  BEFORE INSERT OR UPDATE ON energy_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_energy_cost();

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER energy_logs_updated_at
  BEFORE UPDATE ON energy_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_splits ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their household members"
  ON users FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Devices table policies
CREATE POLICY "Users can view household devices"
  ON devices FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create devices in their household"
  ON devices FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update devices they created"
  ON devices FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete devices they created"
  ON devices FOR DELETE
  USING (created_by = auth.uid());

-- Energy logs table policies
CREATE POLICY "Users can view household energy logs"
  ON energy_logs FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create energy logs in their household"
  ON energy_logs FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update energy logs they created"
  ON energy_logs FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete energy logs they created"
  ON energy_logs FOR DELETE
  USING (created_by = auth.uid());

-- Bill splits table policies
CREATE POLICY "Users can view household bill splits"
  ON bill_splits FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create bill splits in their household"
  ON bill_splits FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- VIEW: Data health check
-- ============================================
CREATE OR REPLACE VIEW data_health_check AS
SELECT
  'Orphaned Devices' as issue_type,
  COUNT(*) as count
FROM devices d
LEFT JOIN users u ON d.created_by = u.id
WHERE u.id IS NULL

UNION ALL

SELECT
  'Orphaned Energy Logs' as issue_type,
  COUNT(*) as count
FROM energy_logs el
LEFT JOIN devices d ON el.device_id = d.id
WHERE d.id IS NULL

UNION ALL

SELECT
  'Energy Logs with Invalid Users' as issue_type,
  COUNT(*) as count
FROM energy_logs el
WHERE NOT EXISTS (
  SELECT 1 FROM users u
  WHERE u.id = ANY(el.assigned_users)
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE 'Next step: Run 2-sync-auth-users.sql to link your auth users';
END $$;
