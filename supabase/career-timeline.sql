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
