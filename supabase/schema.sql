create extension if not exists pgcrypto;

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null,
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists newsletter_subscribers_status_idx
  on public.newsletter_subscribers (status);

create index if not exists newsletter_subscribers_source_idx
  on public.newsletter_subscribers (source);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists newsletter_subscribers_set_updated_at
  on public.newsletter_subscribers;

create trigger newsletter_subscribers_set_updated_at
before update on public.newsletter_subscribers
for each row
execute function public.set_updated_at();

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Service role can manage newsletter subscribers"
  on public.newsletter_subscribers;

create policy "Service role can manage newsletter subscribers"
on public.newsletter_subscribers
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.resource_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  resource_id text not null,
  resource_title text not null,
  source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email, resource_id)
);

create index if not exists resource_leads_email_idx
  on public.resource_leads (email);

create index if not exists resource_leads_resource_id_idx
  on public.resource_leads (resource_id);

drop trigger if exists resource_leads_set_updated_at
  on public.resource_leads;

create trigger resource_leads_set_updated_at
before update on public.resource_leads
for each row
execute function public.set_updated_at();

alter table public.resource_leads enable row level security;

drop policy if exists "Service role can manage resource leads"
  on public.resource_leads;

create policy "Service role can manage resource leads"
on public.resource_leads
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.reader_favorites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  article_slug text not null,
  article_title text not null,
  created_at timestamptz not null default now(),
  unique (email, article_slug)
);

create index if not exists reader_favorites_email_idx
  on public.reader_favorites (email);

create index if not exists reader_favorites_article_slug_idx
  on public.reader_favorites (article_slug);

alter table public.reader_favorites enable row level security;

drop policy if exists "Service role can manage reader favorites"
  on public.reader_favorites;

create policy "Service role can manage reader favorites"
on public.reader_favorites
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  url text not null,
  bucket text not null,
  content_type text not null,
  size_bytes integer,
  alt text,
  source_url text,
  context text not null default 'admin-upload',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_assets_context_idx
  on public.media_assets (context);

create index if not exists media_assets_created_at_idx
  on public.media_assets (created_at desc);

drop trigger if exists media_assets_set_updated_at
  on public.media_assets;

create trigger media_assets_set_updated_at
before update on public.media_assets
for each row
execute function public.set_updated_at();

alter table public.media_assets enable row level security;

drop policy if exists "Service role can manage media assets"
  on public.media_assets;

create policy "Service role can manage media assets"
on public.media_assets
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  body text not null default '',
  date date not null default current_date,
  category text not null check (category in ('Build', 'AI', 'Growth', 'Solopreneur')),
  type text not null check (
    type in (
      'Tutorial',
      'Case Study',
      'Essay',
      'Build Log',
      'Product Review',
      'Founder Analysis',
      'Experiment'
    )
  ),
  reading_time text not null default '5 min',
  featured boolean not null default false,
  published boolean not null default false,
  archived boolean not null default false,
  number integer not null default 0,
  source text not null default 'Founder Hub',
  source_url text,
  verified boolean not null default true,
  access text not null default 'Free' check (access in ('Free', 'Deep Dive')),
  tags jsonb not null default '[]'::jsonb,
  audio_url text,
  cover text,
  locale text not null default 'zh-CN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_published_idx
  on public.articles (published);

create index if not exists articles_archived_idx
  on public.articles (archived);

create index if not exists articles_category_idx
  on public.articles (category);

create index if not exists articles_date_idx
  on public.articles (date desc);

drop trigger if exists articles_set_updated_at
  on public.articles;

create trigger articles_set_updated_at
before update on public.articles
for each row
execute function public.set_updated_at();

alter table public.articles enable row level security;

drop policy if exists "Service role can manage articles"
  on public.articles;

create policy "Service role can manage articles"
on public.articles
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.article_revisions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  title text not null,
  description text not null,
  body text not null,
  meta jsonb not null default '{}'::jsonb,
  created_by text not null default 'admin',
  created_at timestamptz not null default now()
);

create index if not exists article_revisions_article_id_idx
  on public.article_revisions (article_id, created_at desc);

alter table public.article_revisions enable row level security;

drop policy if exists "Service role can manage article revisions"
  on public.article_revisions;

create policy "Service role can manage article revisions"
on public.article_revisions
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.article_sources (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.articles(id) on delete set null,
  source_url text not null,
  source_title text,
  source_site text,
  author text,
  fetched_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (article_id, source_url)
);

create index if not exists article_sources_article_id_idx
  on public.article_sources (article_id);

create index if not exists article_sources_source_url_idx
  on public.article_sources (source_url);

create unique index if not exists article_sources_article_id_source_url_key
  on public.article_sources (article_id, source_url);

alter table public.article_sources enable row level security;

drop policy if exists "Service role can manage article sources"
  on public.article_sources;

create policy "Service role can manage article sources"
on public.article_sources
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.rss_items (
  id uuid primary key default gen_random_uuid(),
  feed_id text not null,
  feed_title text not null,
  feed_url text not null,
  title text not null,
  url text not null,
  canonical_url text not null unique,
  description text,
  published_at timestamptz,
  category text not null check (category in ('Build', 'AI', 'Growth', 'Solopreneur')),
  type text not null check (
    type in (
      'Tutorial',
      'Case Study',
      'Essay',
      'Build Log',
      'Product Review',
      'Founder Analysis',
      'Experiment'
    )
  ),
  language text not null default 'zh-CN',
  status text not null default 'pending' check (status in ('pending', 'selected', 'rejected', 'imported')),
  relevance_score integer check (relevance_score between 0 and 100),
  founder_value_score integer check (founder_value_score between 0 and 100),
  freshness_score integer check (freshness_score between 0 and 100),
  score integer check (score between 0 and 100),
  duplicate_risk text check (duplicate_risk in ('low', 'medium', 'high')),
  suggested_tags jsonb not null default '[]'::jsonb,
  ai_summary text,
  founder_takeaway text,
  ai_reason text,
  analyzed_at timestamptz,
  article_slug text,
  imported_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rss_items_status_idx
  on public.rss_items (status);

create index if not exists rss_items_category_idx
  on public.rss_items (category);

create index if not exists rss_items_published_at_idx
  on public.rss_items (published_at desc);

create index if not exists rss_items_score_idx
  on public.rss_items (score desc nulls last);

drop trigger if exists rss_items_set_updated_at
  on public.rss_items;

create trigger rss_items_set_updated_at
before update on public.rss_items
for each row
execute function public.set_updated_at();

alter table public.rss_items enable row level security;

drop policy if exists "Service role can manage rss items"
  on public.rss_items;

create policy "Service role can manage rss items"
on public.rss_items
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.resources (
  id text primary key,
  title text not null,
  description text not null,
  category text not null check (category in ('Toolkit', 'Template', 'Workflow', 'Checklist')),
  status text not null check (status in ('Free', 'Coming Soon')),
  format text not null,
  audience text not null,
  href text not null,
  featured boolean not null default false,
  archived boolean not null default false,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resources_featured_idx
  on public.resources (featured);

create index if not exists resources_archived_idx
  on public.resources (archived);

create index if not exists resources_category_idx
  on public.resources (category);

drop trigger if exists resources_set_updated_at
  on public.resources;

create trigger resources_set_updated_at
before update on public.resources
for each row
execute function public.set_updated_at();

alter table public.resources enable row level security;

drop policy if exists "Service role can manage resources"
  on public.resources;

create policy "Service role can manage resources"
on public.resources
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
