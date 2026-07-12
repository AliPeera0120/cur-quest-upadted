#!/usr/bin/env bash
# One-time script: downloads the images still hosted on Base44/Supabase into
# public/images/ and rewrites the source code to reference the local copies.
# Run from the repo root:  bash scripts/localize-images.sh
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p public/images

declare -a URLS=(
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696594fc2acba2d4bc584513/118c89122_Curiosity.png|logo.png"
  "https://media.base44.com/images/public/696594fc2acba2d4bc584513/8724722ea_Screenshot2026-04-06at110713PM.png|team-1.png"
  "https://media.base44.com/images/public/696594fc2acba2d4bc584513/ee6aca45e_Screenshot2026-04-06at110720PM.png|team-2.png"
  "https://media.base44.com/images/public/696594fc2acba2d4bc584513/83ca71469_Screenshot2026-04-06at110727PM.png|team-3.png"
  "https://media.base44.com/images/public/696594fc2acba2d4bc584513/f1205f4e0_Screenshot2026-04-06at110741PM.png|team-4.png"
  "https://media.base44.com/images/public/696594fc2acba2d4bc584513/a2214e57c_PhoenixvilleLibrary.png|event-phoenixville-library.png"
  "https://media.base44.com/images/public/696594fc2acba2d4bc584513/5dbc64fbc_CuriosityQuestatEarthDayPhoenixville1.png|event-earth-day.png"
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696594fc2acba2d4bc584513/c9c721d64_Science_Fun_Fiyer.png|event-science-fun.png"
)

echo "Downloading images..."
for entry in "${URLS[@]}"; do
  url="${entry%%|*}"
  name="${entry##*|}"
  echo "  $name"
  curl -fsSL "$url" -o "public/images/$name"
done

echo "Rewriting source references..."
FILES=(src/Layout.jsx src/components/home/OurTeam.jsx src/pages/Events.jsx index.html)
for entry in "${URLS[@]}"; do
  url="${entry%%|*}"
  name="${entry##*|}"
  for f in "${FILES[@]}"; do
    if grep -q "$url" "$f" 2>/dev/null; then
      # portable in-place sed (works on macOS and Linux)
      perl -pi -e "s|\Q$url\E|/images/$name|g" "$f"
    fi
  done
done

echo "Done. Images are in public/images/ and code now references them locally."
echo "Commit the changes: git add -A && git commit -m 'Localize images'"
