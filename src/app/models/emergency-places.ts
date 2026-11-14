export type PlaceType = 'hospital' | 'police' | 'fire' | 'rescue' | 'government' | 'evacuation';
export interface EmergencyPlace {
  id:string; name:string; type:PlaceType; lat:number; lng:number;
  address:string; phone:string; source:string; coordinateKind:'point'|'site'; phoneSource?:string;
}
export interface PlaceResult extends EmergencyPlace { distance:number; }
export interface PlaceDirectory { updatedAt:string; places:EmergencyPlace[]; }
export const PLACE_CATEGORIES = [
  {id:'all',name:'All places',icon:'map-outline',color:'#375464',mark:'•'},
  {id:'hospital',name:'Hospitals',icon:'medical',color:'#b7354a',mark:'H'},
  {id:'police',name:'Police',icon:'shield-outline',color:'#285db4',mark:'P'},
  {id:'fire',name:'Fire stations',icon:'flame-outline',color:'#b44b16',mark:'F'},
  {id:'rescue',name:'Rescue & DRRM',icon:'pulse-outline',color:'#6e429d',mark:'R'},
  {id:'government',name:'Local government',icon:'business-outline',color:'#48616c',mark:'G'},
  {id:'evacuation',name:'Evacuation',icon:'home-outline',color:'#18744e',mark:'E'},
] as const;
export function distanceKm(a:{lat:number;lng:number},b:{lat:number;lng:number}):number{
  const rad=(n:number)=>n*Math.PI/180;
  const h=Math.sin(rad(b.lat-a.lat)/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(b.lng-a.lng)/2)**2;
  return 6371*2*Math.asin(Math.sqrt(Math.min(1,h)));
}
export function findPlaces(places:EmergencyPlace[],center:{lat:number;lng:number},radius:number,type:PlaceType|'all',query:string):PlaceResult[]{
  const words=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const results:PlaceResult[]=[];
  // The latitude band is a conservative bound on spherical distance, including near either pole.
  const band=radius*180/(Math.PI*6371);
  for(const place of places){
    if(type!=='all'&&place.type!==type||radius>0&&Math.abs(center.lat-place.lat)>band+1e-8)continue;
    if(words.length){const text=(place.name+' '+place.address).toLocaleLowerCase();if(!words.every(w=>text.includes(w)))continue;}
    const distance=distanceKm(place,center);
    if(!radius||distance<=radius)results.push({...place,distance});
  }
  return results.sort((a,b)=>a.distance-b.distance||a.name.localeCompare(b.name));
}
export function escapeMapText(value:string):string{
  return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
}
export function dialablePhone(value:string):string{
  const first=value.split(/[;,/]/)[0].trim();
  if(!/^\+?[\d\s().-]+$/.test(first))return '';
  let clean=first.replace(/[^\d+]/g,'');
  if(/^0[2-9]\d{8,9}$/.test(clean))clean='+63'+clean.slice(1);
  if(clean.startsWith('+63'))return /^\+63(?:2\d{8}|[3-8]\d{8}|9\d{9})$/.test(clean)?clean:'';
  return /^\+[1-9]\d{7,14}$/.test(clean)?clean:'';
}
