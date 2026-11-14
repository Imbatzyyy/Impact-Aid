begin;
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null, address text not null default '',
  created_at timestamptz not null default now()
);
create table public.lesson_completions (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  lesson_id smallint not null check (lesson_id between 0 and 5),
  primary key(user_id,lesson_id)
);
create table public.quiz_results (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  topic text not null check(topic in ('earthquake','tsunami','typhoon','flood','landslide','volcanic eruption')),
  correct smallint not null, total smallint not null check(total between 1 and 200),
  percentage integer generated always as (round(100.0*correct/total)::integer) stored,
  last_taken timestamptz not null default now(), primary key(user_id,topic),
  check(correct between 0 and total)
);
create table public.local_contacts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  name text not null check(length(trim(name)) between 1 and 150), number text not null check(number ~ '^[+0-9() .-]{3,32}$'),
  description text not null default ''
);
create index on public.local_contacts(user_id);
alter table public.profiles enable row level security;
alter table public.lesson_completions enable row level security;
alter table public.quiz_results enable row level security;
alter table public.local_contacts enable row level security;
revoke all on public.profiles, public.lesson_completions, public.quiz_results, public.local_contacts from public, anon, authenticated;
grant select, update(username,address) on public.profiles to authenticated;
grant select, insert on public.lesson_completions to authenticated;
grant select, insert, update(correct,total,last_taken) on public.quiz_results to authenticated;
grant select, insert, delete on public.local_contacts to authenticated;
create policy own_profile on public.profiles to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy own_lessons on public.lesson_completions to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy own_scores on public.quiz_results to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy own_contacts on public.local_contacts to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create schema if not exists impact_private;
revoke all on schema impact_private from public,anon,authenticated;
create table impact_private.legacy_records(path text primary key, fields jsonb not null);
create table impact_private.legacy_accounts(uid text primary key, user_id uuid unique not null references auth.users, email text not null);
create function impact_private.new_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,username,address) values(new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'username'),''),split_part(new.email,'@',1),'Student'),coalesce(new.raw_user_meta_data->>'address',''));
 return new;
end $$;
revoke all on function impact_private.new_profile() from public,anon,authenticated;
create trigger impact_profile_created after insert on auth.users for each row execute function impact_private.new_profile();
insert into public.profiles(id,username,address) select id,coalesce(nullif(raw_user_meta_data->>'username',''),split_part(email,'@',1),'Student'),coalesce(raw_user_meta_data->>'address','') from auth.users on conflict do nothing;
commit;
