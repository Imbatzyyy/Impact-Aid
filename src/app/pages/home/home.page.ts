import { ProfileService } from '../../services/profile.service';
import { ChangeDetectionStrategy } from '@angular/core';
import { db, session, account, progressData, topics } from '../../services/backend';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonContent, IonIcon, IonSkeletonText } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-home',
  standalone: true,
  imports: [IonContent, IonIcon, IonSkeletonText, CommonModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage  {
  userName = '';
  userInitial = '';
  loading = true;

  // 🟦 Lessons
  lessonsCompleted = 0;
  totalLessons = 6;
  lessonsPercent = 0;

  // 🟪 Quizzes
  quizzesCompleted = 0;
  totalQuizzes = 6;
  quizPercent = 0;

  // 🌍 Overall Progress
  overallProgress = 0;

  safetyTips: string[] = [
    'Keep an emergency kit ready with water, food, flashlight, first aid supplies, and important documents.',
    'Know your evacuation routes and nearest shelters in case of a disaster.',
    'Store important contact numbers on paper in case your phone battery dies.',
    'Regularly check expiry dates of food and medicine in your emergency kit.',
    'Secure heavy furniture to walls to prevent injuries during earthquakes.',
    'Learn basic first aid and CPR—it could save a life during an emergency.',
    'Keep a whistle in your kit to signal rescuers if trapped.',
    'Have an emergency plan and discuss it with your family members.',
    'During floods, avoid walking or driving through moving water.',
    'Prepare extra supplies for pets—food, water, and medicine.'
  ];
  randomTip = '';

  loadError=false;

  constructor(private router:Router,public profiles:ProfileService){}
  ngOnInit(){void this.ionViewWillEnter();}
  async ionViewWillEnter(){
    this.loading=true; this.loadError=false; this.userName='';this.userInitial=''; this.setRandomTip();
    try {
      const [d]=await Promise.all([progressData(),this.profiles.load().catch(()=>null)]);
      this.userName=d.username;this.userInitial=d.username.charAt(0).toUpperCase();
      this.lessonsCompleted=d.lessons.length;this.quizzesCompleted=d.scores.filter(n=>n>=60).length;
      this.lessonsPercent=Math.round(this.lessonsCompleted/6*100);this.quizPercent=Math.round(this.quizzesCompleted/6*100);
      this.overallProgress=Math.round((this.lessonsCompleted+this.quizzesCompleted)/12*100);
    } catch {this.loadError=true;} finally {this.loading=false;}
  }
  setRandomTip() {
    const randomIndex = Math.floor(Math.random() * this.safetyTips.length);
    this.randomTip = this.safetyTips[randomIndex];
  }

  goToProfile() {
    this.router.navigateByUrl('/profile');
  }

  navigateTo(page: string) {
    this.router.navigateByUrl(`/${page}`);
  }
}
