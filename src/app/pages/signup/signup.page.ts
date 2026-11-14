import { GoogleAuthService } from '../../services/google-auth.service';
import { ChangeDetectionStrategy } from '@angular/core';
import { db, session, account, progressData, topics } from '../../services/backend';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonIcon, IonInput, AlertController } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-signup',
  standalone: true,
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  imports: [CommonModule, FormsModule, IonButton, IonContent, IonIcon, IonInput, RouterLink],
})
export class SignupPage {
  username = '';
  password = '';
  confirmPassword = '';
  email = '';
  address = '';
  passwordVisible = false; // ✅ renamed for clarity
  loading = false; // ✅ for the loading overlay

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    public google:GoogleAuthService
  ) {}

  togglePassword() {
    this.passwordVisible = !this.passwordVisible; // ✅ consistent with HTML
  }

  async createAccount() {
    if(this.loading||this.google.busy)return;
    // ✅ Basic validation
    if (!this.email || !this.password || !this.confirmPassword || !this.username) {
      const alert = await this.alertCtrl.create({
        header: 'Missing Fields',
        message: 'Please fill in all required fields before proceeding.',
        buttons: ['OK'],
        cssClass: 'custom-alert',
      });
      await alert.present();
      return;
    }

    if (this.password !== this.confirmPassword) {
      const alert = await this.alertCtrl.create({
        header: 'Password Mismatch',
        message: 'Passwords do not match. Please try again.',
        buttons: ['OK'],
        cssClass: 'custom-alert',
      });
      await alert.present();
      return;
    }

    // 🔄 Show loading overlay
    this.loading = true;

    try {
      if(!this.username.trim() || this.password.length < 6) throw new Error('Enter a name and a password of at least 6 characters.');
      const {data,error}=await db.auth.signUp({email:this.email.trim(),password:this.password,options:{data:{username:this.username.trim(),address:this.address.trim()}}});
      if(error) throw error;
      this.password=this.confirmPassword='';
      // ✅ Show success alert
      const success = await this.alertCtrl.create({
        header: 'Success',
        message: data.session ? 'Your account is ready.' : 'Check your inbox for a confirmation email before signing in.',
        buttons: ['OK'],
        cssClass: 'custom-alert',
      });
      await success.present();

      // ✅ Navigate to home
      await this.router.navigateByUrl(data.session ? '/home' : '/login', { replaceUrl: true,state:{verificationEmail:this.email.trim()} });
    } catch (err: any) {
      const alert = await this.alertCtrl.create({
        header: 'Signup Failed',
        message: err.message,
        buttons: ['OK'],
        cssClass: 'custom-alert',
      });
      await alert.present();
    } finally {
      this.loading = false; // ✅ Hide overlay
    }
  }

  goBack() {
    this.router.navigate(['/login']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
