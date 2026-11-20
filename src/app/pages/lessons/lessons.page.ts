import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { db, progressData } from '../../services/backend';
import { COURSE } from '../../models/course';
import { LESSON_SECTIONS } from './lesson-sections';
import { haptic } from '../../ui/feedback';
import { OFFLINE_QUALITY, QUALITIES, VideoQuality, rememberQuality, startingQuality, streamMegabytes, videoSrc } from '../../models/video-quality';

const SAVE_DELAY_MS = 700;
const isOnline = () => globalThis.navigator?.onLine ?? true;

@Component({changeDetection:ChangeDetectionStrategy.Eager,selector:'app-lessons',standalone:true,imports:[IonContent,IonIcon,RouterLink],templateUrl:'./lessons.page.html',styleUrls:['./lessons.page.scss']})
export class LessonsPage {
  @ViewChild(IonContent) content?:IonContent;
  @ViewChild('player') player?:{nativeElement:HTMLVideoElement};
  readonly course=COURSE;readonly sections=LESSON_SECTIONS;
  active:number|null=null;section=0;completed:number[]=[];bookmarks:Record<number,number>={};
  userId='';loading=true;saving=false;loadError=false;saveError='';
  /** Which way the last section change went, so the page slides the matching direction. */
  direction:'forward'|'back'='forward';
  private view=0;private saveTimer?:ReturnType<typeof setTimeout>;private pendingSave?:{user:string;lesson:number;section:number};
  readonly qualities=QUALITIES;
  quality:VideoQuality=OFFLINE_QUALITY;online=true;
  /** The streamed quality that failed to load, so the note can say why the saved copy is playing. */
  failedQuality:VideoQuality|null=null;
  /** Where to pick up after the player switches files: the new file starts from zero otherwise. */
  private resume?:{time:number;playing:boolean};
  /** Losing the connection hands a streamed video to the saved copy before its buffer runs dry. */
  private readonly connectivity=()=>{
    this.online=isOnline();
    const player=this.player?.nativeElement;
    if(!this.online&&player)this.fallBack(player,!player.paused&&!player.ended);
  };
  get current(){return this.active===null?null:this.course[this.active];}
  get chapters(){return this.active===null?[]:this.sections[this.active];}
  get qualityNote(){
    const topic=this.current,failed=this.failedQuality;if(!topic)return '';
    if(failed)return this.online
      ?`${failed} stopped, so the 480p copy saved on your phone took over. Choose ${failed} again to stream it.`
      :`You’re offline, so the 480p copy saved on your phone took over. Choose ${failed} again when you’re back online.`;
    if(this.quality===OFFLINE_QUALITY)return this.online?'Saved on your phone. Plays without internet or mobile data.':'You’re offline. The 480p copy saved on your phone still plays.';
    const label=this.qualities.find(q=>q.id===this.quality)?.label,mb=streamMegabytes(topic.video,this.quality);
    return `${label} · Streams over the internet${mb?`, about ${mb} MB for this video`:''}.`;
  }
  async ionViewWillEnter(){
    globalThis.addEventListener?.('online',this.connectivity);globalThis.addEventListener?.('offline',this.connectivity);this.online=isOnline();
    const view=++this.view;this.loading=true;this.loadError=false;this.userId='';this.completed=[];this.bookmarks={};
    try{const d=await progressData();const {data,error}=await db.from('lesson_bookmarks').select('lesson_id,section_index').eq('user_id',d.user.id);if(error)throw error;
      if(view!==this.view)return;this.userId=d.user.id;this.completed=d.lessons;this.bookmarks=Object.fromEntries((data??[]).map(b=>[b.lesson_id,b.section_index]));
    }catch{if(view===this.view)this.loadError=true;}finally{if(view===this.view)this.loading=false;}
  }
  ionViewWillLeave(){globalThis.removeEventListener?.('online',this.connectivity);globalThis.removeEventListener?.('offline',this.connectivity);this.flushSave();this.view++;this.active=null;this.saving=false;this.saveError='';}
  open(i:number){this.active=i;this.saveError='';this.direction='forward';this.online=isOnline();this.quality=startingQuality(this.online);this.failedQuality=null;this.resume=undefined;this.section=this.completed.includes(i)?0:Math.min(this.bookmarks[i]??0,this.chapters.length-1);void this.content?.scrollToTop(0);}
  close(){if(this.saving)return;this.flushSave();this.active=null;this.saveError='';void this.content?.scrollToTop(0);}

  videoSrc(video:string){return videoSrc(video,this.quality);}
  /** Switch files and keep the viewer's place. A streamed choice is remembered for next time. */
  setQuality(next:VideoQuality,player:HTMLVideoElement){
    if(next===this.quality||(next!==OFFLINE_QUALITY&&!this.online))return;
    this.switchTo(next,player,!player.paused&&!player.ended);
    this.failedQuality=null;rememberQuality(next);haptic('select');
  }
  /** A streamed file that can't load (no signal, site down) falls back to the copy on the phone. */
  fallBack(player:HTMLVideoElement,playing=true){
    if(this.quality===OFFLINE_QUALITY)return;
    this.failedQuality=this.quality;
    this.switchTo(OFFLINE_QUALITY,player,playing);
  }
  restore(player:HTMLVideoElement){
    const resume=this.resume;this.resume=undefined;if(!resume)return;
    if(resume.time>0)player.currentTime=Number.isFinite(player.duration)?Math.min(resume.time,player.duration):resume.time;
    if(resume.playing)void player.play().catch(()=>{});
  }
  private switchTo(next:VideoQuality,player:HTMLVideoElement,playing:boolean){
    // A file that never loaded has already reset the clock to zero, so keep the place saved before it.
    this.resume={time:this.resume?.time??player.currentTime,playing};this.quality=next;
    // The player holds back loading (preload="none"), so ask it to play once Angular has swapped the file.
    if(playing)setTimeout(()=>{if(player.isConnected)void player.play().catch(()=>{});});
  }

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
