import { ChangeDetectionStrategy } from '@angular/core';
import { db } from '../../services/backend';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonIcon, IonInput, AlertController } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [CommonModule, FormsModule, IonButton, IonContent, IonIcon, IonInput, RouterLink],
})
export class LoginPage {
  private currentMode: 'login'|'confirm'|'recovery'='login';
  private recoveryEmail='';
  private recoveryUserId='';
  code='';newPassword='';notice='';
  get mode(){return this.currentMode;}
  set mode(value:'login'|'confirm'|'recovery'){
    if(value!==this.currentMode){this.clearRecovery();this.code=this.newPassword='';}
    this.currentMode=value;
  }
  get recoveryVerified(){
    return this.mode==='recovery' && !!this.recoveryUserId && this.recoveryEmail===this.email.trim().toLowerCase();
  }
  private clearRecovery(){this.recoveryEmail=this.recoveryUserId='';}
  async sendCode(mode:'confirm'|'recovery'){
    if(this.loading)return;
    this.mode=mode;this.notice='';
    if(!this.email.trim()){this.notice='Enter your email first.';return;}
    this.clearRecovery();this.code='';
    this.loading=true;
    try{
      const {error}=mode==='confirm'?await db.auth.resend({type:'signup',email:this.email.trim()}):await db.auth.resetPasswordForEmail(this.email.trim());
      if(error)throw error;
      this.notice='Check your inbox and spam folder for the code.';
    }catch(e){this.notice=e instanceof Error?e.message:'Could not send email.';}finally{this.loading=false;}
  }
  async verify(){
    if(this.loading||this.mode==='login')return;
    const mode=this.mode,email=this.email.trim().toLowerCase();
    if(!this.recoveryVerified){
      this.clearRecovery();
      if(!/^\d{6,10}$/.test(this.code.trim())){this.notice='Enter the code from your email.';return;}
    }
    if(this.mode==='recovery' && this.newPassword.length<6){this.notice='Enter a new password of at least 6 characters.';return;}
    const password=this.newPassword;
    this.loading=true;
    try{
      if(!this.recoveryVerified){
        const {data,error}=await db.auth.verifyOtp({email,token:this.code.trim(),type:mode==='confirm'?'signup':'recovery'});
        if(error)throw error;
        if(this.mode!==mode || this.email.trim().toLowerCase()!==email)return;
        if(!data.session)throw new Error('Could not start your session. Request a new code.');
        this.code='';
        if(mode==='recovery'){this.recoveryEmail=email;this.recoveryUserId=data.session.user.id;}
      }
      if(mode==='recovery'){
        const {data,error}=await db.auth.getSession();
        if(error)throw error;
        if(this.mode!==mode || this.email.trim().toLowerCase()!==email)return;
        if(!data.session || data.session.user.id!==this.recoveryUserId){
          this.clearRecovery();
          throw new Error('Your recovery session ended. Request a new code.');
        }
        const result=await db.auth.updateUser({password});if(result.error)throw result.error;
      }
      if(this.mode!==mode || this.email.trim().toLowerCase()!==email)return;
      this.newPassword=this.password=this.code='';this.mode='login';this.notice='';await this.router.navigateByUrl('/home',{replaceUrl:true});
    }catch(e){
      const message=e instanceof Error?e.message:'Could not complete verification.';
      this.notice=this.recoveryVerified ? 'Email verified. '+message+' Try saving your new password again; no new code is needed.' : message;
    }finally{this.loading=false;}
  }
  ngOnInit(){this.ionViewWillEnter();}
  ionViewWillEnter(){const state=history.state;if(state?.verificationEmail){this.email=state.verificationEmail;this.mode='confirm';}}

  email = '';
  password = '';
  passwordVisible = false; // 👁 renamed for clarity and matches HTML
  loading = false; // 🔄 for loading overlay

  constructor(
    private router: Router,
    private alertCtrl: AlertController
  ) {}

  togglePassword() {
    this.passwordVisible = !this.passwordVisible;
  }

  async login() {
    if(this.loading)return;
    if (!this.email || !this.password) {
      const alert = await this.alertCtrl.create({
        header: 'Missing Fields',
        message: 'Please enter both email and password.',
        buttons: ['OK'],
        cssClass: 'custom-alert',
      });
      await alert.present();
      return;
    }

    this.loading = true; // 🔄 Show loading

    try {
      const {error}=await db.auth.signInWithPassword({email:this.email.trim(),password:this.password});
      if(error?.code==='email_not_confirmed'){this.mode='confirm';this.notice='Verify your email before signing in. Request a code below.';return;}
      if(error) throw error;
      this.password='';
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (err: any) {
      const message = err.message || 'Cannot sign in. Check your connection and try again.';
      const alert = await this.alertCtrl.create({
        header: 'Login Failed',
        message,
        buttons: ['OK'],
        cssClass: 'custom-alert',
      });
      await alert.present();
    } finally {
      this.loading = false; // ✅ Always hide overlay
    }
  }

  goToRegister() {
    this.router.navigateByUrl('/signup');
  }
}
