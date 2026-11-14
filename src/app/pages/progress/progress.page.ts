import { ChangeDetectionStrategy } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory,Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { getBadgeForScore } from '../../models/badge.model';
import { db, progressData, topics } from '../../services/backend';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { COURSE } from '../../models/course';
import { Router, RouterLink } from '@angular/router';
import { 
  IonContent, 
  IonIcon,
  ToastController 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  trendingUp,
  bookOutline,
  bulbOutline,
  checkmarkCircle,
  trophy,
  close,
  download,
  shareSocial,
  calendarOutline,
  star
} from 'ionicons/icons';

interface User {
  username: string;
  email?: string;
}

interface Progress {
  completedLessons: boolean[];
  quizScores: number[];
  badges: string[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-progress',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, FormsModule,
    IonContent,
    IonIcon
  ],
  templateUrl: './progress.page.html',
  styleUrls: ['./progress.page.scss'],
})
export class ProgressPage implements OnInit, OnDestroy {
  user: User = { username: '', email: '' };
  readonly course=COURSE;
  history:{topic:string;correct:number;total:number;taken_at:string}[]=[];
  showCertificate = false;
  loading = true;

  progress: Progress = {
    completedLessons: Array(6).fill(false),
    quizScores: Array(6).fill(-1),
    badges: [],
  };

  lessonTitles = [
    { title: 'Earthquake', emoji: '🏔️' },
    { title: 'Tsunami', emoji: '🌊' },
    { title: 'Typhoon', emoji: '🌀' },
    { title: 'Flood', emoji: '💧' },
    { title: 'Landslide', emoji: '⚠️' },
    { title: 'Volcanic Eruption', emoji: '🌋' },
  ];

  loadError=false;
  private loadVersion=0;
  private authSubscription?:{unsubscribe:()=>void};

  constructor(

    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({
      'trending-up': trendingUp,
      'book-outline': bookOutline,
      'bulb-outline': bulbOutline,
      'checkmark-circle': checkmarkCircle,
      'trophy': trophy,
      'close': close,
      'download': download,
      'share-social': shareSocial,
      'calendar-outline': calendarOutline,
      'star': star
    });
  }

  ngOnInit(){
    this.authSubscription=db.auth.onAuthStateChange(event=>{
      if(event==='SIGNED_OUT' || event==='SIGNED_IN')this.ionViewWillLeave();
    }).data.subscription;
    void this.ionViewWillEnter();
  }
  private clearProgress(){
    this.user={username:'',email:''};
    this.progress={completedLessons:Array(6).fill(false),quizScores:Array(6).fill(-1),badges:[]};
    this.showCertificate=false;this.history=[];
  }
  ionViewWillLeave(){
    this.loadVersion++;
    this.clearProgress();
    this.loading=false;this.loadError=false;
  }
  ngOnDestroy(){this.authSubscription?.unsubscribe();this.ionViewWillLeave();}
  async ionViewWillEnter(){
    const version=++this.loadVersion;
    this.clearProgress();
    this.loading=true;this.loadError=false;
    try {
      const d=await progressData(true);
      if(version!==this.loadVersion)return;
      this.user={username:d.username,email:d.user.email};
      this.progress.completedLessons=Array.from({length:6},(_,i)=>d.lessons.includes(i));
      this.progress.quizScores=d.scores;this.history=d.attempts??[];
      this.progress.badges=d.scores.flatMap((score,i)=>{const b=getBadgeForScore(topics[i],score);return b?[b.name]:[];});
    } catch {
      if(version===this.loadVersion){this.clearProgress();this.loadError=true;}
    } finally {if(version===this.loadVersion)this.loading=false;}
  }
  get completedCount(): number {
    return this.progress.completedLessons.filter(Boolean).length;
  }

  get attemptedQuizzes(): number {
    return this.progress.quizScores.filter((score) => score >= 0).length;
  }

  get completedQuizzes(): number {
    return this.progress.quizScores.filter((score) => score >= 60).length;
  }

  get averageQuizScore(): number {
    const validScores = this.progress.quizScores.filter((s) => s >= 0);
    if (validScores.length === 0) return 0;
    const sum = validScores.reduce((a, b) => a + b, 0);
    return Math.round(sum / validScores.length);
  }

