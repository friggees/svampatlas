create schema if not exists extensions;
create extension if not exists postgis with schema extensions;
create table public.saved_areas (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (char_length(trim(name)) between 2 and 100),
 species_id text not null check (species_id in ('kantarell','trattkantarell','svart-trumpetsvamp','stensopp','blek-taggsvamp','rodgul-trumpetsvamp','smorsopp','farticka','rod-flugsvamp','toppslatskivling')),
 latitude double precision not null check (latitude between -90 and 90),
 longitude double precision not null check (longitude between -180 and 180),
 location extensions.geography(Point,4326) generated always as (extensions.st_setsrid(extensions.st_makepoint(longitude,latitude),4326)::extensions.geography) stored,
 notes text not null default '' check (char_length(notes) <= 2000),
 created_at timestamptz not null default now()
);
create index saved_areas_user_created_idx on public.saved_areas(user_id,created_at desc);
create index saved_areas_location_idx on public.saved_areas using gist(location);
alter table public.saved_areas enable row level security;
revoke all on public.saved_areas from anon,authenticated;
grant select,insert,update,delete on public.saved_areas to authenticated;
grant all on public.saved_areas to service_role;
create policy owner_read on public.saved_areas for select to authenticated using ((select auth.uid()) = user_id);
create policy owner_insert on public.saved_areas for insert to authenticated with check ((select auth.uid()) = user_id);
create policy owner_update on public.saved_areas for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_delete on public.saved_areas for delete to authenticated using ((select auth.uid()) = user_id);
