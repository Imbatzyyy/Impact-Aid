import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { db } from './backend';
import { environment } from '../../environments/environment';
import { authCallback, GOOGLE_PENDING_KEY, NATIVE_AUTH_CALLBACK, OAUTH_MAX_AGE } from '../models/oauth';

@Injectable({providedIn:'root'})
export class GoogleAuthService {
  busy=false;
  message='';
  private exchanging=false;
  private browserOpen=false;
  private run=0;
  private handled=new Set<string>();
  private initialized?:Promise<void>;
  private listenerReady=false;
  constructor(private router:Router,private zone:NgZone){}
  ready(){
    return this.initialized??=this.initialize();
  }
  private async initialize(){
    if(!Capacitor.isNativePlatform())return;
    try{
      await App.addListener('appUrlOpen',event=>{this.zone.run(()=>{void this.incoming(event.url);});});
      await Browser.addListener('browserFinished',()=>this.zone.run(()=>{
        if(this.browserOpen&&!this.exchanging){this.browserOpen=false;this.busy=false;this.message='Google sign-in was closed. You can try again.';}
      }));
      this.listenerReady=true;
      const launch=await App.getLaunchUrl();
      if(launch?.url)await this.incoming(launch.url);
    }catch{this.message='Google sign-in is unavailable right now. Please restart the app or use email.';}
  }
  private async incoming(url:string){
    if(url==='io.impactaid.app://auth/login'){await this.router.navigateByUrl('/login',{replaceUrl:true});return;}
    await this.complete(url);
  }
  async start(){
    if(this.busy)return;
    this.busy=true;this.message='';const run=++this.run;
    try{
      await this.ready();
      if(run!==this.run)return;
      if(Capacitor.isNativePlatform()&&!this.listenerReady)throw Error('listener');
      const redirectTo=Capacitor.isNativePlatform()?NATIVE_AUTH_CALLBACK:location.origin+'/auth/callback';
      localStorage.setItem(GOOGLE_PENDING_KEY,String(Date.now()));
      const {data,error}=await db.auth.signInWithOAuth({provider:'google',options:{redirectTo,skipBrowserRedirect:true,scopes:'openid email profile',queryParams:{prompt:'select_account'}}});
      if(run!==this.run)return;
      if(error||!data.url)throw error??Error('url');
      const target=new URL(data.url);
      if(target.origin!==environment.url||target.pathname!=='/auth/v1/authorize')throw Error('Unexpected destination');
      if(Capacitor.isNativePlatform()){
        this.browserOpen=true;
        await Browser.open({url:data.url,toolbarColor:'#193e48'});
        if(run!==this.run)return;
        this.message='Choose your Google account in the browser. Return here when you’re done.';
      }else{location.assign(data.url);}
    }catch{
      if(run!==this.run)return;
      localStorage.removeItem(GOOGLE_PENDING_KEY);this.browserOpen=false;this.busy=false;
      this.message='Google sign-in could not start. Check your connection and try again, or use email.';
    }
  }
  async cancel(){
    if(this.exchanging)return;
    this.run++;
    localStorage.removeItem(GOOGLE_PENDING_KEY);this.browserOpen=false;this.busy=false;
    this.message='Google sign-in cancelled. You can use email or try Google again.';
    if(Capacitor.isNativePlatform())await Browser.close().catch(()=>{});
  }
  async complete(url:string){
    const callback=authCallback(url,location.origin);
    if(!callback||this.exchanging)return false;
    if(this.handled.has(url))return true;
    const pending=Number(localStorage.getItem(GOOGLE_PENDING_KEY));
    if(!pending||Date.now()-pending>OAUTH_MAX_AGE||pending>Date.now()){
      const {data}=await db.auth.getSession();
      if(data.session){await this.router.navigateByUrl('/home',{replaceUrl:true});return true;}
      this.message='This sign-in has expired. Please choose Google again.';
      this.busy=false;
      await this.router.navigateByUrl('/login',{replaceUrl:true});return false;
    }
    this.exchanging=true;this.busy=true;this.browserOpen=false;
    try{
      if(Capacitor.isNativePlatform())await Browser.close().catch(()=>{});
      if(callback.error){this.message='Google sign-in was not completed. You can try again or use email.';return false;}
      if(!callback.code){this.message='Google did not return a sign-in code. Please try again.';return false;}
      // PKCE binds the returned code to the verifier retained on this installation.
      const {data,error}=await db.auth.exchangeCodeForSession(callback.code);
      if(error||!data.session){this.message='Could not finish Google sign-in. Check your connection and try Google again.';return false;}
      this.message='';this.handled.add(url);await this.router.navigateByUrl('/home',{replaceUrl:true});return true;
    }catch{
      this.message='Could not finish Google sign-in. Check your connection and try Google again.';return false;
    }finally{
      localStorage.removeItem(GOOGLE_PENDING_KEY);this.browserOpen=false;this.busy=false;this.exchanging=false;
      if(this.message)await this.router.navigateByUrl('/login',{replaceUrl:true});
    }
  }
}
