export interface Term { id:string; label:string; starts:string; ends:string }
export function calendarState(terms:Term[], instant = new Date()) {
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(instant);
  const part=(kind:string)=>parts.find(p=>p.type===kind)?.value;
  const today=[part('year'),part('month'),part('day')].join('-');
  const ordered=[...terms].sort((a,b)=>a.starts.localeCompare(b.starts));
  const current=ordered.filter(t=>t.starts<=today).at(-1);
  return {current,next:ordered.find(t=>t.starts>today),review:!!current&&today>current.ends};
}
export function displayDate(day:string){return new Intl.DateTimeFormat('en-PH',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'));}
