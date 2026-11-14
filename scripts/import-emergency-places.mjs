// Reproducible offline OSM snapshot. No user coordinates are sent to Overpass by the app.
// Usage: node scripts/import-emergency-places.mjs path/to/overpass-response.json
import fs from 'node:fs';
const raw=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
if(raw.remark||!Array.isArray(raw.elements)||!raw.elements.length)throw Error('Incomplete or empty Overpass response');
const types={hospital:'hospital',police:'police',fire_station:'fire',townhall:'government'};
const label={hospital:'Hospital',police:'Police station',fire:'Fire station',rescue:'Rescue facility',government:'Local government office',evacuation:'Evacuation facility'};
const places=[];
for(const e of raw.elements){
 const t=e.tags??{},p=e.center??e,name=t['name:en']||t.name||t['official_name']||'';
 if(!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||Math.abs(p.lat)>90||Math.abs(p.lon)>180)continue;
 if(['yes','true'].includes(t.disused)||['yes','true'].includes(t.abandoned)||t.access==='no'||t.construction||/^(abandoned|demolished|proposed|disused) /i.test(name))continue;
 let type=types[t.amenity]||(t.healthcare==='hospital'?'hospital':null);
 if(/evacuation cent[er]/i.test(name)||(t.social_facility==='shelter'&&/displaced|disaster/.test(t['social_facility:for']??'')))type='evacuation';
 if(type!=='fire' && (['ambulance_station','rescue_station','disaster_response','water_rescue','lifeguard_base'].includes(t.emergency)||/\bDRRM\w*\b|Disaster Risk|Red Cross|Coast Guard|Rescue/i.test(name)))type='rescue';
 if(!type)continue;
 const address=t['addr:full']||[t['addr:housenumber'],t['addr:street'],t['addr:suburb'],t['addr:city'],t['addr:province']].filter(Boolean).join(', ')||'Street address not supplied by map contributor';
 const phone=t['contact:phone']||t.phone||'';
 places.push({id:`osm-${e.type}-${e.id}`,name:name||`${label[type]} (name not supplied)`,type,lat:p.lat,lng:p.lon,address,phone,source:`https://www.openstreetmap.org/${e.type}/${e.id}`,coordinateKind:e.center?'site':'point'});
}
// Merge exact-name duplicate node/building entries within ~55 m; retain distinct unnamed sites.
const out=[];const byName=new Map();
for(const p of places.sort((a,b)=>Number(a.coordinateKind==='site')-Number(b.coordinateKind==='site'))){
 const key=p.type+':'+p.name.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
 const prior=(byName.get(key)||[]).find(x=>!p.name.includes('name not supplied')&&Math.hypot(x.lat-p.lat,(x.lng-p.lng)*Math.cos(p.lat*Math.PI/180))<.0005);
 if(prior){if(!prior.phone)prior.phone=p.phone;continue;}
 out.push(p);byName.set(key,[...(byName.get(key)||[]),p]);
}
const overrides=JSON.parse(fs.readFileSync('scripts/emergency-place-overrides.json','utf8'));
for(const p of out){if(overrides[p.id])Object.assign(p,overrides[p.id]);}
const result={updatedAt:raw.osm3s?.timestamp_osm_base||new Date().toISOString(),license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',places:out};
fs.writeFileSync('src/assets/data/emergency-places.json',JSON.stringify(result));
console.log(JSON.stringify({count:out.length,updatedAt:result.updatedAt,types:Object.fromEntries(Object.keys(label).map(t=>[t,out.filter(x=>x.type===t).length]))},null,2));
