import { Capacitor } from '@capacitor/core';
import type { ToastController } from '@ionic/angular';

export type Tone = 'primary' | 'success' | 'warning' | 'danger';
type Haptic = 'tap' | 'select' | 'success' | 'warning';

/** Gentle vibration on Android. Loaded lazily so web and tests never touch the plugin. */
export function haptic(kind: Haptic = 'tap'): void {
  if (!Capacitor.isNativePlatform()) return;
  void import('@capacitor/haptics').then(({ Haptics, ImpactStyle, NotificationType }) => {
    if (kind === 'success') return Haptics.notification({ type: NotificationType.Success });
    if (kind === 'warning') return Haptics.notification({ type: NotificationType.Warning });
    if (kind === 'select') return Haptics.selectionChanged();
    return Haptics.impact({ style: ImpactStyle.Light });
  }).catch(() => { /* Vibration is a nicety; ignore devices without it. */ });
}

const ICONS: Record<Tone, string> = {
  primary: 'information-circle', success: 'checkmark-circle', warning: 'alert-circle', danger: 'alert-circle',
};

/** One toast style for the whole app, lifted above the floating tab bar when it is showing. */
export async function showToast(controller: ToastController, message: string, color: Tone = 'primary', duration = 2400) {
  const bar = typeof document === 'undefined' ? null : document.getElementById('app-tab-bar');
  const anchored = !!bar && bar.offsetParent !== null && getComputedStyle(bar).visibility !== 'hidden';
  const toast = await controller.create({
    message, duration, color, position: 'bottom', icon: ICONS[color], cssClass: 'ia-toast',
    ...(anchored ? { positionAnchor: 'app-tab-bar' } : {}),
  });
  await toast.present();
  return toast;
}
