# QC quiz releases · Academic year 2026–2027

Based on the supplied **Technological Institute of the Philippines, Quezon City — Revised School Calendar, SY 2026–2027**. Dates are inclusive in Asia/Manila.

| Release | Opens | Last day |
| --- | --- | --- |
| First semester | July 6, 2026 | November 7, 2026 |
| Second semester | November 26, 2026 | April 14, 2027 |
| Summer | May 3, 2027 | June 11, 2027 |

During breaks, the last set is open for review. Christmas break does not create a separate question release. After summer, summer review stays available until an approved calendar is added. To add another school year, add dated rows to `school_terms` through a new migration; dates are not extrapolated by the app.

Each of the six topics has 50 question IDs. The server assigns 15 per learner, installation and term, with a uniqueness constraint on the sorted question IDs for each term/topic. The next term excludes the immediately previous set on that installation when available. Different installations may share individual questions; they cannot get the same complete set in that topic and term. The installation ID is random and local, independent of hardware identifiers and GPS. Clearing app data starts a new installation.

Question and answer order shuffle for each practice attempt. A draft stays on its installation until submitted or superseded by a new term’s set. Submitted attempts keep the original question and answer indices; preserve those identities when updating the bank. Previously imported scores do not have invented per-question histories. Nine correct out of 15 passes a quiz; passing all six quizzes and explicitly completing all six guides unlocks the course certificate.

## Preparedness references

Use local official instructions during an actual emergency. The practice scenarios draw on these public education resources:

- [CDC: safety during an earthquake](https://www.cdc.gov/earthquakes/safety/stay-safe-during-an-earthquake.html).
- [National Weather Service: during a tsunami](https://www.weather.gov/safety/tsunami-during) and [flooded roadways](https://www.weather.gov/safety/flood-turn-around-dont-drown).
- [PAGASA: tropical cyclone wind signals](https://pagasa.dost.gov.ph/learning-tools/tropical-cyclone-wind-signal) and [storm surge](https://pagasa.dost.gov.ph/information/storm-surge).
- [USGS: landslide preparedness](https://www.usgs.gov/programs/landslide-hazards/how-do-i-prepare-a-landslide) and [protecting against volcanic ash](https://volcanoes.usgs.gov/volcanic_ash/protecting_against_ash.html).
