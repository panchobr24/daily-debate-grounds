-- Manually rotate debate topics
UPDATE public.debate_rooms SET is_active = false WHERE is_active = true;

INSERT INTO public.debate_rooms (title, topic, description, is_active, expires_at) VALUES
('Climate Change Action', 'Are individual actions enough to combat climate change?', 'Individual vs collective responsibility for environmental change', true, now() + interval '24 hours'),
('Future of Work', 'Will remote work become the permanent standard?', 'The evolution of work in the digital age', true, now() + interval '24 hours'),
('Privacy vs Security', 'Should governments have access to private communications for security?', 'Balancing personal privacy with collective security', true, now() + interval '24 hours'),
('Educational Reform', 'Do traditional schools prepare students for today''s challenges?', 'Transforming education for the modern world', true, now() + interval '24 hours'),
('Social Media Impact', 'Do social media platforms do more harm than good?', 'The effects of social platforms on society', true, now() + interval '24 hours'),
('Universal Basic Income', 'Should governments provide universal basic income?', 'Economic safety nets for the future', true, now() + interval '24 hours');