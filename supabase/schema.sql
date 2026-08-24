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
