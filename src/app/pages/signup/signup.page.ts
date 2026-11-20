import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonInput, AlertController } from '@ionic/angular';
import { GoogleAuthService } from '../../services/google-auth.service';
import { db } from '../../services/backend';
import { authMessage, EMAIL_PATTERN } from '../../ui/auth-errors';

type Field = 'username' | 'email' | 'password' | 'confirmPassword';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-signup',
  standalone: true,
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  imports: [FormsModule, IonButton, IonContent, IonIcon, IonInput, RouterLink],
})
export class SignupPage {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  passwordVisible = false;
  loading = false;
  error = '';
  errors: Record<Field, string> = { username: '', email: '', password: '', confirmPassword: '' };

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    public google: GoogleAuthService,
  ) {}

  togglePassword() { this.passwordVisible = !this.passwordVisible; }
  clear(field: Field) { this.errors[field] = ''; this.error = ''; }

  /** 0–3: how much the password has going for it, shown as a small meter. */
  get strength() {
    const p = this.password;
    if (p.length < 6) return 0;
    // Length matters most; mixing letter case, numbers and symbols helps a little.
    const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter(kind => kind.test(p)).length;
    if (p.length >= 12 && kinds >= 2 || p.length >= 10 && kinds >= 3) return 3;
    if (p.length >= 8 && kinds >= 2) return 2;
    return 1;
  }
  get strengthLabel() { return ['', 'Weak', 'Good', 'Strong'][this.strength]; }

  private validate(): boolean {
    const email = this.email.trim();
    this.errors = {
      username: this.username.trim() ? '' : 'Tell us what to call you.',
      email: !email ? 'Enter your email address.' : EMAIL_PATTERN.test(email) ? '' : 'Enter a valid email address.',
      password: this.password.length >= 6 ? '' : 'Use at least 6 characters.',
      confirmPassword: !this.confirmPassword ? 'Enter your password again.' : this.confirmPassword === this.password ? '' : 'The passwords don’t match.',
    };
    return !Object.values(this.errors).some(Boolean);
  }

  async createAccount() {
    if (this.loading || this.google.busy) return;
    this.error = '';
    if (!this.validate()) return;
    this.loading = true;
    const email = this.email.trim();
    try {
      const { data, error } = await db.auth.signUp({ email, password: this.password, options: { data: { username: this.username.trim(), address: '' } } });
      if (error) throw error;
      this.password = this.confirmPassword = '';
      if (data.session) await this.router.navigateByUrl('/home', { replaceUrl: true });
      else await this.router.navigateByUrl('/login', { replaceUrl: true, state: { verificationEmail: email, notice: `We sent a confirmation code to ${email}. Check your inbox and spam folder.` } });
    } catch (error) {
      this.error = authMessage(error, 'Your account could not be created. Check your connection and try again.');
    } finally {
      this.loading = false;
    }
  }
}