  get progressPercentage(): number {
  // Lessons contribute 50% of total progress
  const lessonPoints = (this.completedCount / 6) * 50;
  
  // Quizzes contribute 50% based on NUMBER PASSED (not average score)
  const quizPoints = (this.completedQuizzes / 6) * 50;
  
  const total = lessonPoints + quizPoints;
  return Math.round(total);
}

  get isFullyCompleted(): boolean {
    return !this.loading && !this.loadError && this.completedCount === 6 && this.completedQuizzes === 6;
  }

  get currentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  get certificateId(): string {
    const cleanDate = this.currentDate.replace(/\s/g, '');
    const cleanUsername = this.user.username.toUpperCase();
    return `IA-${cleanUsername}-${cleanDate}`;
  }

  getUserInitial(): string {
    return this.user.username.charAt(0).toUpperCase();
  }

  isLessonCompleted(idx: number): boolean {
    return this.progress.completedLessons[idx] || false;
  }

  getQuizScore(idx: number): number {
    return this.progress.quizScores[idx] ?? -1;
  }

  isQuizPassed(idx: number): boolean {
    const score = this.progress.quizScores[idx] ?? -1;
    return score >= 60;
  }

  hasQuizAttempt(idx: number): boolean {
    const score = this.progress.quizScores[idx] ?? -1;
    return score >= 0;
  }

  openCertificate() {
    this.showCertificate = this.isFullyCompleted;
  }

  closeCertificate() {
    this.showCertificate = false;
  }

  private certificateImage(){
    const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=980;
    const c=canvas.getContext('2d')!;
    c.fillStyle='#f6faff';c.fillRect(0,0,1400,980);c.strokeStyle='#1e5287';c.lineWidth=6;c.strokeRect(38,38,1324,904);
    c.textAlign='center';
    const line=(text:string,y:number,size:number,color:string)=>{c.fillStyle=color;c.font=size+'px Georgia,serif';c.fillText(text,700,y,1190);};
    line('I M P A C T   A I D',190,40,'#237873'); line('Certificate of Achievement',330,76,'#153651');
    line('Awarded to',450,32,'#536574');line(this.user.username,550,70,'#153651');
    line('For completing six disaster preparedness lessons',690,37,'#324d61');line('and passing all six quizzes.',747,37,'#324d61');
    line('Issued '+this.currentDate,855,28,'#536574');
    return canvas.toDataURL('image/png');
  }
  async handleDownloadCertificate(){
    if(!this.isFullyCompleted)return;
    const version=this.loadVersion;
    try{
      const data=this.certificateImage();
      if(Capacitor.isNativePlatform()){
        const permissions=await Filesystem.checkPermissions();
        if(version!==this.loadVersion || !this.isFullyCompleted)return;
        if(permissions.publicStorage!=='granted'){
          const granted=await Filesystem.requestPermissions();
          if(granted.publicStorage!=='granted')throw new Error('Storage permission was denied');
        }
        if(version!==this.loadVersion || !this.isFullyCompleted)return;
        await Filesystem.writeFile({directory:Directory.Documents,path:'Impact Aid/Certificate.png',data:data.split(',')[1],recursive:true});
        if(version!==this.loadVersion || !this.isFullyCompleted)return;
        await this.showToast('Saved to Documents/Impact Aid/Certificate.png','success');
      }else{const blob=await(await fetch(data)).blob();if(version!==this.loadVersion || !this.isFullyCompleted)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.download='Impact-Aid-Certificate.png';a.href=url;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
    }catch{await this.showToast('Could not save the certificate. Try Share instead.','danger');}
  }
  async handleShareCertificate(){
    if(!this.isFullyCompleted)return;
    const version=this.loadVersion;
    try{
      if(Capacitor.isNativePlatform()){
        const file=await Filesystem.writeFile({directory:Directory.Cache,path:'Impact-Aid-Certificate.png',data:this.certificateImage().split(',')[1]});
        if(version!==this.loadVersion || !this.isFullyCompleted)return;
        await Share.share({title:'Impact Aid Certificate',files:[file.uri]});
      }else if(navigator.share){await navigator.share({title:'Impact Aid Certificate',text:this.user.username+' completed the Impact Aid preparedness course.'});}
      else await this.showToast('Download the certificate to share it.','primary');
    }catch{await this.showToast('Certificate was not shared.');}
  }
  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
      cssClass: 'custom-toast',
    });
    await toast.present();
  }
}
