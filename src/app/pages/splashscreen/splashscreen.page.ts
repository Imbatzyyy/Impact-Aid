import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { GoogleAuthService } from '../../services/google-auth.service';
import { session } from '../../services/backend';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
@Component({selector:'app-splashscreen',standalone:true,imports:[IonContent,RouterLink],changeDetection:ChangeDetectionStrategy.Eager,
 templateUrl:'./splashscreen.page.html',styleUrls:['./splashscreen.page.scss']})
export class SplashscreenPage implements OnDestroy {
 leaving=false;private active=true;private timer?:ReturnType<typeof setTimeout>;
 constructor(private router:Router,private google:GoogleAuthService){}
 async ionViewDidEnter(){
  this.active=true;this.leaving=false;
  if(Capacitor.isNativePlatform())await SplashScreen.hide({fadeOutDuration:0}).catch(()=>{});
  // Start the five seconds when the animated screen is actually visible.
  this.timer=setTimeout(()=>{void this.finish();},4650);
 }
 private async finish(){
  if(!this.active)return;this.leaving=true;
  this.timer=setTimeout(()=>{void this.route();},350);
 }
 private async route(){
  await this.google.ready();if(!this.active)return;
  const signedIn=await session().catch(()=>null);if(!this.active)return;
  await this.router.navigateByUrl(signedIn?'/home':'/login',{replaceUrl:true});
 }
 ionViewWillLeave(){this.active=false;clearTimeout(this.timer);}
 ngOnDestroy(){this.ionViewWillLeave();}
}
