# Impact Aid 2.4.0 · Frame your profile photo

Changing a profile photo now opens a circular crop editor. Drag to position the image, pinch or use the zoom slider, rotate it, and tap **Use photo**. Direction buttons and keyboard arrows offer another way to position it. Reset starts over; Cancel keeps the existing photo. The usual **Save changes** confirmation saves the crop to the account and updates Home.

Photo loading no longer relies on `HTMLImageElement.decode()` alone. Android's system picker converts supported camera files, including HEIC, to an oriented JPEG before the crop editor. The browser keeps the file handle until bytes are copied, checks the actual image format and includes a decoder fallback. Unreadable files produce a clear message without replacing the existing photo. The editor uses a bounded preview and exports only a 512 × 512 JPEG, without original EXIF metadata.

## Verified

- 96 automated tests; lint, production web build and signed Android build pass.
- Browser picker and crop editor with JPG, PNG, WebP, EXIF-rotated JPEG and a 24-megapixel JPEG; corrupt image recovery and crop cancellation.
- Zoom, rotation, reset, directional positioning and pointer dragging, plus 360px browser and 320px Android layout checks.
- Signed APK: JPG selection, HEIC conversion, crop positioning, save confirmation, and the updated avatar on Home after a cold restart.
- An independent authenticated Supabase download confirmed the native crop is a 512 × 512 JPEG with no EXIF. Only the current photo remained in the test user's private folder.
- Two disposable-account checks verified profile isolation, owner-only photo access and blocked anonymous/public photo downloads.
- Runtime dependency audit: zero known vulnerabilities. APK inspection found no known privileged Supabase, SMTP or Google secrets or Firebase runtime endpoints; all six lesson videos remain bundled.

Package `io.ionic.starter` · version code **6** · signed with the same certificate as 2.3.0. Install as an update. Format support still depends on the device's native codecs (or the browser for web uploads); JPG, PNG and WebP are recommended. Tests used synthetic images on the Android emulator and browser, not the owner's original failing photo or physical phone.

[Implementation details](PROFILE-AND-RECOVERY.md) · [Installation](../release/INSTALL.md)
