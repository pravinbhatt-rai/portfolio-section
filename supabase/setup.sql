-- Run this complete, rerunnable setup in Supabase Dashboard → SQL Editor.
-- It creates and seeds the portfolio CMS, analytics, skills, comments, roles, and career timeline.

-- Portfolio CMS content and privacy-light daily page counts.
create extension if not exists pgcrypto;

create table if not exists public.portfolio_content (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('project', 'blog', 'achievement')),
  slug text not null,
  title text not null,
  summary text not null default '',
  body text not null default '',
  thumbnail_url text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (type, slug)
);

create table if not exists public.portfolio_page_views (
  id bigint generated always as identity primary key,
  visitor_id uuid not null,
  path text not null,
  visit_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_daily_visitors (
  visitor_id uuid not null,
  visit_date date not null default current_date,
  primary key (visitor_id, visit_date)
);

alter table public.portfolio_content enable row level security;
alter table public.portfolio_page_views enable row level security;
alter table public.portfolio_daily_visitors enable row level security;
-- Reads and writes go through server routes. Never expose the service role key in the browser.
revoke all on public.portfolio_content from anon, authenticated;
revoke all on public.portfolio_page_views from anon, authenticated;
revoke all on public.portfolio_daily_visitors from anon, authenticated;
grant usage on schema public to service_role;
grant all on public.portfolio_content, public.portfolio_page_views, public.portfolio_daily_visitors to service_role;
grant all on all sequences in schema public to service_role;
create index if not exists portfolio_content_public_idx on public.portfolio_content(type, published, updated_at desc);
create index if not exists portfolio_page_views_day_idx on public.portfolio_page_views(visit_date desc);
create index if not exists portfolio_page_views_path_idx on public.portfolio_page_views(path);

create or replace function public.portfolio_dashboard_stats()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'views', (select count(*) from public.portfolio_page_views),
    'visitors', (select count(*) from public.portfolio_daily_visitors),
    'paths', coalesce((
      select jsonb_agg(jsonb_build_array(path, views) order by views desc)
      from (select path, count(*) as views from public.portfolio_page_views group by path order by views desc limit 8) popular
    ), '[]'::jsonb)
  );
