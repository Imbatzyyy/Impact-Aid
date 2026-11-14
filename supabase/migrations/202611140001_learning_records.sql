begin;
-- Saved reading position is separate from an explicit, completed lesson.
create table public.lesson_bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id smallint not null check (lesson_id between 0 and 5),
  section_index smallint not null check (section_index between 0 and 20),
  primary key (user_id, lesson_id)
);
-- Attempts created by 2.1 and later. Historical scores are left untouched.
create table public.quiz_attempts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  attempt_id uuid not null, topic text not null check(topic in ('earthquake','tsunami','typhoon','flood','landslide','volcanic eruption')),
  answers jsonb not null check(jsonb_typeof(answers)='array' and jsonb_array_length(answers)=10 and octet_length(answers::text)<32768),
  correct smallint not null check(correct between 0 and 10), taken_at timestamptz not null default now(),
  primary key(user_id,attempt_id)
);
create index quiz_attempts_recent on public.quiz_attempts(user_id,taken_at desc);
alter table public.lesson_bookmarks enable row level security;
alter table public.quiz_attempts enable row level security;
revoke all on public.lesson_bookmarks, public.quiz_attempts from public, anon, authenticated;
grant select, insert, update(user_id,lesson_id,section_index) on public.lesson_bookmarks to authenticated;
grant select, insert(user_id,attempt_id,topic,answers,correct) on public.quiz_attempts to authenticated;
create policy own_bookmarks on public.lesson_bookmarks to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy read_own_attempts on public.quiz_attempts for select to authenticated using(user_id=(select auth.uid()));
create policy insert_own_attempts on public.quiz_attempts for insert to authenticated with check(user_id=(select auth.uid()));
create function public.record_quiz_attempt(p_attempt uuid,p_topic text,p_answers jsonb,p_correct smallint) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.quiz_attempts(user_id,attempt_id,topic,answers,correct) values (auth.uid(),p_attempt,p_topic,p_answers,p_correct) on conflict do nothing;
  if found then
    insert into public.quiz_results(user_id,topic,correct,total,last_taken) values(auth.uid(),p_topic,p_correct,10,now())
    on conflict(user_id,topic) do update set correct=excluded.correct,total=excluded.total,last_taken=excluded.last_taken;
  end if;
end; $$;
revoke all on function public.record_quiz_attempt(uuid,text,jsonb,smallint) from public,anon;
grant execute on function public.record_quiz_attempt(uuid,text,jsonb,smallint) to authenticated;
commit;
