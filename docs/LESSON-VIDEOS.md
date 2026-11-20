# Lesson videos

Each of the six guides has one video, offered in five qualities. The Quality row under the player remembers the last choice on that phone.

| Quality | Where it lives | Plays offline | Six videos together |
| --- | --- | --- | --- |
| 144p | GitHub Pages, `docs/videos/144p/` | No | 18 MB |
| 240p | GitHub Pages, `docs/videos/240p/` | No | 24 MB |
| 480p | Inside the app, `src/assets/lessons/` | Yes | 49 MB |
| 720p | GitHub Pages, `docs/videos/720p/` | No | 73 MB |
| 1080p | GitHub Pages, `docs/videos/1080p/` | No | 166 MB |

The app opens every video at 480p unless the phone chose a streamed quality before. A streamed quality is unavailable while the phone is offline. If a stream fails or the phone loses its connection, the 480p copy takes over at the same point in the video.

The 1080p files are the original masters. The other qualities are H.264 (High profile, CRF 28, `-tune animation`) with AAC audio at 96 kbps, or 64 kbps for 144p and 240p, and `+faststart` so playback starts before the whole file arrives.

## Rebuild the qualities

Run `scripts/encode-lesson-videos.sh` from the repository root (needs ffmpeg). It re-encodes every quality from `docs/videos/1080p`. Then update `STREAM_MB` in `src/app/models/video-quality.ts` with the new file sizes, because the app shows that figure as the data a stream uses.

Streamed files go live when `docs/` on `main` is published to GitHub Pages. GitHub Pages limits a site to 1 GB and about 100 GB of transfer a month; a full 1080p video is 9–46 MB.
