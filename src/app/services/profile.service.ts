import { Injectable, signal } from '@angular/core';
import { account, db } from './backend';
import { Profile, ProfileDraft, PROFILE_FIELDS, cleanProfile, validateProfile } from '../models/profile';

@Injectable({providedIn:'root'})
export class ProfileService {
 readonly current=signal<Profile|null>(null);
 readonly photo=signal('');
 private generation=0;
 constructor(){db.auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_OUT'||(this.current()&&this.current()!.id!==session?.user.id))this.clear();
 });}
 private clear(){this.generation++;this.current.set(null);this.replacePhoto('');}
 private replacePhoto(url:string){const old=this.photo();this.photo.set(url);if(old)URL.revokeObjectURL(old);}
 async load(){
  const user=await account();const run=++this.generation;
  if(this.current()?.id!==user.id){this.current.set(null);this.replacePhoto('');}
  const {data,error}=await db.from('profiles').select(PROFILE_FIELDS).eq('id',user.id).single();
  if(error)throw error;
  if(run!==this.generation||(await account()).id!==user.id)throw Error('Your account changed. Please reopen your profile.');
  const previous=this.current();this.current.set(data as Profile);
  if(previous?.avatar_path!==data.avatar_path||(!this.photo()&&data.avatar_path)){
   this.replacePhoto('');
   if(data.avatar_path){
    const result=await db.storage.from('profile-photos').download(data.avatar_path);
    if(!result.error&&run===this.generation&&(await account()).id===user.id)this.replacePhoto(URL.createObjectURL(result.data));
   }
  }
  return {profile:data as Profile,email:user.email??''};
 }
 async save(id:string,draft:ProfileDraft,picture:Blob|null|undefined){
  const clean=cleanProfile(draft),errorMessage=validateProfile(clean);if(errorMessage)throw Error(errorMessage);
  if((await account()).id!==id||this.current()?.id!==id)throw Error('Your account changed. Please reopen your profile.');
  const previous=this.current()!.avatar_path;let path=previous;let uploaded=false;let committed=false;
  try{
   if(picture){
    if(picture.type!=='image/jpeg'||picture.size>2097152)throw Error('Choose a smaller photo.');
    path=id+'/'+crypto.randomUUID()+'.jpg';
    const {error}=await db.storage.from('profile-photos').upload(path,picture,{contentType:'image/jpeg',cacheControl:'0',upsert:false});
    if(error)throw error;uploaded=true;
   }else if(picture===null)path=null;
   if((await account()).id!==id)throw Error('Your account changed. Please sign in again.');
   const {data,error}=await db.from('profiles').update({...clean,avatar_path:path}).eq('id',id).select(PROFILE_FIELDS).single();
   if(error)throw error;
   committed=true;this.generation++;
   if((await account()).id===id){this.current.set(data as Profile);if(picture!==undefined)this.replacePhoto(picture?URL.createObjectURL(picture):'');}
   if(previous&&previous!==path)await db.storage.from('profile-photos').remove([previous]).catch(()=>{});
   return data as Profile;
  }catch(error){
   if(uploaded&&!committed&&path)await db.storage.from('profile-photos').remove([path]).catch(()=>{});
   throw error;
  }
 }
}
