create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  province_code text not null,
  province_name text not null,
  regency_code text not null,
  regency_name text not null,
  district_code text not null,
  district_name text not null,
  village_code text not null,
  village_name text not null,
  adm1 text not null,
  adm2 text not null,
  adm3 text not null,
  adm4 text not null unique,
  latitude double precision,
  longitude double precision,
  timezone text not null default 'Asia/Jakarta',
  normalized_name text not null,
  aliases text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint regions_adm4_format check (adm4 ~ '^\d{2}\.\d{2}\.\d{2}\.\d{4}$'),
  constraint regions_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint regions_longitude_range check (longitude is null or longitude between -180 and 180)
);

create index if not exists regions_province_name_trgm_idx
  on public.regions using gin (province_name gin_trgm_ops);
create index if not exists regions_regency_name_trgm_idx
  on public.regions using gin (regency_name gin_trgm_ops);
create index if not exists regions_district_name_trgm_idx
  on public.regions using gin (district_name gin_trgm_ops);
create index if not exists regions_village_name_trgm_idx
  on public.regions using gin (village_name gin_trgm_ops);
create index if not exists regions_normalized_name_trgm_idx
  on public.regions using gin (normalized_name gin_trgm_ops);
create index if not exists regions_aliases_gin_idx
  on public.regions using gin (aliases);
create index if not exists regions_adm4_idx on public.regions (adm4);
create index if not exists regions_adm3_idx on public.regions (adm3);
create index if not exists regions_adm2_idx on public.regions (adm2);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists regions_set_updated_at on public.regions;
create trigger regions_set_updated_at
before update on public.regions
for each row execute function public.set_updated_at();

create or replace function public.search_regions(
  search_query text,
  result_limit integer default 10
)
returns table (
  id uuid,
  province_code text,
  province_name text,
  regency_code text,
  regency_name text,
  district_code text,
  district_name text,
  village_code text,
  village_name text,
  adm1 text,
  adm2 text,
  adm3 text,
  adm4 text,
  latitude double precision,
  longitude double precision,
  timezone text,
  normalized_name text,
  aliases text[],
  score double precision
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    r.id,
    r.province_code,
    r.province_name,
    r.regency_code,
    r.regency_name,
    r.district_code,
    r.district_name,
    r.village_code,
    r.village_name,
    r.adm1,
    r.adm2,
    r.adm3,
    r.adm4,
    r.latitude,
    r.longitude,
    r.timezone,
    r.normalized_name,
    r.aliases,
    greatest(
      similarity(r.normalized_name, search_query),
      similarity(lower(r.village_name), search_query),
      similarity(lower(r.district_name), search_query),
      similarity(lower(r.regency_name), search_query),
      coalesce((select max(similarity(alias, search_query)) from unnest(r.aliases) alias), 0)
    )::double precision as score
  from public.regions r
  where
    r.normalized_name % search_query
    or lower(r.village_name) % search_query
    or lower(r.district_name) % search_query
    or lower(r.regency_name) % search_query
    or search_query = any(r.aliases)
    or r.adm4 = search_query
  order by
    case when r.adm4 = search_query then 0 else 1 end,
    score desc,
    r.village_name,
    r.district_name
  limit least(greatest(result_limit, 1), 30);
$$;

create table if not exists public.weather_cache (
  adm4 text primary key,
  response_data jsonb not null,
  fetched_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists weather_cache_expires_at_idx
  on public.weather_cache (expires_at);

drop trigger if exists weather_cache_set_updated_at on public.weather_cache;
create trigger weather_cache_set_updated_at
before update on public.weather_cache
for each row execute function public.set_updated_at();

create table if not exists public.weather_alert_cache (
  alert_id text primary key,
  province_code text not null,
  response_data jsonb not null,
  effective_at timestamptz,
  expires_at timestamptz,
  fetched_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists weather_alert_cache_province_idx
  on public.weather_alert_cache (province_code);
create index if not exists weather_alert_cache_expires_idx
  on public.weather_alert_cache (expires_at);

drop trigger if exists weather_alert_cache_set_updated_at on public.weather_alert_cache;
create trigger weather_alert_cache_set_updated_at
before update on public.weather_alert_cache
for each row execute function public.set_updated_at();

create table if not exists public.weather_conversations (
  id uuid primary key,
  state_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists weather_conversations_updated_at_idx
  on public.weather_conversations (updated_at);

alter table public.regions enable row level security;
alter table public.weather_cache enable row level security;
alter table public.weather_alert_cache enable row level security;
alter table public.weather_conversations enable row level security;

revoke all on public.regions from anon, authenticated;
revoke all on public.weather_cache from anon, authenticated;
revoke all on public.weather_alert_cache from anon, authenticated;
revoke all on public.weather_conversations from anon, authenticated;
revoke execute on function public.search_regions(text, integer) from public, anon, authenticated;

grant all on public.regions to service_role;
grant all on public.weather_cache to service_role;
grant all on public.weather_alert_cache to service_role;
grant all on public.weather_conversations to service_role;
grant execute on function public.search_regions(text, integer) to service_role;
