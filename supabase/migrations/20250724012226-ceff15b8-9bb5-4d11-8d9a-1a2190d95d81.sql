-- Update existing debate rooms to English
UPDATE debate_rooms SET 
  title = 'Technology vs Humanity',
  topic = 'Is technological dependency harming our social skills?',
  description = 'Are we becoming more connected to devices but disconnected from each other?'
WHERE topic = 'A dependência tecnológica está prejudicando nossas habilidades sociais?';

UPDATE debate_rooms SET 
  title = 'Remote Work Future',
  topic = 'Should companies allow permanent remote work?',
  description = 'Is the future of work 100% remote or hybrid?'
WHERE topic = 'As empresas devem permitir trabalho remoto permanente?';

UPDATE debate_rooms SET 
  title = 'Social Media Impact',
  topic = 'Should there be a minimum age for social media use?',
  description = 'Do social networks do more harm than good?'
WHERE topic = 'Deveria haver idade mínima para usar redes sociais?';

UPDATE debate_rooms SET 
  title = 'Environmental Responsibility',
  topic = 'Can individuals make a difference in environmental protection?',
  description = 'Climate change: individual or corporate responsibility?'
WHERE topic = 'Cada pessoa pode fazer diferença no meio ambiente?';

UPDATE debate_rooms SET 
  title = 'Digital Education',
  topic = 'Does traditional education need a digital revolution?',
  description = 'Is online teaching as effective as in-person learning?'
WHERE topic = 'A educação tradicional precisa de uma revolução digital?';

UPDATE debate_rooms SET 
  title = 'Artificial Intelligence',
  topic = 'Should we fear or embrace artificial intelligence?',
  description = 'Will AI create or destroy jobs?'
WHERE topic = 'Devemos ter medo ou abraçar a inteligência artificial?';