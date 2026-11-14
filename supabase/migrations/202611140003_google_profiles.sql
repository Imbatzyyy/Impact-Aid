begin;
-- Google supplies full_name/name. Email registrations still take their chosen username.
-- Only new profiles are affected; existing names and learning records remain untouched.
create or replace function impact_private.new_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,username,address) values(
 new.id,
 coalesce(nullif(trim(new.raw_user_meta_data->>'username'),''),nullif(trim(new.raw_user_meta_data->>'full_name'),''),nullif(trim(new.raw_user_meta_data->>'name'),''),nullif(split_part(new.email,'@',1),''),'Learner'),
 coalesce(new.raw_user_meta_data->>'address',''));
 return new;
end $$;
revoke all on function impact_private.new_profile() from public,anon,authenticated;
commit;
