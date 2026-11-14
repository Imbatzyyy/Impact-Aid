# Install Impact Aid 2.3.0

1. Copy `Impact-Aid-2.3.0.apk` to an Android phone (Android 7.0 / API 24 or newer).
2. Open the APK and, if Android asks, allow installation from the file app/browser you are using.
3. Install and launch **Impact Aid**.
4. Select **Sign in with Google** and choose your account, or use your existing email and password. If asked to verify your email, select **Send a code**, check your inbox/spam folder, and enter the code in the app.
5. New users can select **Sign up with Google**, or create an email/password account and confirm their email. For password recovery, select Forgot password, enter your email, then open Reset password in the email. Choose the new password on the Impact Aid website and return to the app to sign in.
6. Open **Places → Use my location**. Enable the phone's location service and choose **Precise** location for the best available fix. The accuracy shown by the app comes from the phone.

The APK is approximately 167 MiB (175 MB), primarily because six lesson videos are available in the package. Ensure sufficient free storage for installation.

This release uses package ID `io.ionic.starter`, retained from the original project, and version code 5. It uses the same signing key as Impact Aid 2.0.0, 2.1.0 and 2.2.0 and installs over those releases. If Android reports a signature conflict with an older build, back up anything you need before uninstalling that older build, then install this APK. Do not clear or delete the Supabase account.

The checksum is in `SHA256SUMS`. Verify on macOS with:

```sh
shasum -a 256 Impact-Aid-2.3.0.apk
```

Emergency calling requires phone service. A map fix can be approximate indoors or when only approximate location permission is granted. The app shows the accuracy and update state instead of promising exact GPS precision.

## Expanded emergency map

The Places tab contains 17,294 saved Philippine facility records, including fire stations, rescue/DRRM facilities, local government offices, hospitals, police and evacuation facilities. Tap a pin for a contact card with Call (when a usable number exists), Directions, address and source details. Use Search range → All Philippines to search another city. Without signing in, open Emergency help → Find nearby emergency places. The directory is available offline; map imagery and directions need internet. Keep Android System WebView updated.

Directory coverage is not exhaustive. Confirm current services and evacuation activation with the facility/LGU. Pins for mapped buildings show the site center, which can differ from the entrance.
