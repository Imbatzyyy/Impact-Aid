import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { IonContent, IonSpinner } from '@ionic/angular';
import { GoogleAuthService } from '../../services/google-auth.service';
@Component({selector:'app-auth-callback',standalone:true,imports:[IonContent,IonSpinner],changeDetection:ChangeDetectionStrategy.Eager,
 template:`<ion-content><main class="callback" role="status"><img src="assets/impact-shield.png" alt=""><ion-spinner name="crescent"></ion-spinner><h1>Finishing sign-in</h1><p>Returning you to Impact Aid…</p></main></ion-content>`,
 styles:[`ion-content{--background:var(--ia-bg)}.callback{min-height:100%;display:grid;place-content:center;justify-items:center;gap:10px;padding:32px;text-align:center;color:var(--ia-ink);animation:ia-rise var(--ia-dur-3) var(--ia-ease) both}img{width:56px;height:62px;object-fit:contain}ion-spinner{color:var(--ia-teal);margin:8px 0}h1{font-size:22px;font-weight:700;margin:0}p{margin:0;color:var(--ia-ink-soft);font-size:14px}`]})
export class AuthCallbackPage implements OnInit{
 constructor(private google:GoogleAuthService){}
 ngOnInit(){const url=location.href;history.replaceState({},'',location.pathname);void this.google.complete(url);}
}
