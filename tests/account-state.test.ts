import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Page behavior only: no Angular renderer, Supabase client, browser, or real credentials.
const mocks = vi.hoisted(() => ({
  verifyOtp: vi.fn(), updateUser: vi.fn(), getSession: vi.fn(),
  resend: vi.fn(), resetPasswordForEmail: vi.fn(), signOut: vi.fn(),
  onAuthStateChange: vi.fn(), unsubscribe: vi.fn(), progressData: vi.fn(),
  checkPermissions: vi.fn(), requestPermissions: vi.fn(), writeFile: vi.fn(), share: vi.fn(),
  fetch: vi.fn(), certificateIssuedOn: vi.fn(), listeners: new Set<(event: string, session?: unknown) => void>(),
}));

vi.mock('@angular/core', () => ({
  Component: () => (component: unknown) => component,
  ChangeDetectionStrategy: { Eager: 0 },
}));
vi.mock('@angular/common', () => ({ CommonModule: class {}, DatePipe: class {}, TitleCasePipe: class {} }));
vi.mock('@angular/forms', () => ({ FormsModule: class {} }));
vi.mock('@angular/router', () => ({ Router: class {}, RouterLink: class {} }));
vi.mock('@ionic/angular', () => ({
  IonButton: class {}, IonContent: class {}, IonIcon: class {}, IonInput: class {}, IonModal: class {},
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
  progressData: mocks.progressData, certificateIssuedOn: mocks.certificateIssuedOn,
  topics: ['earthquake', 'tsunami', 'typhoon', 'flood', 'landslide', 'volcanic eruption'],
}));

vi.mock('../src/app/services/google-auth.service',()=>({GoogleAuthService:class{busy=false}}));

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
  const page = new LoginPage(router as never, {} as never, {busy:false} as never);
  page.mode = 'recovery';
  page.email = syntheticSession.user.email;
  page.code = '12345678';

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
  mocks.certificateIssuedOn.mockResolvedValue('2026-11-01T02:00:00Z');
});

afterEach(() => {
  expect(mocks.fetch).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('email-link password recovery', () => {
  it('requests a hosted reset link using only the email', async () => {
    const {page}=recoveryPage();await page.sendResetLink();
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(syntheticSession.user.email,{redirectTo:'https://imbatzyyy.github.io/Impact-Aid/reset-password.html'});
    expect(mocks.updateUser).not.toHaveBeenCalled();expect(mocks.verifyOtp).not.toHaveBeenCalled();expect(page.notice).toContain('If an account uses this email');
  });
  it('requires a valid email and prevents duplicate reset requests', async () => {
    const {page}=recoveryPage();page.email='invalid';await page.sendResetLink();expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
    page.email=syntheticSession.user.email;const pending=deferred<unknown>();mocks.resetPasswordForEmail.mockReturnValue(pending.promise);const first=page.sendResetLink();await page.sendResetLink();expect(mocks.resetPasswordForEmail).toHaveBeenCalledTimes(1);pending.resolve({error:null});await first;
  });
  it('recovers from delivery failures without accepting a password in the app',async()=>{
    const {page}=recoveryPage();mocks.resetPasswordForEmail.mockResolvedValue({error:Error('rate limit')});await page.sendResetLink();expect(page.loading).toBe(false);expect(page.notice).toContain('could not be sent');await page.verify();expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });
  it('preserves signup confirmation without attempting a password change', async () => {
    const {page,router}=recoveryPage();page.mode='confirm';await page.verify();
    expect(mocks.verifyOtp).toHaveBeenCalledWith({email:syntheticSession.user.email,token:'12345678',type:'signup'});expect(mocks.updateUser).not.toHaveBeenCalled();expect(router.navigateByUrl).toHaveBeenCalledWith('/home',{replaceUrl:true});
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
    expect(toast.create).toHaveBeenCalledWith(expect.objectContaining({ message: 'Sign out failed. Try again.' }));
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('keeps the normal successful logout behavior', async () => {
    const { router, toast } = controllers();
    const page = new SettingsPage(toast as never, {} as never, router as never);
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await page.handleLogout();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
    expect(toast.create).toHaveBeenCalledWith(expect.objectContaining({ message: 'You’re signed out. See you soon.', color: 'success' }));
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

  it('invalidates a pending account load on SIGNED_OUT', async () => {
    const page = progressPage();
    page.ngOnInit();
    const pending = deferred<ReturnType<typeof completedProgress>>();
    mocks.progressData.mockReturnValueOnce(pending.promise);
    const load = page.ionViewWillEnter();
    mocks.listeners.forEach(callback => callback('SIGNED_OUT', null));
    pending.resolve(completedProgress());
    await load;
    expect(page.user.username).toBe('');
    expect(page.isFullyCompleted).toBe(false);
    page.ngOnDestroy();
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('reloads the record when a different account signs in', async () => {
    const page = progressPage();
    page.ngOnInit();
    await page.ionViewWillEnter();
    const other = { ...completedProgress(), user: { id: 'synthetic-user-b', email: 'other@example.invalid' }, username: 'Second learner', scores: [0, 0, 0, 0, 0, 0] };
    mocks.progressData.mockResolvedValueOnce(other);
    mocks.listeners.forEach(callback => callback('SIGNED_IN', { user: other.user }));
    expect(page.user.username).toBe('');
    await vi.waitFor(() => expect(page.user.username).toBe('Second learner'));
    expect(page.isFullyCompleted).toBe(false);
    page.ngOnDestroy();
  });

  it('keeps the record when the same account returns to the foreground', async () => {
    const page = progressPage();
    page.ngOnInit();
    await page.ionViewWillEnter();
    mocks.listeners.forEach(callback => callback('SIGNED_IN', syntheticSession));
    expect(page.user.username).toBe('Synthetic learner');
    expect(page.isFullyCompleted).toBe(true);
    expect(mocks.progressData).toHaveBeenCalledTimes(1);
    page.ngOnDestroy();
  });

  it('shows the date the course was first completed and a stable certificate ID', async () => {
    const page = progressPage();
    await page.ionViewWillEnter();
    await vi.waitFor(() => expect(page.issuedDate).toBe('November 1, 2026'));
    expect(mocks.certificateIssuedOn).toHaveBeenCalledWith('synthetic-user-a');
    expect(page.certificateId).toBe('');
    const withUuid = { ...completedProgress(), user: { id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', email: 'synthetic@example.invalid' } };
    mocks.progressData.mockResolvedValueOnce(withUuid);
    await page.ionViewWillEnter();
    expect(page.certificateId).toBe('IA-3FA8-5F64');
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