$$;
revoke all on function public.portfolio_dashboard_stats() from public, anon, authenticated;
grant execute on function public.portfolio_dashboard_stats() to service_role;

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.project_skills (
  project_id uuid not null references public.portfolio_content(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  primary key (project_id, skill_id)
);

create table if not exists public.portfolio_comments (
  id uuid primary key default gen_random_uuid(),
  project_slug text not null,
  commenter_id uuid not null,
  author_name text not null check (char_length(author_name) between 2 and 48),
  message text not null check (char_length(message) between 12 and 1200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (project_slug, commenter_id, submitted_date)
);

-- Authenticated comments and likes for public project and blog pages.
alter table public.portfolio_comments add column if not exists content_type text not null default 'project' check (content_type in ('project','blog'));
alter table public.portfolio_comments drop constraint if exists portfolio_comments_project_slug_commenter_id_submitted_date_key;
create unique index if not exists portfolio_comments_daily_user_idx on public.portfolio_comments(content_type, project_slug, commenter_id, submitted_date);

create table if not exists public.portfolio_reactions (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('project','blog')),
  content_slug text not null,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique (content_type, content_slug, user_id)
);
alter table public.portfolio_reactions enable row level security;
revoke all on public.portfolio_reactions from anon, authenticated;
grant all on public.portfolio_reactions to service_role;

create or replace function public.portfolio_reaction_summary(content_type text, content_slug text, viewer_id uuid default null)
returns table(count bigint, user_liked boolean)
language sql stable security definer set search_path = public
as $$
  select count(*)::bigint, coalesce(bool_or(user_id = viewer_id), false)
  from public.portfolio_reactions
  where portfolio_reactions.content_type = $1 and portfolio_reactions.content_slug = $2;
$$;
revoke all on function public.portfolio_reaction_summary(text,text,uuid) from public, anon, authenticated;
grant execute on function public.portfolio_reaction_summary(text,text,uuid) to service_role;

create table if not exists public.portfolio_user_roles (
  email text primary key,
  role text not null check (role in ('admin','editor','viewer')),
  updated_at timestamptz not null default now()
);
alter table public.portfolio_user_roles enable row level security;
revoke all on public.portfolio_user_roles from anon, authenticated;
grant all on public.portfolio_user_roles to service_role;

alter table public.skills enable row level security;
alter table public.project_skills enable row level security;
alter table public.portfolio_comments enable row level security;
revoke all on public.skills from anon, authenticated;
revoke all on public.project_skills from anon, authenticated;
revoke all on public.portfolio_comments from anon, authenticated;
grant all on public.skills, public.project_skills, public.portfolio_comments to service_role;
create index if not exists project_skills_skill_idx on public.project_skills(skill_id);
create index if not exists portfolio_comments_review_idx on public.portfolio_comments(status, created_at desc);

-- Seed the portfolio's current case studies. Re-running the setup preserves edits.
insert into public.portfolio_content (type, slug, title, summary, body, published) values
('project', 'orchestration', 'Multi-Agent Orchestration Platform', 'An event-driven runtime for independent and coordinated process execution.', 'Built an event-driven task orchestration runtime with FastAPI, PostgreSQL, Redis, Docker, and Qdrant. Isolated execution and reliable coordination support concurrent AI workflows.', true),
('project', 'doctar', 'Doctar — Healthcare discovery APIs', 'Healthcare discovery platform service improvements.', 'Redesigned service workflows and database access, improved request efficiency through batching and caching, and strengthened logging across application layers.', true),
('project', 'six-finance', 'Six Finance — Faster financial services', 'Faster experiences across loans, credit cards, and insurance.', 'Improved API response times and page loading by redesigning data fetching, database access, request batching, and caching.', true),
('project', 'fitness', 'Fitness & Nutrition Tracking', 'Image-based food recognition and personalized nutrition.', 'Built a backend for image-based food recognition, calorie tracking, and personalized nutrition analysis with a retrieval pipeline.', true)
on conflict (type, slug) do nothing;

-- Tell PostgREST to make newly created tables available immediately.
notify pgrst, 'reload schema';

insert into public.skills (name, category, description, sort_order) values
('Python', 'Languages', 'Backend services, APIs, and AI workflows.', 1),
('TypeScript', 'Languages', 'Typed, dependable application code.', 2),
('JavaScript', 'Languages', 'Interactive web experiences and server logic.', 3),
('Java', 'Languages', 'Object-oriented programming and application fundamentals.', 4),
('SQL', 'Languages & Data', 'Querying and shaping relational data.', 5),
('FastAPI', 'Backend & APIs', 'Async Python APIs and service design.', 10),
('Spring Boot', 'Backend & APIs', 'Structured Java service development.', 11),
('Node.js', 'Backend & APIs', 'Server-side JavaScript and service integrations.', 12),
('REST APIs', 'Backend & APIs', 'Clear service contracts for product teams.', 13),
('Microservices', 'Backend & APIs', 'Small services with explicit boundaries.', 14),
('Async systems', 'Backend & APIs', 'Concurrent work and event-driven flows.', 15),
('PostgreSQL', 'Data & Infrastructure', 'Relational modeling, indexing, and query design.', 20),
('Redis', 'Data & Infrastructure', 'Queues, caching, and fast shared state.', 21),
('Qdrant', 'Data & Infrastructure', 'Vector storage and semantic retrieval.', 22),
('pgvector', 'Data & Infrastructure', 'Vector similarity search in PostgreSQL.', 23),
('Docker', 'Data & Infrastructure', 'Repeatable environments and isolated workloads.', 24),
('AWS EC2 + S3', 'Data & Infrastructure', 'Cloud compute and object storage.', 25),
('GitHub Actions', 'Data & Infrastructure', 'Automated build and delivery workflows.', 26),
('Caching & batching', 'Data & Infrastructure', 'Reducing repeated work across API flows.', 27),
('RAG', 'AI Engineering', 'Grounding model responses in relevant context.', 30),
('LangChain', 'AI Engineering', 'Composable building blocks for language model apps.', 31),
('LangGraph', 'AI Engineering', 'Stateful, multi-step model workflows.', 32),
('OpenAI API', 'AI Engineering', 'Integrating language models into applications.', 33),
('Claude API', 'AI Engineering', 'Model-powered workflows and tool use.', 34),
('Multi-agent systems', 'AI Engineering', 'Independent agents coordinated by reliable orchestration.', 35),
('Data structures & algorithms', 'CS Foundations', '800+ problem-solving exercises and counting.', 40),
('System design', 'CS Foundations', 'Tradeoffs across data, scale, and product behavior.', 41),
('Distributed systems', 'CS Foundations', 'Reliability, coordination, and failure boundaries.', 42),
('Concurrency', 'CS Foundations', 'Reasoning about parallel work and shared resources.', 43),
('React + Next.js', 'Web Engineering', 'Building responsive, server-rendered web applications.', 50),
('HTML + CSS', 'Web Engineering', 'Accessible interface structure and visual systems.', 51),
('Linux', 'Cloud & Operations', 'Linux environments and command-line workflows.', 52),
('Async/event-driven design', 'Backend & APIs', 'Concurrent services and event-driven workflows.', 53)
on conflict (name) do nothing;

update public.skills
set description = '800+ problem-solving exercises and counting.'
where name = 'Data structures & algorithms';

with links (skill_name, project_slug) as (values
  ('Python','orchestration'), ('Python','doctar'), ('Python','six-finance'), ('Python','fitness'),
  ('TypeScript','orchestration'), ('JavaScript','orchestration'), ('Java','doctar'), ('SQL','doctar'), ('SQL','six-finance'),
  ('FastAPI','orchestration'), ('FastAPI','fitness'), ('REST APIs','orchestration'), ('REST APIs','doctar'), ('REST APIs','six-finance'), ('REST APIs','fitness'),
  ('Microservices','orchestration'), ('Microservices','doctar'), ('Microservices','six-finance'), ('Async systems','orchestration'),
  ('PostgreSQL','orchestration'), ('PostgreSQL','doctar'), ('PostgreSQL','six-finance'), ('PostgreSQL','fitness'),
  ('Redis','orchestration'), ('Redis','six-finance'), ('Qdrant','orchestration'), ('pgvector','fitness'),
  ('Docker','orchestration'), ('Docker','doctar'), ('Docker','six-finance'), ('AWS EC2 + S3','doctar'), ('GitHub Actions','orchestration'),
  ('Caching & batching','doctar'), ('Caching & batching','six-finance'), ('RAG','orchestration'), ('RAG','fitness'),
  ('LangChain','orchestration'), ('LangGraph','orchestration'), ('OpenAI API','orchestration'), ('Claude API','orchestration'), ('Multi-agent systems','orchestration'),
  ('Data structures & algorithms','orchestration'), ('System design','orchestration'), ('System design','doctar'), ('System design','six-finance'),
  ('Distributed systems','orchestration'), ('Distributed systems','doctar'), ('Concurrency','orchestration'),
  ('React + Next.js','orchestration'), ('HTML + CSS','orchestration')
)
insert into public.project_skills (project_id, skill_id)
select p.id, s.id from links l join public.skills s on s.name = l.skill_name join public.portfolio_content p on p.type = 'project' and p.slug = l.project_slug
on conflict do nothing;


-- Resume-backed achievements and profile milestones (safe to rerun).
insert into public.portfolio_content (type, slug, title, summary, body, published) values
('achievement', '800-algorithm-problems', '800+ algorithm problems solved', 'Consistent practice across data structures and algorithms.', 'Solved more than 800 programming and algorithmic problems across coding platforms, strengthening problem solving and core computer science foundations.', true),
('achievement', 'six-finance-built-from-scratch', 'Built Six Finance from scratch', 'A fintech platform for loans, credit cards, and insurance.', 'Contributed across product development, responsive interfaces, backend APIs, database workflows, optimization, and delivery.', true),
('achievement', 'doctar-organic-growth', 'Doctar.in reached 500–700 clicks in 28 days', 'Organic search growth for a healthcare discovery platform.', 'Helped grow Doctar.in organic search traffic from near zero to approximately 500–700 clicks in 28 days.', true),
('achievement', 'technical-seo-top-ten', 'Top 10 search rankings across India', 'Technical SEO and performance work on used-vehicle pages.', 'Improved Google search rankings for multiple used-vehicle pages, reaching Top 10 positions across India.', true)
on conflict (type, slug) do nothing;

notify pgrst, 'reload schema';

-- Career journey milestones for the portfolio. Apply in Supabase SQL Editor.
create table if not exists public.career_milestones (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 180),
  category text not null check (category in ('Education', 'Experience', 'Project', 'Achievement')),
  organization text not null check (char_length(organization) between 2 and 180),
  role text not null check (char_length(role) between 2 and 180),
  start_date date not null,
  end_date date,
  description text not null default '' check (char_length(description) <= 2400),
  achievements text[] not null default '{}',
  technologies text[] not null default '{}',
  location text not null default '',
  logo_url text not null default '',
  position text not null default 'left' check (position in ('left', 'right', 'center')),
  is_published boolean not null default false,
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (title, organization, start_date),
  check (end_date is null or end_date >= start_date)
);

