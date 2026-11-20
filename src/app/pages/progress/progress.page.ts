import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { IonContent, IonIcon, IonModal, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { getBadgeForScore } from '../../models/badge.model';
import { certificateIssuedOn, db, progressData, topics } from '../../services/backend';
import { COURSE } from '../../models/course';
import { haptic, showToast, Tone } from '../../ui/feedback';

interface User { username: string; email?: string; }
interface Progress { completedLessons: boolean[]; quizScores: number[]; badges: string[]; }

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-progress',
  standalone: true,
  imports: [DatePipe, TitleCasePipe, RouterLink, IonContent, IonIcon, IonModal],
  templateUrl: './progress.page.html',
  styleUrls: ['./progress.page.scss'],
})
export class ProgressPage implements OnInit, OnDestroy {
  user: User = { username: '', email: '' };
  readonly course = COURSE;
  history: { topic: string; correct: number; total: number; taken_at: string }[] = [];
  showCertificate = false;
  loading = true;
  loadError = false;
  progress: Progress = { completedLessons: Array(6).fill(false), quizScores: Array(6).fill(-1), badges: [] };
  /** When the course was first completed; null until known. */
  issuedOn: string | null = null;
  private userId = '';
  private loadVersion = 0;
  private visible = false;
  private authSubscription?: { unsubscribe: () => void };

  constructor(private router: Router, private toastController: ToastController) {}

