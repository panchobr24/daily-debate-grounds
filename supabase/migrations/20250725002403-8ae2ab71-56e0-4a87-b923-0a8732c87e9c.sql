-- Manually rotate topics since automated system needs pg_net
-- First, deactivate all current rooms
UPDATE debate_rooms SET is_active = false WHERE is_active = true;

-- Create new debate rooms with fresh topics
INSERT INTO debate_rooms (title, description, topic, is_active, expires_at) VALUES
('Climate Change Action', 'Individual vs collective responsibility for environmental change', 'Are individual actions enough to combat climate change?', true, NOW() + INTERVAL '24 hours'),
('Future of Work', 'The evolution of work in the digital age', 'Will remote work become the permanent standard?', true, NOW() + INTERVAL '24 hours'),
('Privacy vs Security', 'Balancing personal privacy with collective security', 'Should governments have access to private communications for security?', true, NOW() + INTERVAL '24 hours'),
('Educational Reform', 'Transforming education for the modern world', 'Do traditional schools prepare students for today''s challenges?', true, NOW() + INTERVAL '24 hours'),
('Social Media Impact', 'The effects of social platforms on society', 'Do social media platforms do more harm than good?', true, NOW() + INTERVAL '24 hours'),
('Universal Basic Income', 'Economic safety nets for the future', 'Should governments provide universal basic income?', true, NOW() + INTERVAL '24 hours');