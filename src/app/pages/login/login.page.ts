import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonInput, AlertController } from '@ionic/angular';
import { GoogleAuthService } from '../../services/google-auth.service';
import { db } from '../../services/backend';
import { authMessage, EMAIL_PATTERN } from '../../ui/auth-errors';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [FormsModule, IonButton, IonContent, IonIcon, IonInput, RouterLink],
})
export class LoginPage {
  mode: 'login' | 'confirm' | 'recovery' = 'login';
  email = '';
  password = '';
  code = '';
  /** Calm status text (sent, checking). */
  notice = '';
  /** Something went wrong with the whole form. */
  error = '';
  emailError = '';
  passwordError = '';
  passwordVisible = false;
  loading = false;

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    public google: GoogleAuthService,
  ) {}

  ngOnInit() { this.ionViewWillEnter(); }
  ionViewWillEnter() {
    const state = history.state;
    if (state?.verificationEmail) { this.email = state.verificationEmail; this.mode = 'confirm'; }
    if (typeof state?.notice === 'string') this.notice = state.notice;
  }

  setMode(mode: 'login' | 'confirm' | 'recovery') {
    this.mode = mode; this.notice = ''; this.error = ''; this.emailError = ''; this.passwordError = '';
  }
  openRecovery() { this.setMode('recovery'); this.code = this.password = ''; }
  togglePassword() { this.passwordVisible = !this.passwordVisible; }

  private validEmail(): string | null {
    const email = this.email.trim();
    this.emailError = !email ? 'Enter your email address.' : EMAIL_PATTERN.test(email) ? '' : 'Enter a valid email address.';
    return this.emailError ? null : email;
  }

  async sendCode(mode: 'confirm' | 'recovery') {
    if (mode === 'recovery') { await this.sendResetLink(); return; }
    if (this.loading || this.google.busy) return;
    this.mode = 'confirm'; this.notice = ''; this.error = '';
    if (!this.email.trim()) { this.notice = 'Enter your email first.'; return; }
    this.code = ''; this.loading = true;
    try {
      const { error } = await db.auth.resend({ type: 'signup', email: this.email.trim() });
      if (error) throw error;
      this.notice = 'Check your inbox and spam folder for the confirmation code.';
    } catch (error) {
      this.notice = authMessage(error, 'Could not send the confirmation email. Please wait a moment and try again.');
    } finally { this.loading = false; }
  }

  async sendResetLink() {
    if (this.loading || this.google.busy) return;
    const email = this.email.trim();
    if (!EMAIL_PATTERN.test(email)) { this.notice = 'Enter a valid email address.'; return; }
    this.loading = true; this.notice = '';
    try {
      const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: 'https://imbatzyyy.github.io/Impact-Aid/reset-password.html' });
      if (error) throw error;
      this.notice = 'If an account uses this email, a password reset link is on its way. Open the email and choose Reset password. Check your spam folder too.';
    } catch { this.notice = 'The reset email could not be sent. Check your connection, wait a moment, and try again.'; }
    finally { this.loading = false; }
  }

  async verify() {
    if (this.loading || this.mode !== 'confirm') return;
    const email = this.email.trim().toLowerCase();
    if (!/^\d{6,10}$/.test(this.code.trim())) { this.notice = 'Enter the code from your email.'; return; }
    this.loading = true;
    try {
      const { data, error } = await db.auth.verifyOtp({ email, token: this.code.trim(), type: 'signup' });
      if (error) throw error;
      if (this.mode !== 'confirm' || this.email.trim().toLowerCase() !== email) return;
      if (!data.session) throw Error('Could not start your session. Request a new code.');
      this.password = this.code = this.notice = ''; this.mode = 'login';
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch { this.notice = 'The confirmation code is invalid or expired. Check it or request a new code.'; }
    finally { this.loading = false; }
  }

  async login() {
    if (this.loading || this.google.busy) return;
    this.error = '';
    const email = this.validEmail();
    this.passwordError = this.password ? '' : 'Enter your password.';
    if (!email || this.passwordError) return;
    this.loading = true;
    try {
      const { error } = await db.auth.signInWithPassword({ email, password: this.password });
      if (error?.code === 'email_not_confirmed') { this.mode = 'confirm'; this.notice = 'Verify your email before signing in. Request a code below.'; return; }
      if (error) throw error;
      this.password = '';
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error) {
      this.error = authMessage(error, 'We couldn’t sign you in. Check your connection and try again.');
    } finally { this.loading = false; }
  }
}
