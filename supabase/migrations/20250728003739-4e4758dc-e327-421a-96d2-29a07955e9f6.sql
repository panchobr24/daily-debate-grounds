-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the daily topic generation to run every day at midnight UTC
SELECT cron.schedule(
  'generate-daily-topics',
  '0 0 * * *', -- Every day at midnight UTC
  $$
  SELECT
    net.http_post(
        url:='https://jvwpsbbaulvnicjhaesi.supabase.co/functions/v1/generate-daily-topics',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2d3BzYmJhdWx2bmljamhhZXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTcyODUsImV4cCI6MjA2ODg3MzI4NX0.yDvi63xIuobIXJ57djyAoWZwiiiYwdfwK7BgCvLDit4"}'::jsonb,
        body:='{"source": "cron_job"}'::jsonb
    ) as request_id;
  $$
);

-- Also enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;