alter table public.career_milestones enable row level security;
revoke all on public.career_milestones from anon, authenticated;
grant all on public.career_milestones to service_role;
create index if not exists career_milestones_public_order_idx
  on public.career_milestones(is_published, sort_order, start_date);

-- The server uploads validated logos with its service role key; this bucket is public for image reads.
insert into storage.buckets (id, name, public)
values ('portfolio-logos', 'portfolio-logos', true)
on conflict (id) do update set public = excluded.public;

insert into public.career_milestones
  (title, category, organization, role, start_date, end_date, description, achievements, technologies, location, position, is_published, sort_order)
values
  (
    'B.Tech — Computer Science & Engineering', 'Education', 'Roorkee Institute of Technology (RIT)', 'Bachelor of Technology',
    '2022-01-01', '2026-01-31',
    'Completed my Bachelor’s degree in Computer Science and Engineering, developing strong foundations in software engineering, data structures, algorithms, databases, operating systems, and computer networks.',
    array['Computer Science & Engineering', 'Data Structures and Algorithms', 'Object-Oriented Programming', 'Database Management Systems', 'Software Engineering'],
    array['Algorithms', 'Databases', 'Operating Systems', 'Computer Networks'], 'Roorkee, India', 'left', true, 10
  ),
  (
    'Lead Developer', 'Experience', 'Six India Private Limited', 'Lead Developer',
    '2025-07-01', '2026-03-31',
    'Led technical development and optimization initiatives across production applications, focusing on backend performance, infrastructure, frontend optimization, and technical SEO.',
    array['Improved API latency through database query optimization and better data-fetching strategies', 'Reduced repeated frontend-to-backend requests through batching and caching', 'Improved page-load performance and production reliability through cross-layer debugging and monitoring', 'Achieved Top 10 Google rankings for multiple used-vehicle pages across India', 'Worked across Docker, backend APIs, databases, and production infrastructure'],
    array['Docker', 'Backend APIs', 'PostgreSQL', 'MongoDB', 'Technical SEO'], 'India', 'right', true, 20
  ),
  (
    'Software Developer Intern', 'Experience', 'Six India Private Limited', 'Software Developer Intern',
    '2025-08-01', '2026-02-28',
    'Worked across fintech and healthcare products, contributing to full-stack development, application architecture, backend APIs, database workflows, and production-ready software.',
    array['Contributed to building Six Finance from scratch', 'Developed Doctar, a healthcare discovery and appointment-booking platform', 'Built responsive interfaces, REST APIs, and database workflows'],
    array['Next.js', 'TypeScript', 'PostgreSQL', 'MongoDB', 'REST APIs'], 'India', 'left', true, 30
  )
