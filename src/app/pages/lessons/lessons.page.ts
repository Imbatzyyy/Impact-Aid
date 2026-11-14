import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { db, progressData } from '../../services/backend';
import { COURSE } from '../../models/course';
import { LESSON_SECTIONS } from './lesson-sections';

@Component({changeDetection:ChangeDetectionStrategy.Eager,selector:'app-lessons',standalone:true,imports:[CommonModule,IonContent,IonIcon,RouterLink],templateUrl:'./lessons.page.html',styleUrls:['./lessons.page.scss']})
export class LessonsPage {
  @ViewChild(IonContent) content?:IonContent;
  readonly course=COURSE;readonly sections=LESSON_SECTIONS;
  active:number|null=null;section=0;completed:number[]=[];bookmarks:Record<number,number>={};
  userId='';loading=true;saving=false;loadError=false;saveError='';private view=0;
  get current(){return this.active===null?null:this.course[this.active];}
  get chapters(){return this.active===null?[]:this.sections[this.active];}
  async ionViewWillEnter(){
    const view=++this.view;this.loading=true;this.loadError=false;this.userId='';this.completed=[];this.bookmarks={};
    try{const d=await progressData();const {data,error}=await db.from('lesson_bookmarks').select('lesson_id,section_index').eq('user_id',d.user.id);if(error)throw error;
      if(view!==this.view)return;this.userId=d.user.id;this.completed=d.lessons;this.bookmarks=Object.fromEntries((data??[]).map(b=>[b.lesson_id,b.section_index]));
    }catch{if(view===this.view)this.loadError=true;}finally{if(view===this.view)this.loading=false;}
  }
  ionViewWillLeave(){this.view++;this.active=null;this.saving=false;this.saveError='';}
  open(i:number){this.active=i;this.saveError='';this.section=this.completed.includes(i)?0:Math.min(this.bookmarks[i]??0,this.chapters.length-1);void this.content?.scrollToTop(0);}
  close(){if(this.saving)return;this.active=null;this.saveError='';void this.content?.scrollToTop(0);}
  async move(next:number){
    if(this.saving||this.active===null||next<0||next>=this.chapters.length)return;
    const id=this.active,view=this.view;this.saveError='';this.saving=true;
    try{if(!this.completed.includes(id)&&this.userId){const {error}=await db.from('lesson_bookmarks').upsert({user_id:this.userId,lesson_id:id,section_index:next},{onConflict:'user_id,lesson_id'});if(error)throw error;}
      if(view!==this.view)return;this.bookmarks[id]=next;this.section=next;void this.content?.scrollToTop(0);
    }catch{if(view===this.view)this.saveError='Your place could not be saved. Check your connection and try the section again.';}finally{if(view===this.view)this.saving=false;}
  }
  async finish(){
    if(this.active===null||!this.userId||this.saving||this.section!==this.chapters.length-1)return;
    const id=this.active,view=this.view;this.saveError='';this.saving=true;
    try{const {error}=await db.from('lesson_completions').upsert({user_id:this.userId,lesson_id:id},{onConflict:'user_id,lesson_id',ignoreDuplicates:true});if(error)throw error;
      if(view===this.view)this.completed=[...new Set([...this.completed,id])];
    }catch{if(view===this.view)this.saveError='Completion was not saved. Check your connection and tap Finish lesson again.';}finally{if(view===this.view)this.saving=false;}
  }
}
