#!/bin/sh
# Rebuild every lesson video quality from the 1080p masters in docs/videos/1080p.
#   480p        -> src/assets/lessons (ships inside the app, plays offline)
#   144p, 240p, 720p -> docs/videos/<quality> (streamed from GitHub Pages)
# After running, update STREAM_MB in src/app/models/video-quality.ts with the new sizes.
# Needs ffmpeg with libx264. Run from the repository root.
set -eu

MASTERS=docs/videos/1080p

encode() { # <master> <height> <audio kbps> <output>
  mkdir -p "$(dirname "$4")"
  ffmpeg -v error -y -i "$1" -map 0:v:0 -map 0:a:0 \
    -vf "scale=-2:$2:flags=lanczos" -c:v libx264 -preset slow -tune animation -crf 28 \
    -profile:v high -level 4.0 -pix_fmt yuv420p -c:a aac -b:a "${3}k" \
    -movflags +faststart -map_metadata -1 "$4"
  echo "$4"
}

find "$MASTERS" -name '*.mp4' | sort | while read -r master; do
  video=${master#"$MASTERS"/}
  encode "$master" 480 96 "src/assets/lessons/$video"
  encode "$master" 720 96 "docs/videos/720p/$video"
  encode "$master" 240 64 "docs/videos/240p/$video"
  encode "$master" 144 64 "docs/videos/144p/$video"
done
