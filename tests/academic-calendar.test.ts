import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {calendarState} from '../src/app/models/academic-calendar';
import {QUIZ_DATA} from '../src/app/models/quiz-data';
const sql=readFileSync('supabase/migrations/202611140002_semester_quizzes.sql','utf8');
const terms=[...sql.matchAll(/\('(qc26-[a-z]+)','([^']+)','([\d-]+)','([\d-]+)'\)/g)].map(([,id,label,starts,ends])=>({id,label,starts,ends}));
it('activates the QC releases at midnight in Manila and preserves review over breaks',()=>{
 expect(terms).toHaveLength(3);
 for(const [instant,id,review] of [['2026-07-05T15:59Z',undefined,false],['2026-07-05T16:00Z','qc26-first',false],['2026-11-07T15:59Z','qc26-first',false],['2026-11-07T16:00Z','qc26-first',true],['2026-11-25T16:00Z','qc26-second',false],['2026-12-28T00:00Z','qc26-second',false],['2027-04-14T16:00Z','qc26-second',true],['2027-05-02T16:00Z','qc26-summer',false],['2027-06-11T16:00Z','qc26-summer',true]] as const){
 const s=calendarState(terms,new Date(instant));expect([s.current?.id,s.review]).toEqual([id,review]);}
});
it('grades every bank question with the same key on server and device',()=>{
 for(const q of QUIZ_DATA){const line=sql.split('\n').find(s=>s.startsWith("('"+q.name.toLowerCase()+"',array["));expect(line).toBeTruthy();const key=line!.split('array[')[1].split(']')[0].split(',').map(Number);expect(key).toEqual(q.allQuestions.map(v=>v.correctAnswer));}
});
