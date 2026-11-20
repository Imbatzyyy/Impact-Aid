import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { db, progressData } from '../../services/backend';
import { COURSE } from '../../models/course';
import { LESSON_SECTIONS } from './lesson-sections';
import { haptic } from '../../ui/feedback';

const SAVE_DELAY_MS = 700;

@Component({changeDetection:ChangeDetectionStrategy.Eager,selector:'app-lessons',standalone:true,imports:[IonContent,IonIcon,RouterLink],templateUrl:'./lessons.page.html',styleUrls:['./lessons.page.scss']})
export class LessonsPage {
  @ViewChild(IonContent) content?:IonContent;
  readonly course=COURSE;readonly sections=LESSON_SECTIONS;
  active:number|null=null;section=0;completed:number[]=[];bookmarks:Record<number,number>={};
  userId='';loading=true;saving=false;loadError=false;saveError='';
  /** Which way the last section change went, so the page slides the matching direction. */
  direction:'forward'|'back'='forward';
  private view=0;private saveTimer?:ReturnType<typeof setTimeout>;private pendingSave?:{user:string;lesson:number;section:number};
  get current(){return this.active===null?null:this.course[this.active];}
  get chapters(){return this.active===null?[]:this.sections[this.active];}
  async ionViewWillEnter(){
    const view=++this.view;this.loading=true;this.loadError=false;this.userId='';this.completed=[];this.bookmarks={};
    try{const d=await progressData();const {data,error}=await db.from('lesson_bookmarks').select('lesson_id,section_index').eq('user_id',d.user.id);if(error)throw error;
      if(view!==this.view)return;this.userId=d.user.id;this.completed=d.lessons;this.bookmarks=Object.fromEntries((data??[]).map(b=>[b.lesson_id,b.section_index]));
    }catch{if(view===this.view)this.loadError=true;}finally{if(view===this.view)this.loading=false;}
  }
  ionViewWillLeave(){this.flushSave();this.view++;this.active=null;this.saving=false;this.saveError='';}
  open(i:number){this.active=i;this.saveError='';this.direction='forward';this.section=this.completed.includes(i)?0:Math.min(this.bookmarks[i]??0,this.chapters.length-1);void this.content?.scrollToTop(0);}
  close(){if(this.saving)return;this.flushSave();this.active=null;this.saveError='';void this.content?.scrollToTop(0);}

  /** Reading never waits on the network: the section changes now and the place is saved shortly after. */
  move(next:number){
    if(this.saving||this.active===null||next<0||next>=this.chapters.length)return;
    const id=this.active;
    this.direction=next>this.section?'forward':'back';
    this.section=next;this.bookmarks[id]=next;
    void this.content?.scrollToTop(220);
    if(!this.completed.includes(id)&&this.userId){
      this.pendingSave={user:this.userId,lesson:id,section:next};
      clearTimeout(this.saveTimer);this.saveTimer=setTimeout(()=>this.flushSave(),SAVE_DELAY_MS);
    }
  }
  private flushSave(){
    clearTimeout(this.saveTimer);this.saveTimer=undefined;
    const pending=this.pendingSave;this.pendingSave=undefined;if(!pending)return;
    const view=this.view;
    void Promise.resolve(db.from('lesson_bookmarks').upsert({user_id:pending.user,lesson_id:pending.lesson,section_index:pending.section},{onConflict:'user_id,lesson_id'}))
      .then(({error})=>{if(error)throw error;if(view===this.view)this.saveError='';})
      .catch(()=>{if(view===this.view)this.saveError='Your place couldn’t be saved right now. You can keep reading; it tries again on your next section.';});
  }
  async finish(){
    if(this.active===null||!this.userId||this.saving||this.section!==this.chapters.length-1)return;
    const id=this.active,view=this.view;this.saveError='';this.saving=true;
    try{const {error}=await db.from('lesson_completions').upsert({user_id:this.userId,lesson_id:id},{onConflict:'user_id,lesson_id',ignoreDuplicates:true});if(error)throw error;
      if(view===this.view){this.completed=[...new Set([...this.completed,id])];haptic('success');}
    }catch{if(view===this.view)this.saveError='Completion was not saved. Check your connection and tap Finish lesson again.';}finally{if(view===this.view)this.saving=false;}
  }
}
