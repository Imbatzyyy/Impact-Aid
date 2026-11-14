# Impact Aid 2.2.0 · Google sign-in

**Sign in with Google** and **Sign up with Google** now connect to Supabase. First-time Google users receive a profile; repeat sign-ins use the same account. The email and recovery flows remain available.

Google OAuth uses a dedicated project, separate from Firebase, and only identity, email and profile scopes. The Android app opens the system browser and processes the exact callback URI with PKCE. Provider secrets remain outside the APK and repository. The public app, privacy and terms pages are linked from Google's consent screen.

## Verification

- Lint, 75 automated tests, Angular production build and Android release build passed.
- Real Google signup and repeat login completed through the local web application. Supabase contained one verified Google identity and profile; repeated login preserved the same account and records.
- Both Google buttons opened the real account chooser.
- Disposable API users verified Google-name profile fallback and email-login compatibility, then were removed.
- The signed APK installed over the existing release, opened Google's system-browser sign-in page, and processed denied and expired callbacks. A denied callback also worked when the app was cold-launched.
- APK inspection checked for old Firebase endpoints and the known privileged Supabase, SMTP and Google OAuth secrets. Six lesson videos remain bundled.
- The runtime dependency audit reported zero known vulnerabilities.

The user deferred entering Google credentials in the Android emulator. A successful real Google-account return inside the installed APK and physical-phone behavior remain to be checked by the user. Automated callback tests and native denial/expiry handling passed, but they do not replace that end-to-end native login test.

Google's consent screen currently displays the Supabase project hostname. The OAuth project is in production; custom brand name/logo verification is not completed. The scope request contains no Gmail, Drive, Contacts or other sensitive/restricted Google API access.

Package: `io.ionic.starter` · version code **4** · same release signing certificate as 2.0.0 and 2.1.0. Download the signed APK and SHA256SUMS from the [release](https://github.com/Imbatzyyy/Impact-Aid/releases/tag/v2.2.0).
