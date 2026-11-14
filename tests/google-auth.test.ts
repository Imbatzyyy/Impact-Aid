import {it,expect,vi,beforeEach} from 'vitest';
const m=vi.hoisted(()=>({native:true,signIn:vi.fn(),exchange:vi.fn(),getSession:vi.fn(),open:vi.fn(),close:vi.fn(),app:vi.fn(),browser:vi.fn(),launch:vi.fn(),navigate:vi.fn(),assign:vi.fn()}));
vi.mock('@angular/core',()=>({Injectable:()=>()=>{},NgZone:class{}}));
vi.mock('@angular/router',()=>({Router:class{}}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>m.native}}));
vi.mock('@capacitor/app',()=>({App:{addListener:m.app,getLaunchUrl:m.launch}}));
vi.mock('@capacitor/browser',()=>({Browser:{addListener:m.browser,open:m.open,close:m.close}}));
vi.mock('../src/app/services/backend',()=>({db:{auth:{signInWithOAuth:m.signIn,exchangeCodeForSession:m.exchange,getSession:m.getSession}}}));
import {GoogleAuthService} from '../src/app/services/google-auth.service';
import {authCallback,GOOGLE_PENDING_KEY,NATIVE_AUTH_CALLBACK,OAUTH_MAX_AGE} from '../src/app/models/oauth';
import {environment} from '../src/environments/environment';
let store:Map<string,string>;
let service:GoogleAuthService;
beforeEach(()=>{
 vi.resetAllMocks();m.native=true;store=new Map();
 vi.stubGlobal('localStorage',{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v),removeItem:(k:string)=>store.delete(k)});
 vi.stubGlobal('location',{origin:'http://127.0.0.1:4200',assign:m.assign});
 m.signIn.mockResolvedValue({data:{url:environment.url+'/auth/v1/authorize?provider=google'},error:null});
 m.exchange.mockResolvedValue({data:{session:{user:{id:'qa'}}},error:null});
 m.getSession.mockResolvedValue({data:{session:null},error:null});m.close.mockResolvedValue(undefined);
 service=new GoogleAuthService({navigateByUrl:m.navigate} as never,{run:(f:()=>unknown)=>f()} as never);
});
it('requests only identity scopes, exact native callback and system browser',async()=>{
 await service.start();expect(m.signIn).toHaveBeenCalledWith({provider:'google',options:{redirectTo:NATIVE_AUTH_CALLBACK,skipBrowserRedirect:true,scopes:'openid email profile',queryParams:{prompt:'select_account'}}});
 expect(m.open).toHaveBeenCalledOnce();expect(store.has(GOOGLE_PENDING_KEY)).toBe(true);
 await service.start();expect(m.open).toHaveBeenCalledOnce();
});
it('validates the callback scheme, host, path and code count',()=>{
 for(const url of ['https://evil.test/auth/callback?code=x','io.impactaid.app://other/callback?code=x','io.impactaid.app://auth/not-callback?code=x','io.impactaid.app://user@auth/callback?code=x',NATIVE_AUTH_CALLBACK+'?code=x&code=y'])expect(authCallback(url,location.origin)).toBeNull();
 expect(authCallback(NATIVE_AUTH_CALLBACK+'?code=x',location.origin)?.code).toBe('x');
});
it('exchanges exactly once, ignores duplicate deliveries and preserves a successful session',async()=>{
 await service.start();const url=NATIVE_AUTH_CALLBACK+'?code=synthetic';
 await service.complete(url);await service.complete(url);
 expect(m.exchange).toHaveBeenCalledExactlyOnceWith('synthetic');expect(m.navigate).toHaveBeenCalledWith('/home',{replaceUrl:true});expect(service.message).toBe('');expect(service.busy).toBe(false);
 const finish=m.browser.mock.calls[0][1];finish();expect(service.message).toBe('');
});
it('handles a cold-start callback using the saved pending attempt',async()=>{
 store.set(GOOGLE_PENDING_KEY,String(Date.now()));m.launch.mockResolvedValue({url:NATIVE_AUTH_CALLBACK+'?code=cold'});
 await service.ready();expect(m.exchange).toHaveBeenCalledWith('cold');expect(m.navigate).toHaveBeenCalledWith('/home',{replaceUrl:true});
});
it('denied consent returns to login without exchanging or exposing provider text',async()=>{
 await service.start();await service.complete(NATIVE_AUTH_CALLBACK+'?error=access_denied&error_description=private');
 expect(m.exchange).not.toHaveBeenCalled();expect(service.message).toContain('not completed');expect(service.message).not.toContain('private');expect(m.navigate).toHaveBeenCalledWith('/login',{replaceUrl:true});
});
it('stale callbacks cannot authenticate a different account',async()=>{
 store.set(GOOGLE_PENDING_KEY,String(Date.now()-OAUTH_MAX_AGE-1));await service.complete(NATIVE_AUTH_CALLBACK+'?code=expired');
 expect(m.exchange).not.toHaveBeenCalled();expect(service.message).toContain('expired');
});
it('network failure does not leave a permanent spinner or lose email access',async()=>{
 await service.start();m.exchange.mockRejectedValue(new Error('network'));expect(await service.complete(NATIVE_AUTH_CALLBACK+'?code=network')).toBe(false);
 expect(service.busy).toBe(false);expect(service.message).toContain('try Google again');expect(store.has(GOOGLE_PENDING_KEY)).toBe(false);
});
it('browser dismissal unlocks retry and explicit cancellation rejects a late callback',async()=>{
 await service.start();m.browser.mock.calls[0][1]();expect(service.busy).toBe(false);
 await service.cancel();await service.complete(NATIVE_AUTH_CALLBACK+'?code=late');expect(m.exchange).not.toHaveBeenCalled();
});
it('uses same-origin callback for the web',async()=>{
 m.native=false;await service.start();expect(m.signIn.mock.calls[0][0].options.redirectTo).toBe(location.origin+'/auth/callback');expect(m.assign).toHaveBeenCalledOnce();expect(m.open).not.toHaveBeenCalled();
});
it('does not open unexpected authorization destinations',async()=>{
 m.signIn.mockResolvedValue({data:{url:'https://evil.test/authorize'},error:null});await service.start();expect(m.open).not.toHaveBeenCalled();expect(service.busy).toBe(false);
});

it('cancelling during the authorization request never opens a late browser',async()=>{
 let resolve!:(v:unknown)=>void;
 m.signIn.mockImplementation(()=>new Promise(r=>resolve=r));
 const start=service.start();
 await vi.waitFor(()=>expect(m.signIn).toHaveBeenCalledOnce());
 await service.cancel();
 resolve({data:{url:environment.url+'/auth/v1/authorize?provider=google'},error:null});
 await start;
 expect(m.open).not.toHaveBeenCalled();expect(service.busy).toBe(false);
});
