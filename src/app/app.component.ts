import { Capacitor } from '@capacitor/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
  standalone: true,
})
export class AppComponent {
  constructor(private platform: Platform) {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();
    if(!Capacitor.isNativePlatform())return;
    try {
      // ✅ Fix "compressed" layout and use full height
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Light }); // or Style.Dark if background is light
      await SplashScreen.hide();
    } catch (err) {
      console.warn('StatusBar plugin not available:', err);
    }
  }
}
