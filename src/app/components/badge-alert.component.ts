import { ChangeDetectionStrategy } from '@angular/core';
import { Component, Input } from '@angular/core';
import { ModalController} from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-badge-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge-alert.component.html',
  styleUrls: ['./badge-alert.component.scss'],
})
export class BadgeAlertComponent {
  @Input() badgeEmoji!: string;
  @Input() badgeName!: string;
  @Input() badgeDescription!: string;
  @Input() score!: number;
  @Input() color!: string; // optional — allows dynamic badge color (gold/silver/bronze)

  constructor(private modalCtrl: ModalController) {}

  /** ✅ Close modal without navigating */
  close() {
    this.modalCtrl.dismiss();
  }

  /** ✅ Navigate to progress tab */
  viewProgress() {
    this.modalCtrl.dismiss('progress');
  }
}
