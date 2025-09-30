-- Metric snippet with normalized units (oz to grams)
INSERT INTO rag_snippets (paddle_id, source, kind, text, extra)
SELECT
  p.paddle_id,
  'db:performance',
  'metric',
  'Swingweight ' || perf.swing_weight || ' kg·cm²; balance ' || perf.balance_point || ' cm; avg weight ' || ROUND((specs.average_weight * 28.3495)::numeric, 1) || ' g',
  jsonb_strip_nulls(jsonb_build_object(
     'swingweight_kgcm2', perf.swing_weight,
     'balance_cm',        perf.balance_point,
     'weight_g',          ROUND((specs.average_weight * 28.3495)::numeric, 1) ))
FROM paddles p
JOIN paddle_specs specs ON p.id = specs.paddle_id
JOIN paddle_performance perf ON specs.id = perf.paddle_spec_id
WHERE perf.swing_weight IS NOT NULL 
   OR perf.balance_point IS NOT NULL 
   OR specs.average_weight IS NOT NULL;

-- Simple spin claim
INSERT INTO rag_snippets (paddle_id, source, kind, text, extra)
SELECT
  p.paddle_id, 
  'db:performance', 
  'claim',
  CASE WHEN perf.spin >= 0.80
       THEN 'Above-median spin for its class'
       WHEN perf.spin IS NULL
       THEN 'Spin not reported in DB'
       ELSE 'Spin is typical for its class' END,
  jsonb_strip_nulls(jsonb_build_object('spin_score', perf.spin))
FROM paddles p
LEFT JOIN paddle_specs specs ON p.id = specs.paddle_id
LEFT JOIN paddle_performance perf ON specs.id = perf.paddle_spec_id;
