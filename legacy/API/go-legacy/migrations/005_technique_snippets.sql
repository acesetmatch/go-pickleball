-- Add technique-focused snippets for better domain-specific RAG results
-- These snippets provide pickleball-specific context for shot types and paddle characteristics

INSERT INTO rag_snippets (id, paddle_id, source, kind, text) VALUES
-- ENGAGE PURSUIT MX 6.0 - Control-oriented paddle
(gen_random_uuid(), 'ENGAGE-PURSUIT-MX-6.0-2023', 'technique', 'reset', 'Control-focused paddle ideal for soft reset shots with minimal spin and precise placement'),
(gen_random_uuid(), 'ENGAGE-PURSUIT-MX-6.0-2023', 'technique', 'dink', 'Excellent touch and feel for controlled dinking exchanges at the net'),
(gen_random_uuid(), 'ENGAGE-PURSUIT-MX-6.0-2023', 'technique', 'defense', 'Forgiving paddle face provides consistent defensive shots and blocks'),

-- JOOLA BEN JOHNS HYPERION - Power-oriented paddle  
(gen_random_uuid(), 'JOOLA-BEN-JOHNS-HYPERION-2023', 'technique', 'drive', 'Power paddle designed for aggressive topspin drives and attacking shots from baseline'),
(gen_random_uuid(), 'JOOLA-BEN-JOHNS-HYPERION-2023', 'technique', 'attack', 'Heavy swingweight generates pace for offensive putaways and third shot attacks'),
(gen_random_uuid(), 'JOOLA-BEN-JOHNS-HYPERION-2023', 'technique', 'spin', 'Textured surface and weight distribution optimize topspin generation'),

-- SELKIRK AMPED S2 - Balanced paddle
(gen_random_uuid(), 'SELKIRK-AMPED-S2-2023', 'technique', 'allcourt', 'Versatile paddle suitable for all-court play with balanced power and control'),
(gen_random_uuid(), 'SELKIRK-AMPED-S2-2023', 'technique', 'transition', 'Mid-weight design allows smooth transitions between offensive and defensive play'),
(gen_random_uuid(), 'SELKIRK-AMPED-S2-2023', 'technique', 'volley', 'Stable paddle face provides reliable volleys and quick exchanges');
