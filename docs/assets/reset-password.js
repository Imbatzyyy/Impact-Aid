import{RecoveryFlow,recoveryToken,passwordIssue}from'./recovery-client.js';
let token=recoveryToken(location.hash);history.replaceState(null,'',location.pathname);
const flow=new RecoveryFlow(),form=document.querySelector('form'),notice=document.querySelector('#notice'),password=document.querySelector('#password'),confirmation=document.querySelector('#confirmation'),button=document.querySelector('#save'),fields=document.querySelector('fieldset');
const message=text=>{notice.textContent=text;notice.hidden=false;};
if(!token){fields.disabled=true;message('Open the Reset password link from your email. If your link has expired, request another one in the app.');}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(button.disabled)return;
 const issue=passwordIssue(password.value,confirmation.value);if(issue){message(issue);return;}
 fields.disabled=true;button.textContent='Saving your password…';notice.hidden=true;
 try{await flow.reset(token,password.value);token=null;password.value=confirmation.value='';form.hidden=true;document.querySelector('#success').hidden=false;document.querySelector('#title').textContent='You’re all set.';document.querySelector('#intro').textContent='Your password has been updated. Return to Impact Aid and sign in with your new password.';}
 catch(error){message(error.name==='TimeoutError'||error.name==='TypeError'?'Connection interrupted. Check your internet and try again.':error.message);}
 finally{fields.disabled=false;button.textContent='Save new password';}
});
document.querySelector('#show').addEventListener('change',event=>{password.type=confirmation.type=event.target.checked?'text':'password';});
window.addEventListener('pagehide',()=>{token=null;flow.clear();password.value=confirmation.value='';});
