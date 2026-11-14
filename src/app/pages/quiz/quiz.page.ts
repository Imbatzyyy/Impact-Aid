import { ChangeDetectionStrategy } from '@angular/core';
import { db, session, account, progressData, topics } from '../../services/backend';
import { Component, OnInit } from '@angular/core';
import { IonButton, IonContent, IonIcon, IonSpinner, ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Badge, getBadgeForScore } from 'src/app/models/badge.model';
import { ModalController } from '@ionic/angular';
import { BadgeAlertComponent } from 'src/app/components/badge-alert.component';

import { Quiz, QUIZ_DATA, prepareQuiz } from '../../models/quiz-data';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-quiz',
  standalone: true,
  imports: [IonButton, IonContent, IonIcon, IonSpinner, CommonModule, FormsModule],
  templateUrl: './quiz.page.html',
  styleUrls: ['./quiz.page.scss'],
})
export class QuizPage implements OnInit {
  quizData: Quiz[] = [];
  activeDisaster: string | null = null;
  currentQuiz: Quiz | null = null;
  currentQuestion = 0;
  selectedAnswers: number[] = [];
  showResults = false;
  isSubmitting = false;
  earnedBadge: Badge | null = null;

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private modalCtrl: ModalController,
    private router: Router
  ) {}

  ngOnInit() {
    this.quizData = QUIZ_DATA.map(quiz => ({
      ...quiz,
      questions: []
    }));
  }

  initializeQuiz(id: number) {
    const quizTemplate = QUIZ_DATA.find(q => q.id === id);
    if (quizTemplate && quizTemplate.allQuestions && quizTemplate.allQuestions.length > 0) {
      // Shuffle and select 10 random questions
      const selected = prepareQuiz(quizTemplate.allQuestions);
      
      this.currentQuiz = {
        ...quizTemplate,
        questions: selected
      };
      
      this.activeDisaster = this.currentQuiz.name.toLowerCase();
      this.currentQuestion = 0;
      this.selectedAnswers = new Array(10).fill(-1);
      this.showResults = false;
      this.earnedBadge = null;
    }
  }

  selectAnswer(index: number) {
    if (this.currentQuiz) this.selectedAnswers[this.currentQuestion] = index;
  }

  nextQuestion() {
    if (this.currentQuiz && this.currentQuestion < (this.currentQuiz.questions?.length || 0) - 1)
      this.currentQuestion++;
  }

  previousQuestion() {
    if (this.currentQuestion > 0) this.currentQuestion--;
  }

  calculateScore(): number {
    if (!this.currentQuiz || !this.currentQuiz.questions) return 0;
    const correct = this.selectedAnswers.filter(
      (a, i) => a === this.currentQuiz!.questions[i].correctAnswer
    ).length;
    return Math.round((correct / this.currentQuiz.questions.length) * 100);
  }

  getCorrectCount(): number {
    if (!this.currentQuiz || !this.currentQuiz.questions) return 0;
    return this.selectedAnswers.filter(
      (a, i) => a === this.currentQuiz!.questions[i].correctAnswer
    ).length;
  }

  isAnswerCorrect(i: number, j: number): boolean {
    return (
      this.currentQuiz !== null &&
      this.currentQuiz.questions &&
      this.selectedAnswers[i] === j &&
      this.currentQuiz.questions[i].correctAnswer === j
    );
  }

  isAnswerWrong(i: number, j: number): boolean {
    return (
      this.currentQuiz !== null &&
      this.currentQuiz.questions &&
      this.selectedAnswers[i] === j &&
      this.currentQuiz.questions[i].correctAnswer !== j
    );
  }

  getBadgeContainerClass(): string {
    const score = this.calculateScore();
    if (score >= 90) return 'bg-yellow-100';
    if (score >= 80) return 'bg-purple-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  }

  getBadgeIcon(): string {
    const score = this.calculateScore();
    if (score >= 90) return 'trophy-outline';
    if (score >= 80) return 'star-outline';
    if (score >= 60) return 'ribbon-outline';
    if (score >= 40) return 'thumbs-up-outline';
    return 'sad-outline';
  }

  getBadgeIconClass(): string {
    const score = this.calculateScore();
    if (score >= 90) return 'text-yellow-500';
    if (score >= 80) return 'text-purple-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  }

  getBadgeTitle(): string {
    const score = this.calculateScore();
    if (score === 100) return 'Perfect Score!';
    if (score >= 90) return 'Outstanding Work!';
    if (score >= 80) return 'Excellent Work!';
    if (score >= 60) return 'Great Job!';
    if (score >= 40) return 'Good Effort!';
    return 'Keep Practicing!';
  }

  getBadgeMessage(): string {
    const score = this.calculateScore();
    const name = this.currentQuiz?.name || 'disaster';
    if (score >= 90) return `You're a ${name} preparedness master!`;
    if (score >= 80) return `You have excellent ${name} knowledge!`;
    if (score >= 60) return `You understand ${name} safety well!`;
    if (score >= 40) return `You're learning about ${name} preparedness!`;
    return `Review the ${name} lesson to improve!`;
  }

  async submitQuiz() {
    if (this.isSubmitting || !this.currentQuiz || !this.currentQuiz.questions || this.selectedAnswers.includes(-1)) return;
    this.isSubmitting = true;

    const score = this.getCorrectCount();
    const percentage = this.calculateScore();
    const totalQuestions = this.currentQuiz.questions.length;

    try {
      const user=await account();
      const {error}=await db.from('quiz_results').upsert({user_id:user.id,topic:this.activeDisaster,correct:score,total:totalQuestions,last_taken:new Date().toISOString()},{onConflict:'user_id,topic'});
      if(error) throw error;
      const badge=getBadgeForScore(this.currentQuiz.name,percentage);
      this.earnedBadge=badge;
      if(badge) await this.showBadgeAlert(badge,percentage);
      this.showResults = true;
    } catch (err) {
      console.error('Error saving quiz:', err);
      await this.presentToast('Something went wrong while saving your progress.', 'danger');
    } finally {
      this.isSubmitting = false;
    }
  }

  async showBadgeAlert(badge: Badge, score: number) {
    const modal = await this.modalCtrl.create({
      component: BadgeAlertComponent,
      componentProps: {
        badgeEmoji: badge.emoji,
        badgeName: badge.name,
        badgeDescription: badge.description,
        score,
      },
      cssClass: 'badge-modal',
      backdropDismiss: false,
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data === 'progress') {
      this.router.navigate(['/progress']);
    }
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
    });
    toast.present();
  }

  retryQuiz() {
    if (this.currentQuiz) {
      this.initializeQuiz(this.currentQuiz.id);
    }
  }

  backToSelection() {
    this.activeDisaster = null;
    this.currentQuiz = null;
    this.showResults = false;
    this.earnedBadge = null;
  }

  get progress(): number {
    if (!this.currentQuiz || !this.currentQuiz.questions) return 0;
    const answered = this.selectedAnswers.filter(a => a !== -1).length;
    return (answered / this.currentQuiz.questions.length) * 100;
  }

  getGradient(bgClass: string | undefined): string {
    switch (bgClass) {
      case 'bg-linear-to-r from-orange-400 to-red-500':
        return 'linear-gradient(90deg, #fb923c 0%, #ef4444 100%)';
      case 'bg-linear-to-r from-sky-400 to-blue-500':
        return 'linear-gradient(90deg, #38bdf8 0%, #3b82f6 100%)';
      case 'bg-linear-to-r from-violet-500 to-indigo-500':
        return 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)';
      case 'bg-linear-to-r from-cyan-400 to-blue-500':
        return 'linear-gradient(90deg, #22d3ee 0%, #3b82f6 100%)';
      case 'bg-linear-to-r from-yellow-400 to-orange-500':
        return 'linear-gradient(90deg, #facc15 0%, #fb923c 100%)';
      case 'bg-linear-to-r from-red-500 to-pink-500':
        return 'linear-gradient(90deg, #ef4444 0%, #ec4899 100%)';
      default:
        return 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)';
    }
  }
}

