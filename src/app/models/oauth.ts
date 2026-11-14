export const NATIVE_AUTH_CALLBACK='io.impactaid.app://auth/callback';
export const GOOGLE_PENDING_KEY='impact-aid.google-pending.v1';
export const OAUTH_MAX_AGE=10*60*1000;

export function authCallback(url:string,webOrigin:string){
  try{
    const u=new URL(url);
    const native=u.protocol==='io.impactaid.app:'&&u.hostname==='auth'&&u.pathname==='/callback'&&!u.port;
    const web=u.origin===webOrigin&&u.pathname==='/auth/callback';
    if((!native&&!web)||u.username||u.password)return null;
    if(u.searchParams.getAll('code').length>1)return null;
    const hash=new URLSearchParams(u.hash.slice(1));
    return {code:u.searchParams.get('code'),error:u.searchParams.get('error')??hash.get('error')};
  }catch{return null;}
}
