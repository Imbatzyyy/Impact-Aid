import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { Router } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { db, progressData } from '../../services/backend';
import { COURSE } from '../../models/course';

const SAFETY_TIPS = [
  'Keep an emergency kit ready with water, food, a flashlight, first aid supplies and important documents.',
  'Know your evacuation routes and nearest shelters in case of a disaster.',
  'Write important contact numbers on paper in case your phone battery dies.',
  'Check the expiry dates of food and medicine in your emergency kit regularly.',
  'Secure heavy furniture to walls to prevent injuries during earthquakes.',
  'Learn basic first aid and CPR. It could save a life during an emergency.',
  'Keep a whistle in your kit to signal rescuers if you are trapped.',
  'Have an emergency plan and talk it through with your family.',
  'During floods, avoid walking or driving through moving water.',
  'Prepare extra supplies for pets: food, water and medicine.',
];

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-home',
  standalone: true,
  imports: [IonContent, IonIcon],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnDestroy {
  userName = '';
  userInitial = '';
  loading = true;
  loadError = false;
  lessonsCompleted = 0;
  quizzesCompleted = 0;
  /** First guide not yet finished, and first quiz not yet passed (-1 when none). */
  private nextLesson = -1;
  private nextQuiz = -1;
  readonly totalLessons = 6;
  readonly totalQuizzes = 6;
  overallProgress = 0;
  greeting = 'Good day';
  randomTip = '';
  private visit = 0;

  // Keep the last numbers on screen while a revisit refreshes them, but never across accounts.
  private readonly auth = db.auth.onAuthStateChange(event => {
    if (event === 'SIGNED_OUT') { this.userName = ''; this.userInitial = ''; this.overallProgress = this.lessonsCompleted = this.quizzesCompleted = 0; this.nextLesson = this.nextQuiz = -1; }
  }).data.subscription;

  constructor(private router: Router, public profiles: ProfileService) {}
  ngOnDestroy() { this.auth.unsubscribe(); this.visit++; }

  // Ionic calls this on every visit, including the first, so there is one load per visit.
  async ionViewWillEnter() {
    const visit = ++this.visit;
    this.loading = true; this.loadError = false;
    this.greeting = greetingFor(new Date());
    this.randomTip = SAFETY_TIPS[Math.floor(Math.random() * SAFETY_TIPS.length)];
    try {
      const [d] = await Promise.all([progressData(), this.profiles.load().catch(() => null)]);
      if (visit !== this.visit) return;
      this.userName = d.username; this.userInitial = d.username.charAt(0).toUpperCase();
      this.lessonsCompleted = d.lessons.length;
      this.nextLesson = COURSE.findIndex((_, i) => !d.lessons.includes(i));
      this.nextQuiz = d.scores.findIndex(n => n < 60);
      this.quizzesCompleted = d.scores.filter(n => n >= 60).length;
      this.overallProgress = Math.round((this.lessonsCompleted + this.quizzesCompleted) / 12 * 100);
    } catch {
      if (visit === this.visit) this.loadError = true;
    } finally {
      if (visit === this.visit) this.loading = false;
    }
  }
  ionViewWillLeave() { this.visit++; this.loading = false; }

  get nextStep() {
    if (this.lessonsCompleted < this.totalLessons) return this.nextLesson >= 0 ? `Your next step: read the ${COURSE[this.nextLesson].title} guide.` : 'Your next step: open a guide and read one section.';
    if (this.quizzesCompleted < this.totalQuizzes) return this.nextQuiz >= 0 ? `Your next step: take the ${COURSE[this.nextQuiz].title} quiz.` : 'Your next step: try a practice quiz.';
    return 'You’ve finished the course. Your certificate is in My Progress.';
  }

  navigateTo(page: string) { void this.router.navigateByUrl(`/${page}`); }
}

export function greetingFor(now: Date): string {
  const hour = now.getHours();
  return hour < 5 ? 'Good evening' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}
