create extension if not exists pgcrypto;
create extension if not exists postgis with schema extensions;

create table if not exists public.administrative_regions (
  id uuid primary key default gen_random_uuid(),
  adm1 text,
  adm2 text,
  adm3 text,
  adm4 text unique not null,
  province_name text not null,
  regency_name text not null,
  district_name text not null,
  village_name text not null,
  timezone text not null,
  geometry extensions.geometry(multipolygon, 4326) not null,
  centroid extensions.geometry(point, 4326),
  source text,
  source_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint administrative_regions_adm4_format
    check (adm4 ~ '^\d{2}\.\d{2}\.\d{2}\.\d{4}$'),
  constraint administrative_regions_geometry_valid
    check (extensions.st_isvalid(geometry))
);

create index if not exists administrative_regions_geometry_idx
  on public.administrative_regions using gist (geometry);
create index if not exists administrative_regions_centroid_idx
  on public.administrative_regions using gist (centroid);
create index if not exists administrative_regions_adm4_idx
  on public.administrative_regions (adm4);
create index if not exists administrative_regions_adm3_idx
  on public.administrative_regions (adm3);
create index if not exists administrative_regions_adm2_idx
  on public.administrative_regions (adm2);

create or replace function public.prepare_administrative_region_geometry()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  new.geometry = extensions.st_multi(
    extensions.st_collectionextract(
      extensions.st_makevalid(new.geometry),
      3
    )
  );
  new.centroid = extensions.st_pointonsurface(new.geometry);
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists administrative_regions_prepare_geometry
  on public.administrative_regions;
create trigger administrative_regions_prepare_geometry
before insert or update of geometry
on public.administrative_regions
for each row execute function public.prepare_administrative_region_geometry();

create or replace function public.find_adm4_by_coordinate(
  input_lat double precision,
  input_lng double precision
)
returns table (
  adm1 text,
  adm2 text,
  adm3 text,
  adm4 text,
  province_name text,
  regency_name text,
  district_name text,
  village_name text,
  timezone text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    r.adm1,
    r.adm2,
    r.adm3,
    r.adm4,
    r.province_name,
    r.regency_name,
    r.district_name,
    r.village_name,
    r.timezone
  from public.administrative_regions r
  where extensions.st_covers(
    r.geometry,
    extensions.st_setsrid(
      extensions.st_makepoint(input_lng, input_lat),
      4326
    )
  )
  limit 1;
$$;

create or replace function public.find_nearest_adm4_by_coordinate(
  input_lat double precision,
  input_lng double precision,
  maximum_distance_meters double precision default 25000
)
returns table (
  adm1 text,
  adm2 text,
  adm3 text,
  adm4 text,
  province_name text,
  regency_name text,
  district_name text,
  village_name text,
  timezone text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with input_point as (
    select extensions.st_setsrid(
      extensions.st_makepoint(input_lng, input_lat),
      4326
    ) as geometry
  )
  select
    r.adm1,
    r.adm2,
    r.adm3,
    r.adm4,
    r.province_name,
    r.regency_name,
    r.district_name,
    r.village_name,
    r.timezone
  from public.administrative_regions r
  cross join input_point p
  where extensions.st_dwithin(
    r.centroid::extensions.geography,
    p.geometry::extensions.geography,
    greatest(0, least(maximum_distance_meters, 25000))
  )
  order by extensions.st_distance(
    r.centroid::extensions.geography,
    p.geometry::extensions.geography
  )
  limit 1;
$$;

create table if not exists public.geocoding_cache (
  cache_key text primary key,
  response_data jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists geocoding_cache_expires_idx
  on public.geocoding_cache (expires_at);

alter table public.administrative_regions enable row level security;
alter table public.geocoding_cache enable row level security;

revoke all on public.administrative_regions from anon, authenticated;
revoke all on public.geocoding_cache from anon, authenticated;
revoke execute on function public.find_adm4_by_coordinate(double precision, double precision)
  from public, anon, authenticated;
revoke execute on function public.find_nearest_adm4_by_coordinate(double precision, double precision, double precision)
  from public, anon, authenticated;

grant all on public.administrative_regions to service_role;
grant all on public.geocoding_cache to service_role;
grant execute on function public.find_adm4_by_coordinate(double precision, double precision)
  to service_role;
grant execute on function public.find_nearest_adm4_by_coordinate(double precision, double precision, double precision)
  to service_role;
