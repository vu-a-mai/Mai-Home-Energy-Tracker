-- ============================================
-- Migration: Schedule hourly auto-scheduling cron
-- ============================================
-- Requires: 55-complete-auto-scheduling.sql already applied
-- Requires: pg_cron extension available in the Supabase project
-- Created: 2026-07-30
-- ============================================
-- Safe to re-run: unschedules existing job by name before scheduling.

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove previous schedule if present (ignore if missing)
DO $$
BEGIN
  PERFORM cron.unschedule('mai-run-due-recurring-schedules');
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'pg_cron cron schema not available yet';
  WHEN OTHERS THEN
    -- Job may not exist yet
    NULL;
END $$;

-- Hourly: run service-role due schedule generator
SELECT cron.schedule(
  'mai-run-due-recurring-schedules',
  '5 * * * *',
  $$SELECT public.run_due_recurring_schedules();$$
);

COMMENT ON EXTENSION pg_cron IS
  'Used by Mai Home Energy Tracker to run household-timezone recurring schedule generation hourly.';
