# Profile, launch and password recovery

## My Profile

Home’s circular profile button opens My Profile. Until the user chooses a photo, it shows initials, including for Google users. Editing supports a full name, chosen display username, optional age, optional mobile number and optional address. Email remains read-only. Save opens a confirmation dialog. Cancelling the dialog preserves the draft; cancelling editing or leaving with unsaved changes requires a discard confirmation.

The profile row remains protected by the existing owner-only RLS policy. Column-level grants limit what clients can change. Server constraints cover age, lengths, geographic codes, postal code and the owning photo path. Existing profiles and free-text addresses are preserved by the migration.

Photos are selected using the browser/Android system picker. JPG, PNG and WebP inputs up to 10 MB are decoded and re-encoded as a 512 × 512 JPEG; the original and EXIF metadata are not uploaded. The `profile-photos` bucket is private, limited to 2 MB JPEG objects, and limits read/upload/delete to the signed-in user's folder. The app downloads with authentication and creates a temporary in-memory blob URL. It does not use public or signed photo URLs. Replacing the photo uploads a new version, updates the profile, then deletes the previous object. A failed profile write removes the new upload. Photo and profile caches clear on sign-out/account change.

The chosen photo is shared reactively with Home and loaded again after restarting/signing in. Google provider avatar URLs are not used for the chosen photo.

## Philippine address suggestions

[PSGC Cloud](https://psgc.cloud/api-docs) supplies cities/municipalities, provinces, regions and barangays. Searches run on-device. Typing **Q** surfaces **Quezon City** first; selecting it fetches that city's barangays, which can then be searched by typing. The provider receives public directory requests and a selected city code, not the user's name, street, house number or saved profile.

A snapshot of 1,656 city/municipality/district entries retrieved on November 14, 2026 is bundled at `src/assets/addresses/cities.json`. It is a fallback if the live directory fails. Barangay lists are cached after a successful request; manual typing remains available when suggestions fail. All address fields are optional. A postal code is entered manually: the API does not consistently provide one, and a city may have several. Province and region are filled from the selected place.

## Launch

The shield logo is packaged in all legacy and adaptive Android launcher densities. Android's required launch surface uses the same pale background and a transparent icon drawable. It transitions to the app's pulsing shield splash, shown for approximately five seconds from its visible entry, including a 350 ms fade. A signed-in user goes to Home; a signed-out user goes to sign-in. Emergency help is accessible during the splash. Leaving for emergency help or an OAuth callback cancels its navigation timer. Reduced-motion settings disable the pulse.

Android 12+ owns the system launch surface and manufacturers may add launcher animations; it cannot be removed from the OS. [Capacitor's launch-screen documentation](https://capacitorjs.com/docs/apis/splash-screen) explains this constraint.

## Email-link password recovery

Forgot password in 2.3.0 accepts only email. Supabase/Resend sends a button to [the hosted reset page](https://imbatzyyy.github.io/Impact-Aid/reset-password.html). The recovery template uses `TokenHash` in a URL fragment. The page removes it from the address bar immediately, requests no analytics or external assets, and verifies it only when a valid new password is submitted. No browser session/token is persisted. A password-policy or temporary update error can be retried using the already verified in-memory recovery session. Successful updates revoke refresh sessions and discard that session. Invalid, expired and consumed links cannot reset a password.

The recovery page uses a public Supabase key. Its CSP limits connections to the project's auth endpoint and scripts/styles to the hosted site. Passwords are sent directly to Supabase over HTTPS. Email delivery is not an account-existence signal in the app's success message. Signup confirmation continues to use the existing email code. Older APKs that expect a password-reset code should be updated to 2.3.0.

Configure the exact reset URL in Supabase's redirect allow list and the HTML in `supabase/templates/recovery.html` as its recovery email template. [Supabase's email-template reference](https://supabase.com/docs/guides/auth/auth-email-templates) documents token-hash links. Google callback URLs stay enabled.
