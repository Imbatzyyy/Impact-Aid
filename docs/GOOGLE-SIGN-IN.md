# Google sign-in

The sign-in page offers **Sign in with Google**; the registration page offers **Sign up with Google**. Both use Supabase Google OAuth: a first visit creates an account/profile; later visits sign in to the same account.

## Provider configuration

- Google Cloud project: `impact-aid-signin-2026` (separate from the retired Firebase backend).
- OAuth client type: Web application. Supabase is the confidential OAuth client; Android uses the browser redirect flow.
- Google's only authorized redirect: `https://xuutncpfupkosbqjgmei.supabase.co/auth/v1/callback`.
- Identity scopes only: `openid`, email and profile.
- Native app callback: `io.impactaid.app://auth/callback`.
- Local web callbacks: `http://127.0.0.1:4200/auth/callback`, `http://localhost:4200/auth/callback`.
- Provider client secret is stored in Supabase configuration. It must never be placed in the APK, environment files, Git or saved dashboard queries.

The Google project is published for external users. Google's consent UI may display the Supabase project hostname rather than the app name until brand verification is approved; this does not grant access to Gmail, Drive or Contacts. [Public privacy information](https://imbatzyyy.github.io/Impact-Aid/privacy.html) and [terms](https://imbatzyyy.github.io/Impact-Aid/terms.html) are linked from the consent screen.

## Session and profile behavior

The Supabase client uses PKCE, retaining its verifier on the device and exchanging the returned code once. The app validates the callback scheme, host and path, processes both live and cold-launch Android intents, and handles duplicate callbacks, denial, expiry and network errors. It opens Google using the system browser through Capacitor, never in the app's embedded WebView. Email/password and signup confirmation codes remain available. From 2.3.0, password recovery uses a secure link to the hosted reset page.

New Google users get a profile name from `full_name` or `name`. Existing profiles are not overwritten. Supabase handles same-email identity linking according to its verification rules; the app does not copy or merge records across user IDs. Use the same verified email as an existing account to retain its learning record.

Android's custom callback scheme is protected by PKCE against intercepted code exchange. A public hosted web application would need its own exact callback entry. Do not use a wildcard callback or turn off Google's nonce checks.

## Operational checks

After changing a Google client secret, update Supabase before retiring the previous secret. Confirm signup, repeated sign-in, cancellation and app return using the signed APK. Keep email confirmation enabled for email/password registrations. Google verifies the Google identity itself.

References: [Supabase Google authentication](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking), [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [Capacitor App](https://capacitorjs.com/docs/apis/app) and [Browser](https://capacitorjs.com/docs/apis/browser).
