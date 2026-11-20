import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonModal, AlertController, ToastController } from '@ionic/angular';
import { db } from '../../services/backend';
import { haptic, showToast, Tone } from '../../ui/feedback';

interface Contact { id: string; name: string; number: string; description?: string; }
type ContactField = 'name' | 'number';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-sos',
  templateUrl: './sos.page.html',
  styleUrls: ['./sos.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonModal, FormsModule, RouterLink],
})
export class SosPage {
  publicView = false;
  contactsLoading = false;
  contactsError = false;
  activeSegment: 'government' | 'local' = 'government';
  showAddModal = false;
  saving = false;
  newContact = { name: '', number: '', description: '' };
  formErrors: Record<ContactField, string> = { name: '', number: '' };
  localContacts: Contact[] = [];
  private visit = 0;

  readonly governmentContacts: Contact[] = [
    { id: 'ndrrmc', name: 'NDRRMC', number: '(02) 8911-1406', description: 'National disaster risk reduction and management' },
    { id: 'redcross', name: 'Philippine Red Cross', number: '143' },
    { id: 'qc', name: 'Quezon City Helpline', number: '122' },
    { id: 'qcdrrmo', name: 'Quezon City DRRMO', number: '(02) 8928-4396' },
  ];

  constructor(private router: Router, private alertController: AlertController, private toastController: ToastController) {}

  // Ionic calls this on every visit, including the first.
  async ionViewWillEnter() {
    const visit = ++this.visit;
    this.publicView = this.router.url.startsWith('/emergency');
    if (this.publicView) { this.localContacts = []; return; }
    this.contactsLoading = true; this.contactsError = false;
    const { data, error } = await db.from('local_contacts').select('id,name,number,description').order('name');
    if (visit !== this.visit) return;
    this.contactsLoading = false;
    if (error) this.contactsError = true;
    else this.localContacts = data || [];
  }
  ionViewWillLeave() { this.visit++; this.contactsLoading = false; this.showAddModal = false; }

  selectSegment(segment: 'government' | 'local') {
    if (this.activeSegment !== segment) haptic('select');
    this.activeSegment = segment;
  }

  async handleCall(contact: Contact) {
    const alert = await this.alertController.create({
      header: 'Call ' + contact.name,
      message: `Open your phone dialer with ${contact.number}?`,
      cssClass: 'custom-alert',
      buttons: [
        { text: 'Cancel', role: 'cancel', cssClass: 'alert-button-cancel' },
        { text: 'Open dialer', cssClass: 'alert-button-confirm', handler: () => { window.location.href = 'tel:' + contact.number.replace(/[^+0-9]/g, ''); } },
      ],
    });
    await alert.present();
  }

  async handleSOSCall() {
    haptic('warning');
    const alert = await this.alertController.create({
      header: 'Call 911?',
      message: 'Your phone dialer opens with 911. Press Call in your phone app to connect.',
      cssClass: 'custom-alert alert-emergency',
      buttons: [
        { text: 'Cancel', role: 'cancel', cssClass: 'alert-button-cancel' },
        { text: 'Open dialer', cssClass: 'alert-button-danger', handler: () => { window.location.href = 'tel:911'; } },
      ],
    });
    await alert.present();
  }

  openAddModal() {
    this.newContact = { name: '', number: '', description: '' };
    this.formErrors = { name: '', number: '' };
    this.showAddModal = true;
  }
  closeAddModal() { this.showAddModal = false; }

  private validContact(): boolean {
    const number = this.newContact.number.trim();
    this.formErrors = {
      name: this.newContact.name.trim() ? '' : 'Add a name, like “Barangay Hall” or “Ate Liza”.',
      number: !number ? 'Add a phone number.' : /^[+0-9() .-]{3,32}$/.test(number) ? '' : 'Use digits, spaces, +, ( ) or - only.',
    };
    return !this.formErrors.name && !this.formErrors.number;
  }

  async handleAddContact(event?: Event) {
    event?.preventDefault();
    if (this.saving || !this.validContact()) return;
    this.saving = true;
    const { data, error } = await db.from('local_contacts')
      .insert({ name: this.newContact.name.trim(), number: this.newContact.number.trim(), description: this.newContact.description.trim() })
      .select('id,name,number,description').single();
    this.saving = false;
    if (error) { await this.toast('Could not save the contact. Check your connection and try again.', 'danger'); return; }
    this.localContacts = [...this.localContacts, data].sort((a, b) => a.name.localeCompare(b.name));
    this.showAddModal = false;
    haptic('success');
    await this.toast(`${data.name} is saved to My contacts.`, 'success');
  }

  async handleDeleteContact(contact: Contact) {
    const alert = await this.alertController.create({
      header: `Remove ${contact.name}?`,
      message: 'This removes the contact from My contacts on every device you use.',
      cssClass: 'custom-alert',
      buttons: [
        { text: 'Keep', role: 'cancel', cssClass: 'alert-button-cancel' },
        { text: 'Remove', role: 'confirm', cssClass: 'alert-button-danger' },
      ],
    });
    await alert.present();
    if ((await alert.onDidDismiss()).role !== 'confirm') return;
    const { error } = await db.from('local_contacts').delete().eq('id', contact.id);
    if (error) { await this.toast('Could not remove the contact. Try again.', 'danger'); return; }
    this.localContacts = this.localContacts.filter(c => c.id !== contact.id);
    await this.toast(`${contact.name} was removed.`, 'success');
  }

  trackContact(_: number, contact: Contact) { return contact.id; }
  /** Groups Philippine numbers for reading at a glance; anything else is shown as saved. */
  displayNumber(number: string) {
    const digits = number.replace(/\D/g, '');
    const mobile = digits.match(/^(?:63|0)(9\d{2})(\d{3})(\d{4})$/);
    if (mobile) return `${number.trim().startsWith('+') || digits.startsWith('63') ? '+63 ' : '0'}${mobile[1]} ${mobile[2]} ${mobile[3]}`;
    const metro = digits.match(/^02(\d{4})(\d{4})$/);
    if (metro) return `(02) ${metro[1]}-${metro[2]}`;
    return number;
  }
  private toast(message: string, tone: Tone) { return showToast(this.toastController, message, tone); }
}
