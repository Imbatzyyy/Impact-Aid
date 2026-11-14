import { GoogleAuthService } from '../../services/google-auth.service';
import { ChangeDetectionStrategy } from '@angular/core';
import { db, session, account, progressData, topics } from '../../services/backend';
import { Component, OnInit } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-splashscreen',
  templateUrl: './splashscreen.page.html',
  styleUrls: ['./splashscreen.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule],
})
export class SplashscreenPage implements OnInit {

  constructor(private router: Router, private google:GoogleAuthService) {}

  async ngOnInit() {
    await this.google.ready();
    const signedIn = await session().catch(()=>null);
    await this.router.navigateByUrl(signedIn ? '/home' : '/login',{replaceUrl:true});
  }
}
