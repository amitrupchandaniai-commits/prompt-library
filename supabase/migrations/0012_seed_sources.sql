insert into public.sources (name, url, type, trust_score, notes) values
  ('Simon Willison''s Weblog', 'https://simonwillison.net/atom/everything/', 'rss', 85,
   'Widely respected LLM practitioner; frequent, high-signal writing on prompting techniques and tool use.'),
  ('OpenAI News', 'https://openai.com/news/rss.xml', 'rss', 90,
   'Official OpenAI announcements, including product and technique updates.'),
  ('Google AI Blog', 'https://blog.google/technology/ai/rss/', 'rss', 90,
   'Official Google AI announcements and techniques.'),
  ('Latent.Space', 'https://www.latent.space/feed', 'rss', 75,
   'AI engineer newsletter/podcast covering agents, models, and applied technique.'),
  ('Hugging Face Blog', 'https://huggingface.co/blog/feed.xml', 'rss', 80,
   'Official Hugging Face ML/AI technique posts.');
