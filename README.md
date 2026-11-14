# Impact Aid 2.0.0

Android disaster-preparedness learning and emergency-directory app, built with Angular, Ionic, Capacitor, and Supabase.

## Release

The signed installable APK is generated at `release/Impact-Aid-2.0.0.apk`. See `release/INSTALL.md` for installation, verification, and limitations. `release/SHA256SUMS` identifies the final binary.

The app uses Supabase project `xuutncpfupkosbqjgmei` for authentication, profiles, learning progress, quiz results, and personal contacts. Public Supabase configuration is in `src/environments`. No privileged backend or email credential belongs in the client.

## Develop and build

Use Node 24 (see `.nvmrc`), Java 21, and Android SDK 36. Android minimum SDK is 24.

```sh
npm ci
npm run lint
npm test
npm start -- --host 127.0.0.1
```

Build a release:

```sh
npm run build
npx cap sync android
export JAVA_HOME=$(/usr/libexec/java_home -v21)
cd android
./gradlew assembleRelease
cd ..
python3 scripts/sign-android.py
```

The signing helper uses the existing private release keystore under `~/Library/Application Support/Impact Aid/signing/`. Preserve that folder and its password securely for future updates. The script creates a key only when neither keystore nor password exists; do not generate a replacement key for an already distributed app.

The repository excludes build output, private working files and keystores. Install the exact signed APK in `release`, not the unsigned Gradle output. The local `.work/runtime` Node installation was used for this repair; it is not required when a supported Node version is installed normally.

## Backend and email

- Schema and row access policies: `supabase/migrations/`.
- Confirmation and recovery emails: `supabase/templates/`.
- Migration fidelity, cutoff, and rollback: `docs/MIGRATION-CUTOVER.md`.
- Cloudflare DNS records: `dns/impactaid.cfd.bind`.
- Resend sender: `Impact Aid <no-reply@mail.impactaid.cfd>`.

Email confirmation is required. Migrated users keep their existing password, but must verify their address in the app before signing in. Codes are entered in the app; do not put admin keys or email credentials into the APK.

Both SQL migration versions are already recorded as applied on the live project. Do not rerun the creation SQL manually.

## Operating boundaries

Public emergency numbers are bundled and accessible from sign-in. The app opens the phone dialer; users place the call themselves. It does not dispatch emergency services, provide live disaster alerts, or guarantee active evacuation sites.

Lesson materials and videos are bundled. Account data, progress saving, personal contacts, and map tiles use internet access. Unsaved offline results are not queued for synchronization. Certificates record learning in this app and are not professional emergency-response certification.