  ngOnInit() {
    // Supabase also reports SIGNED_IN whenever the app returns to the foreground, so only
    // a different account (or signing out) clears the record on screen.
    this.authSubscription = db.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') this.invalidate();
      else if (event === 'SIGNED_IN' && session?.user?.id !== this.userId) {
        this.invalidate();
        if (this.visible) void this.ionViewWillEnter();
      }
    }).data.subscription;
  }
  private clearProgress() {
    this.user = { username: '', email: '' };
    this.progress = { completedLessons: Array(6).fill(false), quizScores: Array(6).fill(-1), badges: [] };
    this.showCertificate = false; this.history = []; this.issuedOn = null; this.userId = '';
  }
  private invalidate() {
    this.loadVersion++;
    this.clearProgress();
    this.loading = false; this.loadError = false;
  }
  ionViewWillLeave() { this.visible = false; this.invalidate(); }
  ngOnDestroy() { this.authSubscription?.unsubscribe(); this.ionViewWillLeave(); }

  // Ionic calls this on every visit, including the first.
  async ionViewWillEnter() {
    this.visible = true;
    const version = ++this.loadVersion;
    this.clearProgress();
    this.loading = true; this.loadError = false;
    try {
      const d = await progressData(true);
      if (version !== this.loadVersion) return;
      this.user = { username: d.username, email: d.user.email };
      this.userId = d.user.id;
      this.progress.completedLessons = Array.from({ length: 6 }, (_, i) => d.lessons.includes(i));
      this.progress.quizScores = d.scores; this.history = d.attempts ?? [];
      this.progress.badges = d.scores.flatMap((score, i) => { const b = getBadgeForScore(topics[i], score); return b ? [b.name] : []; });
    } catch {
      if (version === this.loadVersion) { this.clearProgress(); this.loadError = true; }
    } finally { if (version === this.loadVersion) this.loading = false; }
    if (version === this.loadVersion && this.isFullyCompleted) void this.loadIssueDate(version);
  }
  private async loadIssueDate(version: number) {
    try {
      const issued = await certificateIssuedOn(this.userId);
      if (version === this.loadVersion) this.issuedOn = issued;
    } catch { /* The certificate still shows; only the date is left out. */ }
  }

  get completedCount() { return this.progress.completedLessons.filter(Boolean).length; }
  get attemptedQuizzes() { return this.progress.quizScores.filter(score => score >= 0).length; }
  get completedQuizzes() { return this.progress.quizScores.filter(score => score >= 60).length; }
  get averageQuizScore() {
    const valid = this.progress.quizScores.filter(s => s >= 0);
    return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
  }
  /** Lessons and passed quizzes each count for half of the course. */
  get progressPercentage() { return Math.round((this.completedCount / 6) * 50 + (this.completedQuizzes / 6) * 50); }
  get isFullyCompleted() { return !this.loading && !this.loadError && this.completedCount === 6 && this.completedQuizzes === 6; }
  get remainingSteps() { return 12 - this.completedCount - this.completedQuizzes; }

  get issuedDate(): string {
    return this.issuedOn ? new Date(this.issuedOn).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila' }) : '';
  }
  /** Stable for the account: the same ID every time the certificate is opened. */
  get certificateId(): string {
    const hex = this.userId.replace(/[^0-9a-f]/gi, '').slice(0, 8).toUpperCase();
    return hex.length === 8 ? `IA-${hex.slice(0, 4)}-${hex.slice(4)}` : '';
  }

  isLessonCompleted(idx: number) { return this.progress.completedLessons[idx] || false; }
  getQuizScore(idx: number) { return this.progress.quizScores[idx] ?? -1; }
  isQuizPassed(idx: number) { return (this.progress.quizScores[idx] ?? -1) >= 60; }
  hasQuizAttempt(idx: number) { return (this.progress.quizScores[idx] ?? -1) >= 0; }

  openCertificate() {
    this.showCertificate = this.isFullyCompleted;
    if (this.showCertificate) haptic('success');
  }
  closeCertificate() { this.showCertificate = false; }

  private certificateImage() {
    const canvas = document.createElement('canvas'); canvas.width = 1400; canvas.height = 980;
    const c = canvas.getContext('2d')!;
    const font = getComputedStyle(document.body).fontFamily || 'Roboto, Arial, sans-serif';
    c.fillStyle = '#fbfaf5'; c.fillRect(0, 0, 1400, 980);
    c.fillStyle = '#173d49'; c.fillRect(0, 0, 1400, 18); c.fillRect(0, 962, 1400, 18);
    c.strokeStyle = '#1b6457'; c.lineWidth = 4; c.strokeRect(44, 54, 1312, 872);
    c.strokeStyle = '#c08a1e'; c.lineWidth = 2; c.strokeRect(60, 70, 1280, 840);
    c.textAlign = 'center';
    const line = (text: string, y: number, size: number, color: string, weight = 400) => { c.fillStyle = color; c.font = `${weight} ${size}px ${font}`; c.fillText(text, 700, y, 1180); };
    line('IMPACT AID · PHILIPPINE DISASTER PREPAREDNESS', 170, 26, '#1b6457', 700);
    line('Certificate of Achievement', 290, 72, '#173d49', 700);
    c.fillStyle = '#c08a1e'; c.fillRect(600, 326, 200, 4);
    line('This certifies that', 420, 30, '#526976');
    line(this.user.username, 520, 66, '#1b6457', 700);
    line('completed all six disaster preparedness lessons', 640, 34, '#324d61');
    line('and passed the Earthquake, Tsunami, Typhoon, Flood, Landslide and Volcanic Eruption quizzes.', 690, 26, '#324d61');
    line([this.issuedDate && 'Issued ' + this.issuedDate, this.certificateId && 'Certificate ' + this.certificateId].filter(Boolean).join('   ·   '), 820, 24, '#526976');
    line('An app learning record. It does not certify professional emergency-response skills.', 870, 18, '#7a8b92');
    return canvas.toDataURL('image/png');
  }

  async handleDownloadCertificate() {
    if (!this.isFullyCompleted) return;
    const version = this.loadVersion;
    try {
      const data = this.certificateImage();
      if (Capacitor.isNativePlatform()) {
        const permissions = await Filesystem.checkPermissions();
        if (version !== this.loadVersion || !this.isFullyCompleted) return;
        if (permissions.publicStorage !== 'granted') {
          const granted = await Filesystem.requestPermissions();
          if (granted.publicStorage !== 'granted') throw new Error('Storage permission was denied');
        }
        if (version !== this.loadVersion || !this.isFullyCompleted) return;
        await Filesystem.writeFile({ directory: Directory.Documents, path: 'Impact Aid/Certificate.png', data: data.split(',')[1], recursive: true });
        if (version !== this.loadVersion || !this.isFullyCompleted) return;
        await this.showToast('Saved to Documents/Impact Aid/Certificate.png', 'success');
      } else {
        const blob = await (await fetch(data)).blob();
        if (version !== this.loadVersion || !this.isFullyCompleted) return;
        const url = URL.createObjectURL(blob); const a = document.createElement('a');
        a.download = 'Impact-Aid-Certificate.png'; a.href = url; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch { await this.showToast('Could not save the certificate. Try Share instead.', 'danger'); }
  }

  async handleShareCertificate() {
    if (!this.isFullyCompleted) return;
    const version = this.loadVersion;
    try {
      if (Capacitor.isNativePlatform()) {
        const file = await Filesystem.writeFile({ directory: Directory.Cache, path: 'Impact-Aid-Certificate.png', data: this.certificateImage().split(',')[1] });
        if (version !== this.loadVersion || !this.isFullyCompleted) return;
        await Share.share({ title: 'Impact Aid Certificate', files: [file.uri] });
      } else if (navigator.share) {
        await navigator.share({ title: 'Impact Aid Certificate', text: this.user.username + ' completed the Impact Aid preparedness course.' });
      } else await this.showToast('Download the certificate to share it.', 'primary');
    } catch { await this.showToast('Certificate was not shared.'); }
  }

  showToast(message: string, color: Tone = 'primary') { return showToast(this.toastController, message, color); }
}
