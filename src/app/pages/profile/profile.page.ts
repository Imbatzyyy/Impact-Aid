import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, AlertController } from '@ionic/angular';
import { ProfileService } from '../../services/profile.service';
import { PhilippineAddressService, Place, addressMatches } from '../../services/philippine-address.service';
import { ProfileDraft, draftOf, validateProfile } from '../../models/profile';
import { profilePhoto } from '../../models/profile-photo';

@Component({selector:'app-profile',standalone:true,changeDetection:ChangeDetectionStrategy.Eager,
 imports:[IonContent,IonIcon,CommonModule,FormsModule,RouterLink],templateUrl:'./profile.page.html',styleUrls:['./profile.page.scss']})
export class ProfilePage implements OnDestroy {
 ready=false;editing=false;saving=false;processing=false;confirming=false;message='';email='';
 draft!:ProfileDraft;private original='';private userId='';private visit=0;
 picture:Blob|null|undefined;preview='';cities:Place[]=[];barangays:Place[]=[];
 citySuggestions:Place[]=[];barangaySuggestions:Place[]=[];addressMessage='';addressLoading=false;
 private cityRequest=0;private photoRequest=0;
 constructor(public profiles:ProfileService,private addresses:PhilippineAddressService,private alerts:AlertController){}
 get profile(){return this.profiles.current();}
 get initials(){return (this.profile?.full_name||this.profile?.username||'You').trim().split(/\s+/).slice(0,2).map(v=>v[0]).join('').toUpperCase();}
 get photo(){return this.picture===null?'':this.preview||this.profiles.photo();}
 get dirty(){return this.editing&&(this.original!==JSON.stringify(this.draft)||this.picture!==undefined);}
 async ionViewWillEnter(){
  const visit=++this.visit;this.ready=false;this.message='';this.editing=false;this.clearPicture();
  try{const data=await this.profiles.load();if(visit!==this.visit)return;
   this.email=data.email;this.userId=data.profile.id;this.resetDraft();this.ready=true;
  }catch{if(visit===this.visit)this.message='Your profile could not load. Check your connection and try again.';}
 }
 private resetDraft(){if(this.profile){this.draft=draftOf(this.profile);this.original=JSON.stringify(this.draft);}}
 async edit(){
  this.resetDraft();this.editing=true;this.message='';this.addressMessage='';
  this.addressLoading=true;
  try{this.cities=await this.addresses.cities();if(!this.draft.city_code)this.citySuggestions=addressMatches(this.cities,this.draft.city_name);}catch{this.addressMessage='City suggestions are unavailable. You can still type your address.';}finally{this.addressLoading=false;}
  if(this.draft.city_code)void this.loadBarangays(this.draft.city_code);
 }
 cityTyped(value:string){
  this.draft.city_name=value;this.draft.city_code='';this.draft.province_name='';this.draft.region_name='';
  this.draft.barangay_name='';this.draft.barangay_code='';this.barangays=[];this.barangaySuggestions=[];this.cityRequest++;
  this.citySuggestions=addressMatches(this.cities,value);this.addressMessage='';
 }
 selectCity(place:Place){
  this.draft.city_name=place.name;this.draft.city_code=place.code;this.draft.province_name=place.province??'';this.draft.region_name=place.region??'';
  this.draft.barangay_code='';this.draft.barangay_name='';this.draft.postal_code='';this.citySuggestions=[];void this.loadBarangays(place.code);
 }
 private async loadBarangays(code:string){
  const request=++this.cityRequest;this.barangays=[];this.addressMessage='Loading barangay suggestions…';
  try{const rows=await this.addresses.barangays(code);if(request!==this.cityRequest)return;this.barangays=rows;this.addressMessage='';this.barangaySuggestions=addressMatches(rows,this.draft.barangay_name);}
  catch{if(request===this.cityRequest)this.addressMessage='Barangay suggestions are unavailable. You can type your barangay yourself.';}
 }
 barangayTyped(value:string){this.draft.barangay_name=value;this.draft.barangay_code='';this.barangaySuggestions=addressMatches(this.barangays,value);}
 selectBarangay(place:Place){this.draft.barangay_name=place.name;this.draft.barangay_code=place.code;this.barangaySuggestions=[];}
 async choosePhoto(event:Event){
  const input=event.target as HTMLInputElement,file=input.files?.[0];input.value='';if(!file)return;
  const request=++this.photoRequest;this.processing=true;this.message='';
  try{const blob=await profilePhoto(file);if(request!==this.photoRequest||!this.editing)return;
   this.clearPreview();this.picture=blob;this.preview=URL.createObjectURL(blob);
  }catch(error){if(request===this.photoRequest)this.message=error instanceof Error?error.message:'This photo could not be read.';}
  finally{if(request===this.photoRequest)this.processing=false;}
 }
 removePhoto(){this.photoRequest++;this.processing=false;this.clearPreview();this.picture=null;}
 private clearPreview(){if(this.preview)URL.revokeObjectURL(this.preview);this.preview='';}
 private clearPicture(){this.photoRequest++;this.processing=false;this.picture=undefined;this.clearPreview();}
 private async confirm(header:string,message:string,button:string){
  if(this.confirming)return false;this.confirming=true;
  try{const alert=await this.alerts.create({header,message,cssClass:'custom-alert',backdropDismiss:false,buttons:[{text:'Cancel',role:'cancel',cssClass:'alert-button-cancel'},{text:button,role:'confirm',cssClass:'alert-button-confirm'}]});await alert.present();return (await alert.onDidDismiss()).role==='confirm';}
  finally{this.confirming=false;}
 }
 async save(){
  if(!this.ready||!this.editing||this.saving||this.processing||this.confirming)return;
  this.message=validateProfile(this.draft);if(this.message)return;
  if(!await this.confirm('Save profile changes?','Your details and chosen photo will be saved to this account.','Save changes'))return;
  this.saving=true;this.message='';
  try{await this.profiles.save(this.userId,this.draft,this.picture);this.editing=false;this.clearPicture();this.resetDraft();this.message='Your profile has been saved.';}
  catch{this.message='Your changes could not be saved. Check your connection and try again. Your draft is still here.';}
  finally{this.saving=false;}
 }
 async cancel(){if(this.saving||this.processing)return;if(this.dirty&&!await this.confirm('Discard your changes?','Your saved profile will stay as it is.','Discard changes'))return;this.editing=false;this.clearPicture();this.resetDraft();this.message='';this.citySuggestions=[];this.barangaySuggestions=[];}
 async canLeave(){if(this.saving||this.processing||this.confirming)return false;if(!this.dirty)return true;const yes=await this.confirm('Leave without saving?','The changes you made here have not been saved.','Leave page');if(yes){this.editing=false;this.clearPicture();}return yes;}
 ionViewWillLeave(){this.visit++;this.cityRequest++;this.citySuggestions=[];this.barangaySuggestions=[];}
 ngOnDestroy(){this.ionViewWillLeave();this.clearPicture();}
}
