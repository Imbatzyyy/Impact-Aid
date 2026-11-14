import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { IonIcon, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-tabs',
  standalone: true,
  imports: [IonIcon, IonTabBar, IonTabButton, IonTabs, RouterModule, CommonModule],
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage { constructor(public router: Router) {} }
