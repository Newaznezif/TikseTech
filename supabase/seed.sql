insert into program_categories (name, slug) values
  ('Programming / Software Development', 'programming-software-development'),
  ('Cybersecurity', 'cybersecurity'),
  ('Computer Networking', 'computer-networking'),
  ('Artificial Intelligence', 'artificial-intelligence'),
  ('Cloud & DevOps', 'cloud-devops'),
  ('Data & Analytics', 'data-analytics'),
  ('IT & Systems', 'it-systems'),
  ('UI/UX and Digital Technology', 'uiux-digital-technology')
on conflict (slug) do nothing;

insert into programs (
  slug, title, category, short_description, description, duration, difficulty, delivery_mode,
  eligibility, start_date, end_date, application_deadline, available_seats, current_participants,
  status, skills, learning_outcomes, requirements, application_questions
) values (
  'cybersecurity-internship',
  'Cybersecurity Internship Program',
  'Cybersecurity',
  'Develop practical skills in threat analysis, network defense, and secure operations.',
  'This program helps aspiring cybersecurity professionals learn threat analysis, secure operations, and digital defense.',
  '8 Weeks',
  'Beginner',
  'REMOTE',
  'WORLDWIDE',
  current_date + interval '10 day',
  current_date + interval '80 day',
  current_date + interval '5 day',
  35,
  18,
  'OPEN',
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
) on conflict (slug) do nothing;
