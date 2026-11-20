import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { IonIcon, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { haptic } from '../ui/feedback';

const TABS = [
  { id: 'home', label: 'Home', icon: 'home', routes: ['/home'] },
  { id: 'lessons', label: 'Learn', icon: 'book', routes: ['/lessons', '/quiz'] },
  { id: 'sos', label: 'Help', icon: 'call', routes: ['/sos'] },
  { id: 'map', label: 'Places', icon: 'map', routes: ['/map'] },
  { id: 'progress', label: 'Progress', icon: 'trending-up', routes: ['/progress'] },
] as const;

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-tabs',
  standalone: true,
  imports: [IonIcon, IonTabBar, IonTabButton, IonTabs, RouterModule],
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage implements OnDestroy {
  readonly tabs = TABS;
  /** Index of the highlighted tab; -1 on pages outside the bar (Profile, Settings). */
  active = -1;
  /** Where the sliding highlight rests; it stays put while a non-tab page is open. */
  indicator = 0;
  private ready = false;
  private readonly routes: Subscription;
  constructor(public router: Router) {
    this.sync(router.url);
    this.routes = router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.sync(e.urlAfterRedirects));
  }
  private sync(url: string) {
    const path = url.split(/[?#]/)[0];
    this.active = this.tabs.findIndex(tab => (tab.routes as readonly string[]).some(route => path === route || path.startsWith(route + '/')));
    if (this.active >= 0) this.indicator = this.active;
  }
  tabChanged() {
    if (this.ready) haptic('select');
    this.ready = true;
  }
  ngOnDestroy() { this.routes.unsubscribe(); }
}
