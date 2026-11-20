import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { db, progressData, topics } from '../../services/backend';
import { COURSE } from '../../models/course';
import { QUIZ_DATA, prepareQuiz } from '../../models/quiz-data';
import { calendarState,displayDate,Term } from '../../models/academic-calendar';
import { haptic } from '../../ui/feedback';

interface Draft { attempt:string; assignment:string; topic:number; label:string; page:number; items:{id:number;order:number[]}[]; answers:number[] }
interface Release {id:string; ids:number[]; label:string; term:string}
@Component({selector:'app-quiz',standalone:true,changeDetection:ChangeDetectionStrategy.Eager,imports:[IonContent,IonIcon,RouterLink],templateUrl:'./quiz.page.html',styleUrls:['./quiz.page.scss']})
export class QuizPage {
  @ViewChild(IonContent) content?:IonContent;
  readonly course=COURSE;readonly displayDate=displayDate;
  terms:Term[]=[];scores:number[]=[];uid=''; busy=false; loading=true;problem=''; result:number|null=null;
  draft:Draft|null=null;private epoch=0;
  /** Which way the last question change went, so questions slide the matching direction. */
  direction:'forward'|'back'='forward';
  readonly confetti=Array.from({length:14},(_,i)=>i);
  get passed(){return this.result!==null&&this.result>=9;}
  term=calendarState([]);
  get quiz(){return this.draft?QUIZ_DATA[this.draft.topic]:null;}
  get item(){return this.draft?.items[this.draft.page];}
  private key(topic:number){return 'impact-aid.quiz.v1.'+this.uid+'.'+topic;}
  private read(topic:number):Draft|null {
    try{return JSON.parse(localStorage.getItem(this.key(topic))??'null');}catch{return null;}
  }
  private remember(){if(this.draft)localStorage.setItem(this.key(this.draft.topic),JSON.stringify(this.draft));}
  hasDraft(topic:number){return !!this.uid&&!!this.read(topic);}
  async ionViewWillEnter(){
    const epoch=++this.epoch;this.draft=null;this.result=null;this.uid='';this.terms=[];this.term=calendarState([]);this.scores=[];this.problem='';this.loading=true;this.busy=false;
    try{const [p,cal]=await Promise.all([progressData(),db.from('school_terms').select('id,label,starts,ends')]);if(cal.error)throw cal.error;
      if(epoch!==this.epoch)return;this.uid=p.user.id;this.scores=p.scores;this.terms=cal.data??[];this.term=calendarState(this.terms);
    }catch{if(epoch===this.epoch)this.problem='Your quiz library could not load. Reconnect and try again.';}finally{if(epoch===this.epoch)this.loading=false;}
  }
  ionViewWillLeave(){this.epoch++;this.draft=null;this.result=null;this.busy=false;this.uid='';}
  library(){if(this.busy)return;this.draft=null;this.result=null;this.problem='';void this.content?.scrollToTop(0);}
  async start(topic:number){
    if(this.busy||!this.uid)return;this.busy=true;this.problem='';const epoch=this.epoch;
    try{
      const key='impact-aid.quiz.install';const device=localStorage.getItem(key)??crypto.randomUUID();localStorage.setItem(key,device);
      const r=await db.rpc('get_quiz_release',{p_topic:topics[topic],p_device:device});if(r.error)throw r.error;
      if(epoch!==this.epoch)return;const release=r.data as Release;const bank=QUIZ_DATA[topic].allQuestions;
      const saved=this.read(topic);this.result=null;
      if(saved&&saved.assignment===release.id&&saved.items?.length===15&&saved.answers?.length===15&&saved.page>=0&&saved.page<15)this.draft=saved;
      else{
        const items=prepareQuiz(release.ids.map(i=>bank[i])).map(q=>{const id=bank.findIndex(v=>v.question===q.question);return {id,order:q.options.map(o=>bank[id].options.indexOf(o))};});
        this.direction='forward';this.draft={topic,attempt:crypto.randomUUID(),assignment:release.id,label:release.label,page:0,items,answers:Array(15).fill(-1)};this.remember();
      }void this.content?.scrollToTop(0);
    }catch{if(epoch===this.epoch)this.problem='Could not open the quiz. Check your connection and try again.';}finally{if(epoch===this.epoch)this.busy=false;}
  }
  choose(option:number){if(this.draft&&!this.busy){if(this.draft.answers[this.draft.page]!==option)haptic('select');this.draft.answers[this.draft.page]=option;this.remember();}}
  move(to:number){if(!this.draft||this.busy||to<0||to>=15)return;this.direction=to>this.draft.page?'forward':'back';this.draft.page=to;this.remember();void this.content?.scrollToTop(0);}
  async submit(){
    const d=this.draft;if(!d||this.busy||d.answers.some(a=>a<0))return;this.busy=true;this.problem='';const epoch=this.epoch;
    try{const r=await db.rpc('submit_semester_quiz',{p_attempt:d.attempt,p_assignment:d.assignment,p_answers:d.items.map((item,i)=>({question_id:item.id,choice:d.answers[i]}))});if(r.error)throw r.error;
      if(epoch!==this.epoch)return;this.result=Number(r.data);this.scores[d.topic]=Math.round(this.result*100/15);haptic(this.result>=9?'success':'tap');localStorage.removeItem(this.key(d.topic));void this.content?.scrollToTop(0);
    }catch{if(epoch===this.epoch)this.problem='Your answers are still on this device. Reconnect and tap Save result again.';}finally{if(epoch===this.epoch)this.busy=false;}
  }
}
