import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { GoogleAuthService } from '../../services/google-auth.service';
@Component({selector:'app-auth-callback',standalone:true,imports:[IonContent],changeDetection:ChangeDetectionStrategy.Eager,
 template:'<ion-content><main style="padding:32px;color:#193e48"><h1>Finishing sign-in</h1><p role="status">Returning you to Impact Aid…</p></main></ion-content>'})
export class AuthCallbackPage implements OnInit{
 constructor(private google:GoogleAuthService){}
 ngOnInit(){const url=location.href;history.replaceState({},'',location.pathname);void this.google.complete(url);}
}
