-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the debate topic rotation to run every day at midnight UTC
SELECT cron.schedule(
  'rotate-debate-topics-daily',
  '0 0 * * *', -- Daily at midnight UTC
  $$
  SELECT
    net.http_post(
        url:='https://jvwpsbbaulvnicjhaesi.supabase.co/functions/v1/rotate-debate-topics',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2d3BzYmJhdWx2bmljamhhZXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTcyODUsImV4cCI6MjA2ODg3MzI4NX0.yDvi63xIuobIXJ57djyAoWZwiiiYwdfwK7BgCvLDit4"}'::jsonb,
        body:='{"time": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);