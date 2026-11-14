import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Page behavior only: no Angular renderer, Supabase client, browser, or real credentials.
const mocks = vi.hoisted(() => ({
  verifyOtp: vi.fn(), updateUser: vi.fn(), getSession: vi.fn(),
  resend: vi.fn(), resetPasswordForEmail: vi.fn(), signOut: vi.fn(),
  onAuthStateChange: vi.fn(), unsubscribe: vi.fn(), progressData: vi.fn(),
  checkPermissions: vi.fn(), requestPermissions: vi.fn(), writeFile: vi.fn(), share: vi.fn(),
  fetch: vi.fn(), listeners: new Set<(event: string) => void>(),
}));

vi.mock('@angular/core', () => ({
  Component: () => (component: unknown) => component,
  ChangeDetectionStrategy: { Eager: 0 },
}));
vi.mock('@angular/common', () => ({ CommonModule: class {} }));
vi.mock('@angular/forms', () => ({ FormsModule: class {} }));
vi.mock('@angular/router', () => ({ Router: class {}, RouterLink: class {} }));
vi.mock('@ionic/angular', () => ({
  IonButton: class {}, IonContent: class {}, IonIcon: class {}, IonInput: class {},
  AlertController: class {}, ToastController: class {},
}));
vi.mock('ionicons', () => ({ addIcons: vi.fn() }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@capacitor/filesystem', () => ({
  Directory: { Documents: 'DOCUMENTS', Cache: 'CACHE' },
  Filesystem: {
    checkPermissions: mocks.checkPermissions, requestPermissions: mocks.requestPermissions,
    writeFile: mocks.writeFile,
  },
}));
vi.mock('@capacitor/share', () => ({ Share: { share: mocks.share } }));
vi.mock('../src/app/services/backend', () => ({
  db: { auth: {
    verifyOtp: mocks.verifyOtp, updateUser: mocks.updateUser, getSession: mocks.getSession,
    resend: mocks.resend, resetPasswordForEmail: mocks.resetPasswordForEmail,
    signOut: mocks.signOut, onAuthStateChange: mocks.onAuthStateChange,
  } },
  progressData: mocks.progressData,
  topics: ['earthquake', 'tsunami', 'typhoon', 'flood', 'landslide', 'volcanic eruption'],
}));

import { LoginPage } from '../src/app/pages/login/login.page';
import { SettingsPage } from '../src/app/pages/settings/settings.page';
import { ProgressPage } from '../src/app/pages/progress/progress.page';

