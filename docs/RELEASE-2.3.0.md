# Impact Aid 2.3.0 · Your profile, a calmer launch, and email-link recovery

The Android launcher now uses the Impact Aid shield. The launch background leads into a five-second pulsing splash with a fade into Home, or sign-in when signed out. Emergency help is available immediately.

My Profile now includes a separate full name and username, optional age and mobile number, optional Philippine address, and a chosen photo. Save changes opens a confirmation. Cancelling or leaving unsaved edits protects the saved profile. Google users keep initials until they choose their own photo. Home shows the saved photo automatically.

City/municipality and barangay fields offer suggestions as the user types. Province/region follow the selected city, with manual input and a bundled city reference available during service outages. Postal code and street details are optional manual inputs. Existing profiles, free-text addresses and learning records are preserved.

Forgot password asks only for email. Its email opens a hosted Impact Aid page where the user chooses a new password. Signup confirmation continues to use an email code.

## Verified

- 88 automated tests; lint, production web build and signed Android build.
- Profile edit, cancel/save confirmation, unsaved-change guard, photo upload and Home avatar update through the browser.
- Real Supabase tests with two disposable accounts: profile isolation, private photo isolation, invalid age/ID rejection, blocked public downloads and blocked cross-account avatar references.
- The signed APK's Android system photo picker, upload, save confirmation and a persisted profile saved on the web.
- Cold launch recording showed a matching blank system launch background, the animated splash and the signed-in Home screen. The launcher displays the shield logo. Small-screen profile and email-only recovery were checked in the emulator.
- The reset website's client reset a disposable account password through Supabase. New-password sign-in passed; the old password and reused link were rejected.
- Resend marked the updated reset email delivered to the owner's approved test inbox. Its button points to the hosted reset page. The owner's password was not changed.
- APK inspection found no known privileged Supabase, SMTP or Google secrets and no Firebase runtime endpoints. Six lesson videos remain bundled. Runtime dependency audit: zero known vulnerabilities.

Photos use authenticated downloads from a private bucket. Original photo files and EXIF are not uploaded. All optional profile details stay scoped to the owning account. Read [implementation and operational notes](PROFILE-AND-RECOVERY.md).

Package `io.ionic.starter` · version code **5** · signed with the same certificate as 2.0.0–2.2.0. Install the APK as an update. Android 12+ retains its required OS launch surface; vendor-specific animations and physical devices are outside emulator coverage. Google-account completion on a physical phone remains the previously deferred owner test.
