-- Enable http extension for pg_net functionality
CREATE EXTENSION IF NOT EXISTS http;

-- Enable pg_net extension for making HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update cron job to use pg_net.http_post instead of net.http_post
SELECT cron.unschedule('rotate-debate-topics-daily');

SELECT cron.schedule(
  'rotate-debate-topics-daily',
  '0 0 * * *', -- Daily at midnight UTC
  $$
  SELECT
    pg_net.http_post(
        url:='https://jvwpsbbaulvnicjhaesi.supabase.co/functions/v1/rotate-debate-topics',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2d3BzYmJhdWx2bmljamhhZXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTcyODUsImV4cCI6MjA2ODg3MzI4NX0.yDvi63xIuobIXJ57djyAoWZwiiiYwdfwK7BgCvLDit4"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Manually trigger the function to rotate topics right now
SELECT
  pg_net.http_post(
      url:='https://jvwpsbbaulvnicjhaesi.supabase.co/functions/v1/rotate-debate-topics',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2d3BzYmJhdWx2bmljamhhZXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTcyODUsImV4cCI6MjA2ODg3MzI4NX0.yDvi63xIuobIXJ57djyAoWZwiiiYwdfwK7BgCvLDit4"}'::jsonb,
      body:='{"manual_trigger": true}'::jsonb
  ) as request_id;