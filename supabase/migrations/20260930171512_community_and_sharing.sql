-- Social data is opt-in. Existing saved areas keep their private default.
create schema if not exists private;
grant usage on schema private to authenticated;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
 display_name text not null check (char_length(trim(display_name)) between 2 and 60),
 bio text not null default '' check (char_length(bio) <= 300),
 avatar_path text,
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant insert(id,username,display_name,bio), update(username,display_name,bio) on public.profiles to authenticated;
grant all on public.profiles to service_role;
create policy profiles_read on public.profiles for select to anon,authenticated using (true);
create policy profiles_insert on public.profiles for insert to authenticated with check (id=(select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));

create table public.user_blocks (
 user_id uuid not null references public.profiles(id) on delete cascade,
 blocked_id uuid not null references public.profiles(id) on delete cascade,
 primary key(user_id,blocked_id), check(user_id<>blocked_id)
);
create index blocks_target_idx on public.user_blocks(blocked_id);
alter table public.user_blocks enable row level security;
revoke all on public.user_blocks from anon,authenticated;
grant select,insert,delete on public.user_blocks to authenticated;
grant all on public.user_blocks to service_role;
create policy blocks_read on public.user_blocks for select to authenticated using ((select auth.uid()) in (user_id,blocked_id));
create policy blocks_insert on public.user_blocks for insert to authenticated with check (user_id=(select auth.uid()));
create policy blocks_delete on public.user_blocks for delete to authenticated using (user_id=(select auth.uid()));

create function private.social_blocked(other_id uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.user_blocks where (user_id=auth.uid() and blocked_id=other_id) or (blocked_id=auth.uid() and user_id=other_id));
$$;
revoke all on function private.social_blocked(uuid) from public;
grant execute on function private.social_blocked(uuid) to authenticated;

