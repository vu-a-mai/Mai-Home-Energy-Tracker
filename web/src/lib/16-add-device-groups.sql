-- Migration: Add Device Groups Table
-- This allows users to create groups of devices for faster logging

-- Create device_groups table
CREATE TABLE IF NOT EXISTS device_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL,
  group_name TEXT NOT NULL,
  device_ids UUID[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_groups_household ON device_groups(household_id);
CREATE INDEX IF NOT EXISTS idx_device_groups_created_by ON device_groups(created_by);

-- Enable RLS
ALTER TABLE device_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for device_groups
CREATE POLICY "Users can view device groups in their household"
  ON device_groups FOR SELECT
  USING (household_id = (SELECT get_user_household_id()));

CREATE POLICY "Users can create device groups in their household"
  ON device_groups FOR INSERT
  WITH CHECK (
    household_id = (SELECT get_user_household_id()) AND
    created_by = auth.uid()
  );

CREATE POLICY "Users can update their own device groups"
  ON device_groups FOR UPDATE
  USING (
    household_id = (SELECT get_user_household_id()) AND
    created_by = auth.uid()
  );

CREATE POLICY "Users can delete their own device groups"
  ON device_groups FOR DELETE
  USING (
    household_id = (SELECT get_user_household_id()) AND
    created_by = auth.uid()
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_device_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER device_groups_updated_at
  BEFORE UPDATE ON device_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_device_groups_updated_at();

-- Add comment
COMMENT ON TABLE device_groups IS 'Stores user-defined groups of devices for quick multi-device logging';
