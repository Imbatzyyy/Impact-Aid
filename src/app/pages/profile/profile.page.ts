import { ChangeDetectionStrategy } from '@angular/core';
import { db,account } from '../../services/backend';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ProfilePage {
  username='';address='';email='';message='';ready=false;
  ngOnInit(){void this.ionViewWillEnter();}
  async ionViewWillEnter(){
    this.ready=false;this.message='';this.username=this.address=this.email='';
    try{const u=await account();const {data,error}=await db.from('profiles').select('username,address').eq('id',u.id).single();if(error)throw error;
      this.email=u.email||'';this.username=data.username;this.address=data.address;this.ready=true;
    }catch{this.message='Could not load your profile. Please retry.';}
  }
  async save(){
    if(!this.ready || !this.username.trim())return;
    try{const u=await account();const {error}=await db.from('profiles').update({username:this.username.trim(),address:this.address.trim()}).eq('id',u.id);if(error)throw error;this.message='Profile saved.';}
    catch{this.message='Could not save your profile. Try again.';}
  }
}
