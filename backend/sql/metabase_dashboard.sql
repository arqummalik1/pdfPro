-- PDFPro analytics helpers for Metabase
-- Safe to run multiple times.

CREATE OR REPLACE VIEW public.v_web_analytics_daily AS
SELECT
  DATE(created_at) AS day,
  COUNT(*) AS total_events,
  COUNT(*) FILTER (WHERE event_name = 'page_view') AS page_views,
  COUNT(DISTINCT session_id) FILTER (WHERE session_id IS NOT NULL) AS unique_sessions,
  COUNT(*) FILTER (WHERE event_name = 'tool_process_started') AS tool_starts,
  COUNT(*) FILTER (WHERE event_name = 'tool_process_succeeded') AS tool_successes,
  COUNT(*) FILTER (WHERE event_name = 'tool_process_failed') AS tool_failures,
  COUNT(*) FILTER (WHERE event_name = 'tool_output_downloaded') AS downloads
FROM public.web_analytics_events
GROUP BY 1;

CREATE OR REPLACE VIEW public.v_tool_performance AS
SELECT
  COALESCE(tool_id, 'unknown') AS tool_id,
  COUNT(*) FILTER (WHERE event_name = 'tool_process_started') AS starts,
  COUNT(*) FILTER (WHERE event_name = 'tool_process_succeeded') AS successes,
  COUNT(*) FILTER (WHERE event_name = 'tool_process_failed') AS failures,
  COUNT(*) FILTER (WHERE event_name = 'tool_output_downloaded') AS downloads,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE event_name = 'tool_process_succeeded')
    / NULLIF(COUNT(*) FILTER (WHERE event_name = 'tool_process_started'), 0),
    2
  ) AS success_rate_percent
FROM public.web_analytics_events
GROUP BY 1;

CREATE OR REPLACE VIEW public.v_web_vitals_summary AS
SELECT
  metadata->>'metricName' AS metric_name,
  metadata->>'rating' AS rating,
  COUNT(*) AS sample_count,
  ROUND(AVG(duration_ms)::numeric, 2) AS avg_metric_value
FROM public.web_analytics_events
WHERE event_name = 'web_vital_recorded'
GROUP BY 1, 2;

-- Suggested dashboard questions:
-- 1) Daily trend
SELECT * FROM public.v_web_analytics_daily ORDER BY day DESC;

-- 2) Top tools by starts
SELECT tool_id, starts
FROM public.v_tool_performance
ORDER BY starts DESC;

-- 3) Tool reliability
SELECT tool_id, successes, failures, success_rate_percent
FROM public.v_tool_performance
ORDER BY success_rate_percent DESC NULLS LAST;

-- 4) Download intent by tool
SELECT tool_id, downloads
FROM public.v_tool_performance
ORDER BY downloads DESC;

-- 5) Core Web Vitals distribution
SELECT * FROM public.v_web_vitals_summary
ORDER BY metric_name, sample_count DESC;
