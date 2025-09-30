-- Database schema for Mai Home Energy Tracker
-- Updated to handle existing tables gracefully

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  household_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  wattage INTEGER NOT NULL,
  location TEXT,
  sharing_type TEXT CHECK (sharing_type IN ('personal', 'shared')),
  household_id UUID NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Energy logs table
CREATE TABLE IF NOT EXISTS energy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id),
  usage_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  calculated_cost DECIMAL(10,2),
  total_kwh DECIMAL(10,4),
  rate_breakdown JSONB,
  household_id UUID NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Energy log users junction table
CREATE TABLE IF NOT EXISTS energy_log_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  energy_log_id UUID REFERENCES energy_logs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  cost_share DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bill splits table
CREATE TABLE IF NOT EXISTS bill_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  user_allocations JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to existing tables if they don't exist
DO $$ 
BEGIN
  -- Add updated_at to users if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;
  
  -- Add updated_at to devices if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='devices' AND column_name='updated_at') THEN
    ALTER TABLE devices ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;
  
  -- Add calculated_cost to energy_logs if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='energy_logs' AND column_name='calculated_cost') THEN
    ALTER TABLE energy_logs ADD COLUMN calculated_cost DECIMAL(10,2);
  END IF;
  
  -- Add updated_at to energy_logs if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='energy_logs' AND column_name='updated_at') THEN
    ALTER TABLE energy_logs ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;
  
  -- Update bill_splits structure if needed
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bill_splits' AND column_name='month') THEN
    ALTER TABLE bill_splits ADD COLUMN month INTEGER;
    ALTER TABLE bill_splits ADD COLUMN year INTEGER;
    ALTER TABLE bill_splits ADD COLUMN total_amount DECIMAL(10,2);
  END IF;
  
  -- Add updated_at to bill_splits if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bill_splits' AND column_name='updated_at') THEN
    ALTER TABLE bill_splits ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;
END $$;
