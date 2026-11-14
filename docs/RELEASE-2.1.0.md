# Android release 2.1.0

Package `io.ionic.starter`, version code 3, minimum Android API 24. The v2/v3 release signatures verify; the signing certificate matches 2.0.0. [Download and install](../release/INSTALL.md).

| Checked | Evidence |
| --- | --- |
| App build | Lint, all 64 automated tests, Angular production build and Gradle release build passed. The tests include every bank answer against the server key and the school-term boundaries in Manila. |
| Live Supabase | All six topics returned stable, distinct per-installation assignments. Repeated submissions produced one attempt per submission ID. Zero and perfect retakes both remained in history. Unauthorized accounts could not access other learners’ assignments, attempts or bookmarks. |
| Signed Android app | On an API 36 emulator: signed in, opened a guide, resumed the saved section, completed the guide, answered a quiz, resumed after an in-place APK update and submitted all 15 responses. My Progress and the stored Supabase attempt reflected the submission. |
| Map and GPS | On the emulator, a simulated Quezon City fix matched within 0.00005 degrees (reported accuracy 5 m). All seven filters occupied three rows. A fire-station popup showed its address, directions and explicit missing-number label; it fit at 320 dp width. |
| Offline assets and credentials | Inspected the final APK: six lesson videos and the target Supabase runtime endpoint present; checked for old Firebase endpoints and known privileged Supabase and SMTP keys. |
| Nearby search | Compared the old and new search at a 10 km radius near Quezon City on the bundled 17,294 records. Results were identical. A local Node benchmark (75 warm iterations) measured 0.96 ms median before and 0.19 ms after. This is a search benchmark, not an Android frame-rate measurement. |

Device layout, GPS precision, map tile network conditions and performance can differ on physical phones. No emergency call was placed. Previous results are preserved; the old client never recorded its individual answers.
