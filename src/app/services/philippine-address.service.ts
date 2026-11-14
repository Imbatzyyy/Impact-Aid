import { Injectable } from '@angular/core';
export interface Place {code:string;name:string;type?:string;province?:string;region?:string;}
interface Directory {cities:Place[];provinces:Place[];regions:Place[];}
const base='https://psgc.cloud/api/';
const normalize=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^city of /,'').trim();
export function addressMatches(rows:Place[],query:string):Place[]{
 const q=normalize(query);if(!q)return [];
 return rows.filter(p=>normalize(p.name).includes(q)).sort((a,b)=>{
  const score=(p:Place)=>Number(normalize(p.name)===q)*4+Number(normalize(p.name).startsWith(q))*2+Number(p.type==='City');
  return score(b)-score(a)||a.name.localeCompare(b.name);
 }).slice(0,8);
}
async function json(url:string){const r=await fetch(url,{signal:AbortSignal.timeout(6000)});if(!r.ok)throw Error('Address service unavailable');return r.json();}
function valid(rows:unknown):rows is Place[]{return Array.isArray(rows)&&rows.every(r=>typeof r.name==='string'&&/^\d{10}$/.test(r.code));}
@Injectable({providedIn:'root'})
export class PhilippineAddressService {
 private citiesPromise?:Promise<Place[]>;
 private barangayCache=new Map<string,Place[]>();
 cities(){return this.citiesPromise??=this.loadCities().catch(e=>{this.citiesPromise=undefined;throw e;});}
 private async loadCities(){
  let data:Directory;
  try{
   const [cities,provinces,regions]=await Promise.all(['cities-municipalities','provinces','regions'].map(path=>json(base+path)));
   if(![cities,provinces,regions].every(valid))throw Error('Invalid directory');
   data={cities,provinces,regions};
  }catch{data=await json('assets/addresses/cities.json');}
  return data.cities.map(p=>({...p,province:data.provinces.find(v=>v.code.slice(0,5)===p.code.slice(0,5))?.name??'',region:data.regions.find(v=>v.code.slice(0,2)===p.code.slice(0,2))?.name??''}));
 }
 async barangays(code:string):Promise<Place[]>{
  if(!/^\d{10}$/.test(code))return [];
  if(this.barangayCache.has(code))return this.barangayCache.get(code)!;
  const key='impact-aid.psgc.'+code;
  try{
   const rows=await json(base+'cities-municipalities/'+code+'/barangays');if(!valid(rows))throw Error('Invalid directory');
   this.barangayCache.set(code,rows);
   try{localStorage.setItem(key,JSON.stringify({at:Date.now(),rows}));}catch{/* Public reference cache is optional. */}
   return rows;
  }catch{
   try{const cache=JSON.parse(localStorage.getItem(key)??'null');if(valid(cache?.rows)){this.barangayCache.set(code,cache.rows);return cache.rows;}}catch{/* Manual entry remains available. */}
   throw Error('Barangay suggestions are unavailable. You can type your barangay yourself.');
  }
 }
}
