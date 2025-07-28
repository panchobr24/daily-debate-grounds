-- Deactivate old topics and create new AI-generated topics for today
UPDATE debate_rooms SET is_active = false WHERE is_active = true;

-- Insert 6 new AI-generated topics for today
INSERT INTO debate_rooms (title, topic, description, is_active, created_at, expires_at) VALUES
('Digital Privacy', 'Should AI companies be required to disclose their training data sources?', 'The debate over transparency in AI development and intellectual property rights.', true, now(), now() + interval '24 hours'),
('Climate Innovation', 'Can geoengineering solve climate change without reducing emissions?', 'Exploring technological solutions versus traditional environmental approaches.', true, now(), now() + interval '24 hours'),
('Future of Education', 'Should universities offer AI-assisted degrees and certifications?', 'The integration of artificial intelligence in higher education credentials.', true, now(), now() + interval '24 hours'),
('Workplace Evolution', 'Will virtual reality replace physical office spaces by 2030?', 'The potential of VR technology to transform remote work permanently.', true, now(), now() + interval '24 hours'),
('Digital Democracy', 'Should social media algorithms be regulated by government?', 'Balancing free speech with the power of algorithmic content curation.', true, now(), now() + interval '24 hours'),
('Medical Ethics', 'Should genetic enhancement be available to all or remain luxury?', 'The accessibility and equality issues surrounding human genetic modification.', true, now(), now() + interval '24 hours');