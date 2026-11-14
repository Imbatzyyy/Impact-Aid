import { Router, RouterLink } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { db } from '../../services/backend';
import { Component } from '@angular/core';
import {
  IonContent,
  IonIcon,
  AlertController,
  ToastController,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Contact {
  id: string;
  name: string;
  number: string;
  description?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-sos',
  templateUrl: './sos.page.html',
  styleUrls: ['./sos.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    CommonModule,
    FormsModule, RouterLink
  ],
})
export class SosPage {
  publicView = false;
  contactsLoading = false;
  contactsError = false;
  activeSegment: 'government' | 'local' = 'government';
  showAddModal = false;
  newContact = { name: '', number: '', description: '' };

  governmentContacts: Contact[]=[
    {id:'911',name:'National Emergency Hotline',number:'911',description:'Police, fire and medical emergencies'},
    {id:'ndrrmc',name:'NDRRMC',number:'(02) 8911-1406',description:'National disaster risk reduction and management'},
    {id:'redcross',name:'Philippine Red Cross',number:'143'},
    {id:'qc',name:'Quezon City Helpline',number:'122'},
    {id:'qcdrrmo',name:'Quezon City DRRMO',number:'(02) 8928-4396'}
  ];
  localContacts: Contact[]=[];
  saving=false;
  ngOnInit(){void this.ionViewWillEnter();}
  async ionViewWillEnter(){
    this.publicView = this.router.url.startsWith('/emergency');
    this.localContacts=[];
    if (this.publicView) return;
    this.contactsLoading=true; this.contactsError=false;
    const {data,error}=await db.from('local_contacts').select('id,name,number,description').order('name');
    this.contactsLoading=false;
    if(error) this.contactsError=true;
    else this.localContacts=data || [];
  }
  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  async handleCall(contact: Contact) {
    const alert = await this.alertController.create({
      header: 'Call ' + contact.name,
      message: `Do you want to call ${contact.number}?`,
      cssClass: 'custom-alert',
      buttons: [
        { text: 'Cancel', role: 'cancel', cssClass: 'alert-button-cancel' },
        {
          text: 'Open dialer',
          cssClass: 'alert-button-confirm',
          handler: () => {
            window.location.href='tel:'+contact.number.replace(/[^+0-9]/g,'');
            
          },
        },
      ],
    });

    await alert.present();
  }

  async handleSOSCall() {
    const alert = await this.alertController.create({
      header: 'Emergency SOS Call',
      message: 'Open the dialer with 911? You must press Call in your phone app.',
      cssClass: 'custom-alert-sos',
      buttons: [
        { text: 'Cancel', role: 'cancel', cssClass: 'alert-button-cancel' },
        {
          text: 'Open dialer',
          cssClass: 'alert-button-danger',
          handler: () => {
            window.location.href='tel:911';
            
          },
        },
      ],
    });

    await alert.present();
  }

  openAddModal() {
    this.showAddModal = true;
    this.newContact = { name: '', number: '', description: '' };
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  async handleAddContact(event: Event) {
    event.preventDefault();
    if (!this.newContact.name.trim() || !this.newContact.number.trim()) {
      this.showToast('Please fill in contact name and number', 'warning');
      return;
    }

    if(this.saving) return;
    if(!/^[+0-9() .-]{3,32}$/.test(this.newContact.number.trim())){await this.showToast('Enter a valid phone number.','warning');return;}
    this.saving=true;
    const {data,error}=await db.from('local_contacts').insert({name:this.newContact.name.trim(),number:this.newContact.number.trim(),description:this.newContact.description.trim()}).select('id,name,number,description').single();
    this.saving=false;
    if(error){await this.showToast('Could not save contact. Try again.','danger');return;}
    this.localContacts=[...this.localContacts,data];
    this.newContact = { name: '', number: '', description: '' };
    this.showAddModal = false;
    this.showToast('Contact added successfully!', 'success');
  }

  async handleDeleteContact(id: string) {
    const {error}=await db.from('local_contacts').delete().eq('id',id);
    if(error){await this.showToast('Could not remove contact. Try again.','danger');return;}

    this.localContacts = this.localContacts.filter((c) => c.id !== id);
    this.showToast('Contact deleted', 'success');
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
      cssClass: 'custom-toast',
    });
    toast.present();
  }
}