create table public.friendships (
 id uuid primary key default gen_random_uuid(),
 requester_id uuid not null references public.profiles(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted')),
 created_at timestamptz not null default now(),
 check(requester_id<>recipient_id)
);
create unique index friendships_pair_idx on public.friendships(least(requester_id,recipient_id),greatest(requester_id,recipient_id));
create index friendships_requester_idx on public.friendships(requester_id,status);
create index friendships_recipient_idx on public.friendships(recipient_id,status);
alter table public.friendships enable row level security;
revoke all on public.friendships from anon,authenticated;
grant select,delete on public.friendships to authenticated;
grant insert(requester_id,recipient_id), update(status) on public.friendships to authenticated;
grant all on public.friendships to service_role;
create policy friends_read on public.friendships for select to authenticated using ((select auth.uid()) in (requester_id,recipient_id));
create policy friends_insert on public.friendships for insert to authenticated with check (requester_id=(select auth.uid()) and status='pending' and not private.social_blocked(recipient_id));
create policy friends_accept on public.friendships for update to authenticated using (recipient_id=(select auth.uid()) and status='pending') with check (recipient_id=(select auth.uid()) and status='accepted' and not private.social_blocked(requester_id));
create policy friends_delete on public.friendships for delete to authenticated using ((select auth.uid()) in (requester_id,recipient_id));
create function private.social_friend(other_id uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select not private.social_blocked(other_id) and exists(select 1 from public.friendships where status='accepted' and ((requester_id=auth.uid() and recipient_id=other_id) or (recipient_id=auth.uid() and requester_id=other_id)));
$$;
revoke all on function private.social_friend(uuid) from public;
grant execute on function private.social_friend(uuid) to authenticated;

alter table public.saved_areas add column visibility text not null default 'private' check(visibility in ('private','friends','public'));
alter table public.saved_areas add constraint saved_areas_id_owner_unique unique(id,user_id);
create index saved_public_created_idx on public.saved_areas(created_at desc) where visibility='public';
create table public.place_shares (
 area_id uuid not null,
 owner_id uuid not null,
 friend_id uuid not null references public.profiles(id) on delete cascade,
 primary key(area_id,friend_id),
 foreign key(area_id,owner_id) references public.saved_areas(id,user_id) on delete cascade,
 check(owner_id<>friend_id)
);
create index shares_friend_idx on public.place_shares(friend_id,area_id);
create index shares_owner_idx on public.place_shares(owner_id);
alter table public.place_shares enable row level security;
revoke all on public.place_shares from anon,authenticated;
grant select,insert,delete on public.place_shares to authenticated;
grant all on public.place_shares to service_role;
create policy shares_read on public.place_shares for select to authenticated using ((select auth.uid()) in (owner_id,friend_id));
create policy shares_insert on public.place_shares for insert to authenticated with check (owner_id=(select auth.uid()) and private.social_friend(friend_id));
create policy shares_delete on public.place_shares for delete to authenticated using ((select auth.uid()) in (owner_id,friend_id));
grant select on public.saved_areas to anon;
create policy places_public_anon on public.saved_areas for select to anon using (visibility='public');
create policy places_public_member on public.saved_areas for select to authenticated using (visibility='public' and not private.social_blocked(user_id));
create policy places_shared on public.saved_areas for select to authenticated using (visibility='friends' and private.social_friend(user_id) and exists(select 1 from public.place_shares s where s.area_id=saved_areas.id and s.friend_id=(select auth.uid())));

-- One transaction for visibility and recipients; no privileged database function.
create function public.set_place_sharing(place_id uuid, new_visibility text, friend_ids uuid[] default '{}') returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 perform 1 from public.saved_areas where id=place_id and user_id=auth.uid() for update;
 if not found then raise exception 'Place not found'; end if;
 if new_visibility not in ('private','friends','public') or new_visibility is null then raise exception 'Invalid visibility'; end if;
 if cardinality(friend_ids)>100 then raise exception 'Too many recipients'; end if;
 if new_visibility='friends' and coalesce(cardinality(friend_ids),0)=0 then raise exception 'Select friends'; end if;
 delete from public.place_shares where area_id=place_id;
 if new_visibility='friends' then
  insert into public.place_shares(area_id,owner_id,friend_id) select place_id,auth.uid(),unnest(friend_ids);
 end if;
 update public.saved_areas set visibility=new_visibility where id=place_id and user_id=auth.uid();
end;
$$;
revoke all on function public.set_place_sharing(uuid,text,uuid[]) from public;
grant execute on function public.set_place_sharing(uuid,text,uuid[]) to authenticated;

create function private.clear_friend_shares() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 delete from public.place_shares where (owner_id=old.requester_id and friend_id=old.recipient_id) or (owner_id=old.recipient_id and friend_id=old.requester_id);
 return old;
end;
$$;
revoke all on function private.clear_friend_shares() from public;
create trigger friendship_removed after delete on public.friendships for each row execute function private.clear_friend_shares();
create function private.clear_blocked_friendship() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 delete from public.friendships where (requester_id=new.user_id and recipient_id=new.blocked_id) or (recipient_id=new.user_id and requester_id=new.blocked_id);
 delete from public.place_shares where (owner_id=new.user_id and friend_id=new.blocked_id) or (owner_id=new.blocked_id and friend_id=new.user_id);
 return new;
end;
$$;
revoke all on function private.clear_blocked_friendship() from public;
create trigger user_blocked after insert on public.user_blocks for each row execute function private.clear_blocked_friendship();

create table public.community_posts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(trim(body)) between 1 and 3000),
 status text not null default 'draft' check(status in ('draft','published','hidden')),
 area_id uuid references public.saved_areas(id) on delete set null,
 created_at timestamptz not null default now()
);
create index posts_feed_idx on public.community_posts(created_at desc,id desc) where status='published';
create index posts_author_idx on public.community_posts(author_id,created_at desc);
create index posts_area_idx on public.community_posts(area_id);
alter table public.community_posts enable row level security;
revoke all on public.community_posts from anon,authenticated;
grant select on public.community_posts to anon,authenticated;
grant insert(author_id,body,area_id),update(body,status,area_id),delete on public.community_posts to authenticated;
grant all on public.community_posts to service_role;
create policy posts_anon on public.community_posts for select to anon using(status='published');
create policy posts_member on public.community_posts for select to authenticated using(author_id=(select auth.uid()) or (status='published' and not private.social_blocked(author_id)) or (select (auth.jwt()->'app_metadata'->>'moderator')='true'));
create policy posts_insert on public.community_posts for insert to authenticated with check(author_id=(select auth.uid()) and status='draft' and (area_id is null or exists(select 1 from public.saved_areas a where a.id=area_id and a.user_id=(select auth.uid()) and a.visibility='public')));
create policy posts_update on public.community_posts for update to authenticated using(author_id=(select auth.uid()) and status<>'hidden') with check(author_id=(select auth.uid()) and status in ('draft','published') and (area_id is null or exists(select 1 from public.saved_areas a where a.id=area_id and a.user_id=(select auth.uid()) and a.visibility='public')));
create policy posts_delete on public.community_posts for delete to authenticated using(author_id=(select auth.uid()));
create policy posts_moderate on public.community_posts for update to authenticated using((select (auth.jwt()->'app_metadata'->>'moderator')='true')) with check((select (auth.jwt()->'app_metadata'->>'moderator')='true'));

create table public.community_images (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.community_posts(id) on delete cascade,
 slot integer not null check(slot between 0 and 3),
 path text not null unique,
 unique(post_id,slot)
);
alter table public.community_images enable row level security;
revoke all on public.community_images from anon,authenticated;
grant select on public.community_images to anon,authenticated;
grant all on public.community_images to service_role;
create policy images_read on public.community_images for select to anon,authenticated using(exists(select 1 from public.community_posts p where p.id=post_id));

create table public.community_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references public.profiles(id) on delete cascade,
 post_id uuid not null references public.community_posts(id) on delete cascade,
 reason text not null check(char_length(trim(reason)) between 5 and 500),
 resolved boolean not null default false,
 created_at timestamptz not null default now(),
 unique(reporter_id,post_id)
);
create index reports_post_idx on public.community_reports(post_id);
alter table public.community_reports enable row level security;
revoke all on public.community_reports from anon,authenticated;
grant select,insert(reporter_id,post_id,reason),update(resolved) on public.community_reports to authenticated;
grant all on public.community_reports to service_role;
create policy reports_insert on public.community_reports for insert to authenticated with check(reporter_id=(select auth.uid()) and not resolved and exists(select 1 from public.community_posts p where p.id=post_id and p.status='published'));
create policy reports_read on public.community_reports for select to authenticated using(reporter_id=(select auth.uid()) or (select (auth.jwt()->'app_metadata'->>'moderator')='true'));
create policy reports_moderate on public.community_reports for update to authenticated using((select (auth.jwt()->'app_metadata'->>'moderator')='true')) with check((select (auth.jwt()->'app_metadata'->>'moderator')='true'));

-- All image access goes through the app: re-encode uploads and check RLS on every read.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('community','community',false,4194304,array['image/jpeg']);