on conflict (title, organization, start_date) do nothing;

update public.career_milestones
set end_date = '2026-03-31',
    description = 'Led technical development and optimization initiatives across production applications, focusing on backend performance, infrastructure, frontend optimization, and technical SEO.',
    achievements = array[
      'Improved API latency through database query optimization and better data-fetching strategies',
      'Reduced repeated frontend-to-backend requests through batching and caching',
      'Improved page-load performance and production reliability through cross-layer debugging and monitoring',
      'Achieved Top 10 Google rankings for multiple used-vehicle pages across India',
      'Worked across Docker, backend APIs, databases, and production infrastructure'
    ],
    technologies = array['Docker', 'Backend APIs', 'PostgreSQL', 'MongoDB', 'Technical SEO'],
    location = 'Kolkata, India'
where title = 'Lead Developer'
  and organization = 'Six India Private Limited'
  and start_date = '2025-07-01';

update public.career_milestones
set description = 'Worked across fintech and healthcare products, contributing to full-stack development, application architecture, backend APIs, database workflows, and production-ready software.',
    achievements = array[
      'Contributed to building Six Finance from scratch',
      'Developed Doctar, a healthcare discovery and appointment-booking platform',
      'Built responsive interfaces, REST APIs, and database workflows'
    ],
    technologies = array['Next.js', 'TypeScript', 'PostgreSQL', 'MongoDB', 'REST APIs'],
    location = 'Kolkata, India'
where title = 'Software Developer Intern'
  and organization = 'Six India Private Limited'
  and start_date = '2025-08-01';

-- Refresh PostgREST's table cache after applying the timeline schema.
notify pgrst, 'reload schema';
