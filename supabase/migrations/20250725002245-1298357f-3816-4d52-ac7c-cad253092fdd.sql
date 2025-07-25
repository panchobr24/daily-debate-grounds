-- Manually trigger topic rotation to test the function
SELECT
  net.http_post(
      url:='https://jvwpsbbaulvnicjhaesi.supabase.co/functions/v1/rotate-debate-topics',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2d3BzYmJhdWx2bmljamhhZXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTcyODUsImV4cCI6MjA2ODg3MzI4NX0.yDvi63xIuobIXJ57djyAoWZwiiiYwdfwK7BgCvLDit4"}'::jsonb,
      body:='{"manual_trigger": true}'::jsonb
  ) as request_id;