import {describe,it,expect} from 'vitest';
import {distanceKm,findPlaces,escapeMapText,dialablePhone,EmergencyPlace} from '../src/app/models/emergency-places';
const point={lat:14.641,lng:121.042};
const place=(id:string,type:EmergencyPlace['type'],lat=point.lat,lng=point.lng):EmergencyPlace=>({id,name:`${id} Station`,type,lat,lng,address:'Quezon City',phone:'',source:'https://www.openstreetmap.org/node/1',coordinateKind:'point'});
const records=[place('BFP','fire'),place('QCDRRMO','rescue',14.642),place('City Hall','government',14.643),place('Far','hospital',10,123)];
describe('emergency directory',()=>{
 it('shows fire, rescue and government facilities within radius, sorted without rounded-distance boundary errors',()=>{
   expect(findPlaces(records,point,10,'all','').map(p=>p.id)).toEqual(['BFP','QCDRRMO','City Hall']);
   expect(findPlaces(records,point,.1,'all','').map(p=>p.id)).toEqual(['BFP']);
 });
 it('supports nationwide and combined name/address search without losing category filters',()=>{
   expect(findPlaces(records,point,0,'hospital','Far')).toHaveLength(1);
   expect(findPlaces(records,point,0,'fire',' bfp QUEZON ')).toHaveLength(1);
   expect(findPlaces(records,point,0,'police','bfp')).toHaveLength(0);
 });
 it('handles exact, distant and zero coordinates without NaN or guessed positions',()=>{
   expect(distanceKm(point,point)).toBe(0);expect(distanceKm({lat:0,lng:0},{lat:0,lng:1})).toBeCloseTo(111.195,2);
   expect(distanceKm({lat:0,lng:0},{lat:0,lng:180})).toBeCloseTo(20015,0);
 });
 it('treats contributor names and addresses as text in popup HTML',()=>{
   expect(escapeMapText('<img src=x onerror="alert(1)"> & \'')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;');
 });
 it('never concatenates multiple phone numbers or dials arbitrary URI/USSD/extension strings',()=>{
   expect(dialablePhone('+63 2 8928 4396; +63 917 123 4567')).toBe('+63289284396');
   expect(dialablePhone('(02) 8928-4396')).toBe('+63289284396');
   for(const bad of ['*123#','javascript:alert(1)','(02) 8988-4242 local 8038','','911','+632 374 7377','+63 2 2 3414 5903'])expect(dialablePhone(bad)).toBe('');
 });
});

import fs from 'node:fs';
const directory=JSON.parse(fs.readFileSync(new URL('../src/assets/data/emergency-places.json',import.meta.url),'utf8'));
describe('packaged Philippine directory integrity',()=>{
 it('contains all six requested sectors, valid source IDs and finite Philippine coordinates',()=>{
   expect(directory.license).toBe('ODbL-1.0');expect(Number.isFinite(Date.parse(directory.updatedAt))).toBe(true);
   const places=directory.places as EmergencyPlace[];
   expect(places.length).toBeGreaterThan(17000);expect(new Set(places.map(p=>p.id)).size).toBe(places.length);
   for(const type of ['hospital','police','fire','rescue','government','evacuation'])expect(places.filter(p=>p.type===type).length).toBeGreaterThan(250);
   for(const p of places){expect(p.name.length).toBeGreaterThan(0);expect(p.lat).toBeGreaterThan(4);expect(p.lat).toBeLessThan(22);expect(p.lng).toBeGreaterThan(116);expect(p.lng).toBeLessThan(127);expect(p.source).toMatch(/^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+$/);}
 });
 it('retains the source-checked QC rescue contact and distinguishes building centers',()=>{
   const rescue=directory.places.find((p:EmergencyPlace)=>p.id==='osm-way-260405236');
   expect(rescue.name).toContain('QCDRRMO');expect(dialablePhone(rescue.phone)).toBe('+63289284396');
   expect(rescue.phoneSource).toContain('https://quezoncity.gov.ph/');expect(rescue.coordinateKind).toBe('site');
 });
});