const syntheticSession = { user: { id: 'synthetic-user-a', email: 'synthetic@example.invalid' } };
const completedProgress = () => ({
  user: syntheticSession.user, username: 'Synthetic learner',
  lessons: [0, 1, 2, 3, 4, 5], scores: [60, 70, 80, 90, 100, 60],
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function controllers() {
  return {
    router: { navigateByUrl: vi.fn().mockResolvedValue(true) },
    toast: { create: vi.fn().mockResolvedValue({ present: vi.fn().mockResolvedValue(undefined) }) },
  };
}
function recoveryPage() {
  const { router } = controllers();
  const page = new LoginPage(router as never, {} as never);
  page.mode = 'recovery';
  page.email = syntheticSession.user.email;
  page.code = '12345678';
  page.newPassword = 'synthetic-test-password';
  return { page, router };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.listeners.clear();
  vi.stubGlobal('fetch', mocks.fetch.mockImplementation(() => { throw new Error('Unexpected network request'); }));
  mocks.onAuthStateChange.mockImplementation(callback => {
    mocks.listeners.add(callback);
    return { data: { subscription: { unsubscribe: () => {
      mocks.listeners.delete(callback);
      mocks.unsubscribe();
    } } } };
  });
  mocks.verifyOtp.mockResolvedValue({ data: { session: syntheticSession }, error: null });
  mocks.getSession.mockResolvedValue({ data: { session: syntheticSession }, error: null });
  mocks.updateUser.mockResolvedValue({ error: null });
  mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
  mocks.resend.mockResolvedValue({ error: null });
  mocks.progressData.mockImplementation(async () => completedProgress());
  mocks.checkPermissions.mockResolvedValue({ publicStorage: 'granted' });
  mocks.writeFile.mockResolvedValue({ uri: 'file:///synthetic-certificate.png' });
  mocks.share.mockResolvedValue(undefined);
});

afterEach(() => {
  expect(mocks.fetch).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('password recovery', () => {
  it('retries only the password update after OTP verification succeeds', async () => {
    const { page, router } = recoveryPage();
    mocks.updateUser.mockResolvedValueOnce({ error: new Error('Password update rejected') });
    await page.verify();
    expect(page.recoveryVerified).toBe(true);
    expect(page.code).toBe('');
    expect(page.notice).toContain('no new code is needed');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    page.newPassword = 'synthetic-corrected-password';
    await page.verify();
    expect(mocks.verifyOtp).toHaveBeenCalledTimes(1);
    expect(mocks.updateUser).toHaveBeenLastCalledWith({ password: 'synthetic-corrected-password' });
    expect(page.newPassword).toBe('');
    expect(page.recoveryVerified).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/home', { replaceUrl: true });
  });

  it('keeps verification available after a temporary session-read failure', async () => {
    const { page } = recoveryPage();
    mocks.getSession.mockResolvedValueOnce({ data: { session: null }, error: new Error('Offline') });
    await page.verify();
    expect(mocks.updateUser).not.toHaveBeenCalled();
    await page.verify();
    expect(mocks.verifyOtp).toHaveBeenCalledTimes(1);
    expect(mocks.updateUser).toHaveBeenCalledTimes(1);
  });

  it.each([null, { user: { id: 'synthetic-user-b' } }])('rejects a retry when the verified session is missing or replaced: %j', async session => {
    const { page, router } = recoveryPage();
    mocks.updateUser.mockResolvedValueOnce({ error: new Error('Offline') });
    await page.verify();
    mocks.getSession.mockResolvedValue({ data: { session }, error: null });
    await page.verify();
    expect(page.recoveryVerified).toBe(false);
    expect(page.notice).toContain('Request a new code');
    expect(mocks.updateUser).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('requires a new code if the email changes after a failed update', async () => {
    const { page } = recoveryPage();
    mocks.updateUser.mockResolvedValueOnce({ error: new Error('Offline') });
    await page.verify();
    page.email = 'other-synthetic@example.invalid';
    await page.verify();
    expect(page.recoveryVerified).toBe(false);
    expect(mocks.verifyOtp).toHaveBeenCalledTimes(1);
    expect(mocks.updateUser).toHaveBeenCalledTimes(1);
    expect(page.notice).toBe('Enter the code from your email.');
  });

  it('clears recovery state through the existing Back to sign in binding', async () => {
    const { page } = recoveryPage();
    mocks.updateUser.mockResolvedValueOnce({ error: new Error('Offline') });
    await page.verify();
    page.mode = 'login';
    expect(page.newPassword).toBe('');
    page.mode = 'recovery';
    expect(page.recoveryVerified).toBe(false);
  });

  it('starts a fresh verification when another recovery code is requested', async () => {
    const { page } = recoveryPage();
    mocks.updateUser.mockResolvedValueOnce({ error: new Error('Offline') });
    await page.verify();
    await page.sendCode('recovery');
    expect(page.recoveryVerified).toBe(false);
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(syntheticSession.user.email);
  });

  it('does not change a password if the email changes while verification is pending', async () => {
    const { page, router } = recoveryPage();
    const pending = deferred<unknown>();
    mocks.verifyOtp.mockReturnValue(pending.promise);
    const attempt = page.verify();
    page.email = 'other-synthetic@example.invalid';
    pending.resolve({ data: { session: syntheticSession }, error: null });
    await attempt;
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('does not retain verification after an invalid code', async () => {
    const { page } = recoveryPage();
    mocks.verifyOtp.mockResolvedValue({ data: { session: null }, error: new Error('Invalid code') });
    await page.verify();
    expect(page.recoveryVerified).toBe(false);
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(page.loading).toBe(false);
  });

  it('preserves signup confirmation without attempting a password change', async () => {
    const { page, router } = recoveryPage();
    page.mode = 'confirm';
    page.code = '12345678';
    await page.verify();
    expect(mocks.verifyOtp).toHaveBeenCalledWith({ email: syntheticSession.user.email, token: '12345678', type: 'signup' });
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/home', { replaceUrl: true });
  });
});

describe('local logout', () => {
  it('leaves immediately on SIGNED_OUT even while revocation is pending, and blocks duplicate requests', async () => {
    const { router, toast } = controllers();
    const page = new SettingsPage(toast as never, {} as never, router as never);
    page.showModal = 'logout';
    const pending = deferred<unknown>();
    mocks.signOut.mockReturnValue(pending.promise);
    const logout = page.handleLogout();
    mocks.listeners.forEach(callback => callback('SIGNED_OUT'));
    expect(page.showModal).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
    await page.handleLogout();
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
    pending.resolve({ error: new Error('Offline') });
    await logout;
    expect(toast.create).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Signed out on this device'), color: 'warning' }));
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1);
    expect(page.loggingOut).toBe(false);
  });

  it.each(['returned', 'thrown'])('redirects when a %s revocation error leaves no local session', async kind => {
    const { router, toast } = controllers();
    const page = new SettingsPage(toast as never, {} as never, router as never);
    if (kind === 'returned') mocks.signOut.mockResolvedValue({ error: new Error('Offline') });
    else mocks.signOut.mockRejectedValue(new Error('Offline'));
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await page.handleLogout();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
    expect(toast.create).toHaveBeenCalledWith(expect.objectContaining({ color: 'warning' }));
  });

  it('does not claim logout succeeded if the local session remains', async () => {
    const { router, toast } = controllers();
    const page = new SettingsPage(toast as never, {} as never, router as never);
    mocks.signOut.mockResolvedValue({ error: new Error('Storage failure') });
    await page.handleLogout();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(toast.create).toHaveBeenCalledWith(expect.objectContaining({ message: 'Logout failed. Try again.' }));
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('keeps the normal successful logout behavior', async () => {
    const { router, toast } = controllers();
    const page = new SettingsPage(toast as never, {} as never, router as never);
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await page.handleLogout();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
    expect(toast.create).toHaveBeenCalledWith(expect.objectContaining({ message: 'Logged out successfully', color: 'success' }));
  });
});

describe('progress and certificate freshness', () => {
  function progressPage() {
    const { router, toast } = controllers();
    return new ProgressPage(router as never, toast as never);
  }

  it('clears old identity and certificate eligibility during loading and after failure', async () => {
    const page = progressPage();
    await page.ionViewWillEnter();
    page.openCertificate();
    expect(page.showCertificate).toBe(true);
    const pending = deferred<ReturnType<typeof completedProgress>>();
    mocks.progressData.mockReturnValueOnce(pending.promise);
    const reload = page.ionViewWillEnter();
    expect(page.user).toEqual({ username: '', email: '' });
    expect(page.isFullyCompleted).toBe(false);
    page.openCertificate();
    await page.handleDownloadCertificate();
    await page.handleShareCertificate();
    expect(page.showCertificate).toBe(false);
    expect(mocks.writeFile).not.toHaveBeenCalled();
    expect(mocks.share).not.toHaveBeenCalled();
    pending.reject(new Error('Offline'));
    await reload;
    expect(page.loadError).toBe(true);
    expect(page.completedCount).toBe(0);
    expect(page.completedQuizzes).toBe(0);
    expect(page.progress.badges).toEqual([]);
    expect(page.isFullyCompleted).toBe(false);
    await page.ionViewWillEnter();
    expect(page.loadError).toBe(false);
    expect(page.isFullyCompleted).toBe(true);
  });

  it.each(['success', 'failure'])('ignores an older request completing with %s after a newer request', async outcome => {
    const page = progressPage();
    const old = deferred<ReturnType<typeof completedProgress>>();
    mocks.progressData.mockReturnValueOnce(old.promise);
    const oldLoad = page.ionViewWillEnter();
    const current = { ...completedProgress(), username: 'Current synthetic learner', scores: [0, 0, 0, 0, 0, 0] };
    mocks.progressData.mockResolvedValueOnce(current);
    await page.ionViewWillEnter();
    if (outcome === 'success') old.resolve(completedProgress());
    else old.reject(new Error('Old request failed'));
    await oldLoad;
    expect(page.user.username).toBe(current.username);
    expect(page.isFullyCompleted).toBe(false);
    expect(page.loadError).toBe(false);
  });

  it.each(['SIGNED_OUT', 'SIGNED_IN'])('invalidates a pending account load on %s', async event => {
    const page = progressPage();
    const pending = deferred<ReturnType<typeof completedProgress>>();
    mocks.progressData.mockReturnValueOnce(pending.promise);
    page.ngOnInit();
    mocks.listeners.forEach(callback => callback(event));
    pending.resolve(completedProgress());
    await Promise.resolve();
    expect(page.user.username).toBe('');
    expect(page.isFullyCompleted).toBe(false);
    page.ngOnDestroy();
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('discards a pending response after leaving the page', async () => {
    const page = progressPage();
    const pending = deferred<ReturnType<typeof completedProgress>>();
    mocks.progressData.mockReturnValueOnce(pending.promise);
    const load = page.ionViewWillEnter();
    page.ionViewWillLeave();
    pending.resolve(completedProgress());
    await load;
    expect(page.user.username).toBe('');
    expect(page.isFullyCompleted).toBe(false);
  });

  it('still downloads and shares a currently eligible certificate', async () => {
    const page = progressPage();
    await page.ionViewWillEnter();
    vi.spyOn(page as any, 'certificateImage').mockReturnValue('data:image/png;base64,c3ludGhldGlj');
    await page.handleDownloadCertificate();
    await page.handleShareCertificate();
    expect(mocks.writeFile).toHaveBeenCalledTimes(2);
    expect(mocks.share).toHaveBeenCalledWith({ title: 'Impact Aid Certificate', files: ['file:///synthetic-certificate.png'] });
  });

  it('does not save a certificate after its permission prompt outlives the page', async () => {
    const page = progressPage();
    await page.ionViewWillEnter();
    vi.spyOn(page as any, 'certificateImage').mockReturnValue('data:image/png;base64,c3ludGhldGlj');
    const pending = deferred<{ publicStorage: string }>();
    mocks.checkPermissions.mockReturnValueOnce(pending.promise);
    const save = page.handleDownloadCertificate();
    page.ionViewWillLeave();
    pending.resolve({ publicStorage: 'prompt' });
    await save;
    expect(mocks.requestPermissions).not.toHaveBeenCalled();
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it('does not open a share sheet after account state is invalidated during file creation', async () => {
    const page = progressPage();
    await page.ionViewWillEnter();
    vi.spyOn(page as any, 'certificateImage').mockReturnValue('data:image/png;base64,c3ludGhldGlj');
    const pending = deferred<{ uri: string }>();
    mocks.writeFile.mockReturnValueOnce(pending.promise);
    const share = page.handleShareCertificate();
    page.ionViewWillLeave();
    pending.resolve({ uri: 'file:///synthetic-certificate.png' });
    await share;
    expect(mocks.share).not.toHaveBeenCalled();
  });
});
