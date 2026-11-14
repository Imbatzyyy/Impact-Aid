begin;
alter table public.profiles
 add column full_name text not null default '' check(length(full_name)<=150),
 add column age smallint check(age between 0 and 120),
 add column phone text not null default '' check(phone='' or phone ~ '^[+0-9() .-]{3,32}$'),
 add column city_code text not null default '' check(city_code='' or city_code ~ '^[0-9]{10}$'),
 add column city_name text not null default '' check(length(city_name)<=150),
 add column province_name text not null default '' check(length(province_name)<=150),
 add column region_name text not null default '' check(length(region_name)<=150),
 add column barangay_code text not null default '' check(barangay_code='' or barangay_code ~ '^[0-9]{10}$'),
 add column barangay_name text not null default '' check(length(barangay_name)<=150),
 add column street_address text not null default '' check(length(street_address)<=250),
 add column postal_code text not null default '' check(postal_code='' or postal_code ~ '^[0-9]{4}$'),
 add column avatar_path text check(avatar_path is null or avatar_path ~ ('^' || id::text || '/[a-f0-9-]{36}\.jpg$')),
 add column updated_at timestamptz not null default now();

-- Preserve every existing name and address. A new Google account can supply a full name,
-- but provider photos are never copied into the user's chosen profile picture.
create or replace function impact_private.new_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,username,address,full_name) values(new.id,
 coalesce(nullif(trim(new.raw_user_meta_data->>'username'),''),nullif(trim(new.raw_user_meta_data->>'full_name'),''),nullif(trim(new.raw_user_meta_data->>'name'),''),nullif(split_part(new.email,'@',1),''),'Learner'),
 left(coalesce(new.raw_user_meta_data->>'address',''),500),
 left(coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',''),150));
 return new;
end $$;
revoke all on function impact_private.new_profile() from public,anon,authenticated;
create function impact_private.profile_updated() returns trigger language plpgsql set search_path='' as $$
begin
 if length(trim(new.username)) not between 1 and 150 or length(new.address)>1000 then raise exception 'Invalid profile'; end if;
 new.updated_at=now();return new;
end $$;
revoke all on function impact_private.profile_updated() from public,anon,authenticated;
create trigger impact_profile_updated before update on public.profiles for each row execute function impact_private.profile_updated();
grant update(full_name,age,phone,city_code,city_name,province_name,region_name,barangay_code,barangay_name,street_address,postal_code,avatar_path) on public.profiles to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('profile-photos','profile-photos',false,2097152,array['image/jpeg']);
create policy profile_photo_read on storage.objects for select to authenticated
 using(bucket_id='profile-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy profile_photo_upload on storage.objects for insert to authenticated
 with check(bucket_id='profile-photos' and (storage.foldername(name))[1]=(select auth.uid())::text and storage.extension(name)='jpg');
create policy profile_photo_delete on storage.objects for delete to authenticated
 using(bucket_id='profile-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
