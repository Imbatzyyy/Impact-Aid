# Emergency places directory

The APK includes **17,294 Philippine OpenStreetMap records**, snapshot **2026-11-13 17:00:51 UTC** (November 14 in Manila): 2,069 hospitals, 2,541 police facilities, 1,225 fire stations/brigades, 862 rescue/DRRM facilities, 10,326 local government facilities, and 271 evacuation facilities. These are mapped records, not a claim that every real facility is present, open, staffed, or currently activated. Some records represent different buildings on one campus, and some contributor names/addresses are missing.

The directory opens without sign-in through Emergency help → Find nearby emergency places. `/places` is public; `/map` is the signed-in tab. Account data remains exclusively in Supabase. The facility snapshot is a bundled public data asset, not a second account database. No runtime Overpass query or location upload is needed to search it.

Search defaults to 10 km around Quezon City until the user requests GPS or chooses another map area. Search range options are 10, 25, 50 km and All Philippines. Name/address search and category filters combine. Distances are unrounded Haversine values for filtering/sorting and displayed to one decimal place. GPS fixes update nearby distances while the foreground watch runs. Pausing location retains the search area with a clear “Last location search” label, not an active GPS claim.

The map renders up to 200 matching pins in the current view, with an explicit count and instruction to zoom/filter when the cap applies. The full matching list remains available in pages of 30. Each category has its own color and letter, with accessible facility names. A tapped pin opens a responsive card with name, category, available number, address, Call/Directions, and source links. Long cards scroll inside the map. Controls are at least 44 px high; the opening animation respects reduced motion. Existing markers are reused so GPS refresh does not dismiss open pop-ups. Resize handling preserves map center and waits for Ionic page entry before initialization.

Phone numbers are treated as contributor data, not independently verified contacts. Invalid and legacy seven-digit Metro Manila numbers do not become call links. Multiple numbers are never concatenated; unsupported extensions are not guessed. Five QC records have official-directory contact overrides in `scripts/emergency-place-overrides.json`. In particular QCDRRMO uses the current city-listed direct number, and QCGH's former seven-digit OSM number is replaced with the city-listed number. These entries display the official source separately from map-coordinate provenance.

Hospital tags do not guarantee an emergency department. Barangay/city/municipal halls are labeled coordination offices, not dispatch centers. Evacuation sites are included only from explicitly named/tagged evacuation/displaced-person facilities; ordinary schools or gyms are not automatically designated shelters. The UI asks users to confirm activation and safe access with their LGU. Site-center coordinates are labeled because the entrance can differ. The QC official evacuation guide and response directory are linked.

## Sources and reproducible update

- Map data and each coordinate: [OpenStreetMap](https://www.openstreetmap.org/copyright), with per-record source URLs.
- [QC government directory](https://quezoncity.gov.ph/quezon-city-government-directory/).
- [QCDRRMO office and contact](https://quezoncity.gov.ph/departments/quezon-city-disaster-and-risk-reduction-management-office/).
- [QC earthquake evacuation guide](https://quezoncity.gov.ph/qcitizen-guides/qc-earthquake-evacuation-centers/).

Fetch `scripts/emergency-places.overpass` manually using a suitable Overpass endpoint and an identifying User-Agent. Public Overpass instances are not the app's runtime backend. The successful export used `https://overpass-api.de/api/interpreter`; alternative instances timed out and were not used as data sources. Check the entire response for timeouts/remarks before importing:

```sh
node scripts/import-emergency-places.mjs path/to/complete-response.json
npm test
```

The importer excludes known disused/abandoned/construction entries, classifies facilities, validates coordinates, and merges same-name/category duplicates within approximately 55 m (except unnamed sites). It then applies documented contact overrides. Review changes before rebuilding. Snapshot refreshes are manual; no unattended data-updater was installed.

The derived directory `src/assets/data/emergency-places.json` is distributed under **ODbL-1.0**, attributed to © OpenStreetMap contributors; the app exposes the complete JSON for download. This license applies to the directory data, not automatically to application code. [License text](https://opendatacommons.org/licenses/odbl/1-0/).

The saved directory works offline in the APK. Tiles, external source pages and directions need internet. Neither the directory nor the route service reports current road safety, shelter capacity, or responder dispatch status.
