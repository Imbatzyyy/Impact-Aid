export interface Profile {
 id:string; username:string; full_name:string; age:number|null; phone:string; address:string;
 city_code:string; city_name:string; province_name:string; region_name:string;
 barangay_code:string; barangay_name:string; street_address:string; postal_code:string;
 avatar_path:string|null; updated_at:string;
}
export type ProfileDraft=Omit<Profile,'id'|'avatar_path'|'updated_at'>;
export const PROFILE_FIELDS='id,username,full_name,age,phone,address,city_code,city_name,province_name,region_name,barangay_code,barangay_name,street_address,postal_code,avatar_path,updated_at';
export function draftOf(p:Profile):ProfileDraft{
 const {id:_,avatar_path:__,updated_at:___,...draft}=p;return {...draft,address:[draft.city_name,draft.barangay_name,draft.street_address,draft.postal_code].some(Boolean)?'':draft.address};
}
export function validateProfile(d:ProfileDraft):string{
 if(!d.username.trim()||d.username.trim().length>150)return 'Enter a username between 1 and 150 characters.';
 if(d.full_name.trim().length>150)return 'Keep your full name within 150 characters.';
 if(d.age!==null&&(!Number.isInteger(d.age)||d.age<0||d.age>120))return 'Enter a whole-number age between 0 and 120, or leave it empty.';
 if(d.phone.trim()&&!/^[+0-9() .-]{3,32}$/.test(d.phone.trim()))return 'Check your mobile number, or leave it empty.';
 if(d.postal_code.trim()&&!/^\d{4}$/.test(d.postal_code.trim()))return 'A Philippine postal code has four digits. You can leave it empty.';
 if(d.street_address.length>250||d.address.length>1000)return 'Please shorten the street or address details.';
 return '';
}
export function cleanProfile(d:ProfileDraft):ProfileDraft{
 const out={...d};for(const key of Object.keys(out) as (keyof ProfileDraft)[]){if(key!=='age')out[key]=String(out[key]??'').trim();}
 out.address=[out.street_address,out.barangay_name,out.city_name,out.province_name,out.region_name,out.postal_code].filter(Boolean).join(', ')||out.address;
 return out;
}
