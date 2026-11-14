import { ChangeDetectionStrategy } from '@angular/core';
import { db } from '../../services/backend';
import { Component } from '@angular/core';
import { IonContent, IonIcon, ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

type ModalType = 'faqs' | 'about' | 'privacy' | 'logout' | null;

interface QA {
  question: string;
  answer: string;
}
interface FAQSection {
  title: string;
  items: QA[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-settings',
  standalone: true,
  imports: [IonContent, IonIcon, CommonModule],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  showModal: ModalType = null;
  loggingOut=false;

  mission = 'Help Filipino communities learn practical disaster preparedness through lessons, quizzes, and emergency contact information.';
  vision = 'A Philippines where people can prepare for disasters and make informed decisions with their families and communities.';
  faqSections = [{title:'Using Impact Aid',items:[
    {question:'What does Impact Aid do?',answer:'Read six disaster preparedness lessons, take quizzes, track your progress, save local contacts, and browse a Philippine emergency facility directory.'},
    {question:'How do I sign in after the update?',answer:'Use Google or your email and password. Email registrations need a confirmation code; Google verifies its own account. Use the same verified email to keep your existing learning record.'},
    {question:'Does the SOS button dispatch help?',answer:'It opens your phone dialer with 911. You must place the call yourself. The app does not dispatch responders or send your location.'},
    {question:'Can I use the app offline?',answer:'Lesson text, images, videos, quiz questions, and the government contact directory are included in the APK. Opening a semester quiz, saving progress or contacts, loading account data and viewing map imagery require internet. Unsubmitted answers stay on this installation; reconnect and tap Save result.'},
    {question:'How do I change my profile?',answer:'Tap your initial on Home, choose Edit profile, and update your name, username, optional age, mobile number, address or photo. Review and confirm Save changes. Your sign-in email is read-only.'},
    {question:'How do I earn a certificate?',answer:'Complete all six lessons and pass every quiz with at least 60%. Open Progress to download or share your completion certificate. This is an app learning record, not a professional qualification.'},
    {question:'Where can I request help with my account?',answer:'Contact the Impact Aid organization or project administrator who provided your app installation. Emergency assistance should be requested through the appropriate hotline.'}
  ]}];
  privacyPolicy = {title:'Privacy information',sections:[
    {heading:'Account and learning data',bullets:['The app stores your email, full name, username, optional age, mobile number, address and chosen profile photo, lesson completion, reading position, semester quiz assignments, submitted answers and scores, and contacts you choose to save. Supabase manages authentication; passwords are stored as hashes.','Your account data is limited to your signed-in account through database access policies. Chosen profile photos are stored in a private bucket, downloaded only with your signed-in account, and are not imported from Google.']},
    {heading:'Location and external services',bullets:['Location is requested only when you select Use my location. It is used on the device to center the map and calculate distances; it is not saved to your account.','Map tiles are requested from OpenStreetMap. Directions open Google Maps with the selected facility coordinates. These services receive normal connection information, such as your IP address.','Google sign-in shares your basic profile and verified email with Supabase to create or access your account. Impact Aid does not request Gmail, Drive or Google Contacts access. Supabase and Resend process email confirmation and password resets. Confirmation uses a code; Forgot password emails a private link to the Impact Aid website. Never share codes or reset links.']},
    {heading:'Address suggestions',bullets:['PSGC Cloud supplies public city and barangay names. Suggestions are matched on this device. The address provider receives the selected city code to retrieve its barangays, but not your name, house, street, age or saved profile. You can type an address manually.']},
    {heading:'Data on your device',bullets:['This device stores your sign-in session, unfinished quiz answers and a random installation ID for semester assignments. That ID is not a hardware identifier. Keep your device secured.','Downloaded certificates contain your display name. You choose where to save or share them.','No advertising or analytics SDK is included.']},
    {heading:'Updating or removing information',bullets:['Update your display name and optional address from your profile. Remove saved contacts from the Local Contacts tab.','For account access, export, or deletion requests, contact the Impact Aid project administrator who provided your installation.']}
  ]};
  termsOfUse = {title:'Using the app',bullets:[
    'Impact Aid provides educational information and a facility directory. Follow current instructions from local authorities during an emergency.',
    'The app does not provide live disaster alerts, confirm shelter availability, dispatch help, or replace emergency services.',
    'Use the app responsibly and protect your account and other people’s contact details.',
    'Network and phone service availability affect sign-in, data saving, maps, and calls. Keep an offline emergency plan.',
    'Learning certificates record completion within this app and do not certify professional emergency-response skills.'
  ]};

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router
  ) {}

  openModal(type: ModalType) {
    this.showModal = type;
  }
  closeModal() {
    this.showModal = null;
  }

  async handleLogout() {
    if(this.loggingOut)return;
    this.loggingOut=true;
    let locallySignedOut=false;
    let navigation:Promise<boolean>|undefined;
    const leaveAccount=()=>{
      if(locallySignedOut)return;
      locallySignedOut=true;
      this.closeModal();
      navigation=this.router.navigateByUrl('/login',{replaceUrl:true}).catch(()=>false);
    };
    // Local sign-out happens before the SDK's best-effort server revocation.
    // Do not wait for that network request to leave the account screen.
    const {data:{subscription}}=db.auth.onAuthStateChange(event=>{
      if(event==='SIGNED_OUT')leaveAccount();
    });
    try {
      let signOutError:unknown;
      try{const result=await db.auth.signOut({scope:'local'});signOutError=result.error;}
      catch(error){signOutError=error;}
      if(!locallySignedOut){
        const {data,error}=await db.auth.getSession();
        if(error || data.session)throw error || signOutError || new Error('Session is still active.');
        leaveAccount();
      }
      if(!await navigation)throw new Error('Could not open sign in.');
      await this.showToast(signOutError ? 'Signed out on this device. Server sign-out could not be confirmed.' : 'Logged out successfully',signOutError ? 'warning' : 'success');
    } catch {
      await this.showToast(locallySignedOut ? 'Signed out on this device. Please open the sign-in screen.' : 'Logout failed. Try again.', 'danger');
    } finally {
      subscription.unsubscribe();
      this.loggingOut=false;
    }
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'bottom',
      color,
      cssClass: 'custom-toast',
    });
    toast.present();
  }
}
