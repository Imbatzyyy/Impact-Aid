begin;
-- Calendar dates are inclusive, in Asia/Manila. No inferred future school years.
create table public.school_terms(id text primary key, label text not null, starts date unique not null, ends date not null check(ends>=starts));
insert into public.school_terms values
 ('qc26-first','First semester','2026-07-06','2026-11-07'),
 ('qc26-second','Second semester','2026-11-26','2027-04-14'),
 ('qc26-summer','Summer term','2027-05-03','2027-06-11');
alter table public.school_terms enable row level security;
revoke all on public.school_terms from public,anon,authenticated;
grant select on public.school_terms to authenticated;
create policy read_calendar on public.school_terms for select to authenticated using(true);
-- Bank v1: stable question IDs 0..49 and original (unshuffled) option indices.
create table impact_private.quiz_key(topic text primary key, choices smallint[] not null check(cardinality(choices)=50));
insert into impact_private.quiz_key values
('earthquake',array[0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,1,1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]::smallint[]),
('tsunami',array[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]::smallint[]),
('typhoon',array[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]::smallint[]),
('flood',array[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]::smallint[]),
('landslide',array[0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]::smallint[]),
('volcanic eruption',array[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]::smallint[]);
create table public.quiz_assignments(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade, device uuid not null,
 term text not null references public.school_terms(id), topic text not null references impact_private.quiz_key(topic), question_ids smallint[] not null check(cardinality(question_ids)=15),
 unique(user_id,device,term,topic),unique(term,topic,question_ids));
alter table public.quiz_assignments enable row level security;
revoke all on public.quiz_assignments from public,anon,authenticated;
grant select on public.quiz_assignments to authenticated;
create policy own_assignments on public.quiz_assignments for select to authenticated using(user_id=(select auth.uid()));
create function public.get_quiz_release(p_topic text,p_device uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); today date:=(now() at time zone 'Asia/Manila')::date;
 t public.school_terms; a public.quiz_assignments; ids smallint[]; prev smallint[]; tries int:=0;
begin
 if u is null or p_device is null or not exists(select 1 from impact_private.quiz_key where topic=p_topic) then raise exception 'Invalid quiz request'; end if;
 select * into t from public.school_terms where starts<=today order by starts desc limit 1;
 if t.id is null then raise exception 'Calendar has not started'; end if;
 select q.question_ids into prev from public.quiz_assignments q join public.school_terms s on s.id=q.term where q.user_id=u and q.device=p_device and q.topic=p_topic and s.starts<t.starts order by s.starts desc limit 1;
 loop
  select * into a from public.quiz_assignments where user_id=u and device=p_device and term=t.id and topic=p_topic;
  exit when found;
  select array_agg(x::smallint order by x) into ids from (select x from generate_series(0,49) x where not(x=any(coalesce(prev,'{}'::smallint[]))) order by random() limit 15) sample;
  insert into public.quiz_assignments(user_id,device,term,topic,question_ids) values(u,p_device,t.id,p_topic,ids) on conflict do nothing returning * into a;
  exit when found;
  tries:=tries+1; if tries>12 then raise exception 'Please retry assignment'; end if;
 end loop;
 return jsonb_build_object('id',a.id,'ids',a.question_ids,'term',t.id,'label',t.label,'review',today>t.ends);
end $$;
alter table public.quiz_attempts drop constraint quiz_attempts_answers_check, drop constraint quiz_attempts_correct_check,
 add column assignment_id uuid references public.quiz_assignments(id) on delete cascade,
 add column total smallint generated always as (jsonb_array_length(answers)) stored,
 add check(jsonb_typeof(answers)='array' and octet_length(answers::text)<32768 and ((assignment_id is null and jsonb_array_length(answers)=10) or (assignment_id is not null and jsonb_array_length(answers)=15))),
 add check(correct between 0 and jsonb_array_length(answers));
-- The 2.0 app writes quiz_results directly; no released app uses the experimental ten-answer RPC.
drop function public.record_quiz_attempt(uuid,text,jsonb,smallint);
revoke insert(user_id,attempt_id,topic,answers,correct) on public.quiz_attempts from authenticated;
drop policy insert_own_attempts on public.quiz_attempts;
create function public.submit_semester_quiz(p_attempt uuid,p_assignment uuid,p_answers jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); a public.quiz_assignments; ids smallint[]; score integer; existing public.quiz_attempts;
begin
 select * into a from public.quiz_assignments where id=p_assignment and user_id=u;
 if a.id is null or p_attempt is null or jsonb_typeof(p_answers) is distinct from 'array' or jsonb_array_length(p_answers)<>15 then raise exception 'Incomplete quiz'; end if;
 if exists(select 1 from jsonb_array_elements(p_answers) j where (j->>'question_id') is null or (j->>'question_id') !~ '^([0-9]|[1-4][0-9])$' or (j->>'choice') is null or (j->>'choice') !~ '^[0-3]$') then raise exception 'Invalid response'; end if;
 select array_agg((j->>'question_id')::smallint order by (j->>'question_id')::int),count(*) filter(where (j->>'choice')::int=k.choices[1+(j->>'question_id')::int]) into ids,score
 from jsonb_array_elements(p_answers) j cross join impact_private.quiz_key k where k.topic=a.topic;
 if ids<>a.question_ids then raise exception 'Answers do not match the assigned questions'; end if;
 insert into public.quiz_attempts(user_id,attempt_id,topic,answers,correct,assignment_id) values(u,p_attempt,a.topic,p_answers,score,a.id) on conflict do nothing;
 if found then
  insert into public.quiz_results(user_id,topic,correct,total,last_taken) values(u,a.topic,score,15,now())
  on conflict(user_id,topic) do update set correct=excluded.correct,total=excluded.total,last_taken=excluded.last_taken;
 else
  select * into existing from public.quiz_attempts where user_id=u and attempt_id=p_attempt;
  if existing.assignment_id is distinct from a.id or existing.answers<>p_answers then raise exception 'Attempt already submitted'; end if;
  score:=existing.correct;
 end if;
 return score;
end $$;
revoke all on function public.get_quiz_release(text,uuid),public.submit_semester_quiz(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.get_quiz_release(text,uuid),public.submit_semester_quiz(uuid,uuid,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
