#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
#  optimize-media.sh  —  Complete image & video optimization pipeline
#  Version 1.0
#
#  USAGE:
#    chmod +x optimize-media.sh
#    ./optimize-media.sh
#
#  DROP YOUR FILES HERE BEFORE RUNNING:
#    raw/images/   ← JPG / PNG / HEIC photos from the client
#    raw/hero/     ← Hero background video (MP4 / MOV)
#    raw/scrub/    ← Scroll-scrub video (MP4 / MOV)
#
#  OUTPUT LANDS IN:
#    output/images/avif/          optimized AVIF at 4 widths
#    output/images/webp/          optimized WebP at 4 widths
#    output/images/jpg/           stripped JPG at 4 widths (fallback)
#    output/videos/hero/          hero.webm + hero.mp4 + hero-poster.avif
#    output/videos/scrub/frames/  frame sequence as AVIF
#    output/html/picture-tags.html   ready-to-paste <picture> tags
#    output/html/video-tags.html     ready-to-paste <video> tags
#    output/html/scrub-js.html       ready-to-paste JS scroll-scrub code
#    output/report.txt               full summary
#
#  REQUIRES:  ffmpeg  imagemagick  libavif (avifenc)  libwebp (cwebp)
#  OPTIONAL:  @squoosh/cli  (npm install -g @squoosh/cli) — better AVIF encoder
#
#  INSTALL ON macOS:
#    brew install ffmpeg imagemagick libavif webp
#  INSTALL ON Ubuntu/Debian:
#    sudo apt install ffmpeg imagemagick libavif-bin webp
# ══════════════════════════════════════════════════════════════════════════════

set -uo pipefail

# ── USER CONFIGURATION  (edit these values to change behaviour) ───────────────

RAW_DIR="raw"        # folder where you drop client files
OUT_DIR="output"     # folder where optimized files land

# Responsive widths to generate for every image (pixels)
WIDTHS=(480 768 1280 1920)

# AVIF quality  0–100 · lower = smaller file · sweet spot: 50–65
PHOTO_AVIF_Q=55      # for real photos
GRAPHIC_AVIF_Q=70    # for screenshots / UI graphics (needs sharper edges)

# WebP quality  0–100 · sweet spot: 75–82
PHOTO_WEBP_Q=78
GRAPHIC_WEBP_Q=88

# JPG quality   0–100 · sweet spot: 80–85  (fallback format)
JPG_Q=85

# AVIF encoder speed  0=slowest/smallest  10=fastest/bigger · sweet spot: 4
AVIF_SPEED=4

# Hero video
HERO_CRF_WEBM=33     # VP9  CRF  0–63   · sweet spot web: 28–36
HERO_CRF_MP4=26      # H.264 CRF 0–51   · sweet spot web: 22–28
HERO_MAX_W=1280      # output resolution (px)
POSTER_SECOND=1      # which second to grab for the poster image

# Scroll-scrub: how many frames to extract from the video
SCRUB_FRAMES=150

# ── COLOURS ───────────────────────────────────────────────────────────────────
R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'
B='\033[0;34m'; C='\033[0;36m'; W='\033[1;37m'; N='\033[0m'

# ── HELPER FUNCTIONS ──────────────────────────────────────────────────────────
log()     { echo -e "${G}  ✔${N}  $*"; }
info()    { echo -e "${B}  →${N}  $*"; }
warn()    { echo -e "${Y}  ⚠${N}  $*"; }
err()     { echo -e "${R}  ✘${N}  $*" >&2; }
section() { echo -e "\n${W}━━━  $*${N}"; }
divider() { echo -e "${C}  ────────────────────────────────────────────────────${N}"; }

# Cross-platform file size (macOS uses -f%z, Linux uses -c%s)
fsize() {
  stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null || echo 0
}

# Human-readable bytes
human() {
  local b=$1
  if   (( b >= 1048576 )); then printf "%.1f MB" "$(echo "scale=1;$b/1048576" | bc)"
  elif (( b >= 1024 ));    then printf "%d KB"    "$(echo "$b/1024"            | bc)"
  else                          printf "%d B"     "$b"
  fi
}

# ── TOOL DETECTION ────────────────────────────────────────────────────────────
section "Checking required tools"

MISSING=()
need() {
  if command -v "$1" &>/dev/null; then
    log "Found: $1"
  else
    MISSING+=("$1")
    warn "Missing: $1"
  fi
}

need ffmpeg
need convert       # ImageMagick
need avifenc       # libavif
need cwebp         # libwebp

# Optional better encoder
USE_SQUOOSH=false
if command -v squoosh-cli &>/dev/null; then
  log "Found: squoosh-cli (will use as primary AVIF/WebP encoder)"
  USE_SQUOOSH=true
else
  info "squoosh-cli not found — using avifenc + cwebp (also excellent)"
  info "To install: npm install -g @squoosh/cli"
fi

if (( ${#MISSING[@]} > 0 )); then
  echo ""
  err "Cannot continue — missing tools: ${MISSING[*]}"
  echo ""
  echo "  macOS:   brew install ffmpeg imagemagick libavif webp"
  echo "  Ubuntu:  sudo apt install ffmpeg imagemagick libavif-bin webp"
  echo ""
  exit 1
fi

# ── FOLDER SETUP ──────────────────────────────────────────────────────────────
section "Creating folder structure"

mkdir -p \
  "$RAW_DIR/images" "$RAW_DIR/hero" "$RAW_DIR/scrub" \
  "$OUT_DIR/images/avif" "$OUT_DIR/images/webp" "$OUT_DIR/images/jpg" \
  "$OUT_DIR/videos/hero" "$OUT_DIR/videos/scrub" \
  "$OUT_DIR/html"

# Clear previous HTML output
for f in picture-tags video-tags scrub-js; do
  > "$OUT_DIR/html/${f}.html"
done

log "Input:  $RAW_DIR/"
log "Output: $OUT_DIR/"

# ── COLLECT INPUT FILES ───────────────────────────────────────────────────────
section "Scanning raw/ folder"

IMG_FILES=()
for ext in jpg jpeg JPG JPEG png PNG heic HEIC; do
  while IFS= read -r -d '' f; do
    IMG_FILES+=("$f")
  done < <(find "$RAW_DIR/images" -maxdepth 1 -name "*.$ext" -print0 2>/dev/null)
done

HERO_FILES=()
for ext in mp4 MP4 mov MOV mkv MKV; do
  while IFS= read -r -d '' f; do
    HERO_FILES+=("$f")
  done < <(find "$RAW_DIR/hero" -maxdepth 1 -name "*.$ext" -print0 2>/dev/null)
done

SCRUB_FILES=()
for ext in mp4 MP4 mov MOV mkv MKV; do
  while IFS= read -r -d '' f; do
    SCRUB_FILES+=("$f")
  done < <(find "$RAW_DIR/scrub" -maxdepth 1 -name "*.$ext" -print0 2>/dev/null)
done

# ── ANALYSIS PASS (print what we found before starting) ──────────────────────
echo ""
info "Images  (${#IMG_FILES[@]} files):"
for f in "${IMG_FILES[@]}"; do
  w=$(identify -format "%w" "$f" 2>/dev/null || echo "?")
  h=$(identify -format "%h" "$f" 2>/dev/null || echo "?")
  s=$(fsize "$f")
  printf "     %-40s  %sx%s  %s\n" "$(basename "$f")" "$w" "$h" "$(human "$s")"
done

echo ""
info "Hero videos  (${#HERO_FILES[@]} files):"
for f in "${HERO_FILES[@]}"; do
  dur=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$f" 2>/dev/null | xargs printf "%.1f")
  res=$(ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$f" 2>/dev/null)
  s=$(fsize "$f")
  printf "     %-40s  %s  %ss  %s\n" "$(basename "$f")" "$res" "$dur" "$(human "$s")"
done

echo ""
info "Scrub videos  (${#SCRUB_FILES[@]} files):"
for f in "${SCRUB_FILES[@]}"; do
  dur=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$f" 2>/dev/null | xargs printf "%.1f")
  res=$(ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$f" 2>/dev/null)
  s=$(fsize "$f")
  printf "     %-40s  %s  %ss  %s\n" "$(basename "$f")" "$res" "$dur" "$(human "$s")"
done

# Warn if no files found
if (( ${#IMG_FILES[@]} + ${#HERO_FILES[@]} + ${#SCRUB_FILES[@]} == 0 )); then
  echo ""
  warn "No files found in $RAW_DIR/"
  echo "  Drop files into: raw/images/  raw/hero/  raw/scrub/"
  exit 0
fi

echo ""
read -rp "$(echo -e "${Y}  Start optimization? [Y/n]: ${N}")" CONFIRM
[[ "${CONFIRM:-Y}" =~ ^[Nn]$ ]] && echo "Aborted." && exit 0

# ── TOTALS (for final summary) ────────────────────────────────────────────────
TOTAL_IN=0
TOTAL_OUT=0
IMGS_DONE=0
VIDS_DONE=0

# ══════════════════════════════════════════════════════════════════════════════
# PART 1 — IMAGES
# ══════════════════════════════════════════════════════════════════════════════
section "Processing Images"

# ── AVIF encoder (wraps squoosh or avifenc) ───────────────────────────────────
encode_avif() {
  local src="$1" dst="$2" q="$3"
  if $USE_SQUOOSH; then
    local dir; dir=$(dirname "$dst")
    local base; base=$(basename "${src%.*}")
    squoosh-cli --avif "{\"quality\":$q,\"speed\":$AVIF_SPEED}" "$src" \
      --output-dir "$dir" --suffix "" 2>/dev/null
    # squoosh writes file named after the input; rename to desired output path
    local sq="$dir/${base}.avif"
    [[ -f "$sq" && "$sq" != "$dst" ]] && mv "$sq" "$dst"
  else
    avifenc -q "$q" -s "$AVIF_SPEED" "$src" "$dst" 2>/dev/null
  fi
}

# ── WebP encoder ──────────────────────────────────────────────────────────────
encode_webp() {
  local src="$1" dst="$2" q="$3"
  if $USE_SQUOOSH; then
    local dir; dir=$(dirname "$dst")
    local base; base=$(basename "${src%.*}")
    squoosh-cli --webp "{\"quality\":$q}" "$src" \
      --output-dir "$dir" --suffix "" 2>/dev/null
    local sq="$dir/${base}.webp"
    [[ -f "$sq" && "$sq" != "$dst" ]] && mv "$sq" "$dst"
  else
    cwebp -q "$q" "$src" -o "$dst" 2>/dev/null
  fi
}

# ── Screenshot/graphic detector ───────────────────────────────────────────────
# Heuristic: if shortest side < 900px, or matches a common screen resolution,
# it's likely a screenshot or UI export — needs higher quality to keep edges sharp.
is_graphic() {
  local f="$1"
  local w h shortest
  w=$(identify -format "%w" "$f" 2>/dev/null || echo 9999)
  h=$(identify -format "%h" "$f" 2>/dev/null || echo 9999)
  (( w < h )) && shortest=$w || shortest=$h
  if (( shortest < 900 )); then return 0; fi
  for res in "1920x1080" "1366x768" "2560x1440" "3840x2160" "1280x800" "2560x1600"; do
    [[ "${w}x${h}" == "$res" || "${h}x${w}" == "$res" ]] && return 0
  done
  return 1
}

for FILE in "${IMG_FILES[@]}"; do
  divider
  NAME=$(basename "$FILE")
  BASE="${NAME%.*}"
  EXT_LOWER=$(echo "${NAME##*.}" | tr '[:upper:]' '[:lower:]')

  IN_SIZE=$(fsize "$FILE")
  TOTAL_IN=$((TOTAL_IN + IN_SIZE))

  info "[$((IMGS_DONE + 1))/${#IMG_FILES[@]}]  $NAME  ($(human "$IN_SIZE"))"

  # ── Convert HEIC → JPG if needed (ffmpeg handles HEIC natively) ─────────────
  WORK="$FILE"
  if [[ "$EXT_LOWER" == "heic" ]]; then
    info "  Converting HEIC → JPG..."
    WORK="/tmp/opt_${BASE}.jpg"
    ffmpeg -i "$FILE" -q:v 2 "$WORK" -y -loglevel quiet
  fi

  # ── Decide quality based on content type ────────────────────────────────────
  if is_graphic "$WORK"; then
    AVIF_Q=$GRAPHIC_AVIF_Q
    WEBP_Q=$GRAPHIC_WEBP_Q
    warn "  Looks like a screenshot/graphic — using higher quality (AVIF:$AVIF_Q WebP:$WEBP_Q)"
  else
    AVIF_Q=$PHOTO_AVIF_Q
    WEBP_Q=$PHOTO_WEBP_Q
    info "  Photo detected — standard quality (AVIF:$AVIF_Q WebP:$WEBP_Q)"
  fi

  # ── Resize + strip EXIF → JPG at each width ─────────────────────────────────
  for W in "${WIDTHS[@]}"; do
    JPG_OUT="$OUT_DIR/images/jpg/${BASE}@${W}.jpg"
    convert "$WORK" -strip -resize "${W}x" -quality "$JPG_Q" "$JPG_OUT" 2>/dev/null
  done
  log "  JPG: 4 widths written"

  # ── Encode AVIF + WebP from the JPG versions ─────────────────────────────────
  # (Using JPG as input to AVIF/WebP keeps the pipeline consistent — the resize
  #  already happened; re-encoding from JPG at this quality level has no visible loss)
  for W in "${WIDTHS[@]}"; do
    JPG_SRC="$OUT_DIR/images/jpg/${BASE}@${W}.jpg"
    encode_avif "$JPG_SRC" "$OUT_DIR/images/avif/${BASE}@${W}.avif" "$AVIF_Q"
    encode_webp "$JPG_SRC" "$OUT_DIR/images/webp/${BASE}@${W}.webp" "$WEBP_Q"
    TOTAL_OUT=$((TOTAL_OUT + $(fsize "$OUT_DIR/images/avif/${BASE}@${W}.avif")))
    TOTAL_OUT=$((TOTAL_OUT + $(fsize "$OUT_DIR/images/webp/${BASE}@${W}.webp")))
    TOTAL_OUT=$((TOTAL_OUT + $(fsize "$JPG_SRC")))
  done
  log "  AVIF: 4 widths written"
  log "  WebP: 4 widths written"

  # ── Build srcsets ────────────────────────────────────────────────────────────
  AVIF_SET=""; WEBP_SET=""
  for W in "${WIDTHS[@]}"; do
    AVIF_SET+="images/avif/${BASE}@${W}.avif ${W}w, "
    WEBP_SET+="images/webp/${BASE}@${W}.webp ${W}w, "
  done
  AVIF_SET="${AVIF_SET%, }"   # trim trailing comma+space
  WEBP_SET="${WEBP_SET%, }"

  # ── Append <picture> tag to HTML file ────────────────────────────────────────
  cat >> "$OUT_DIR/html/picture-tags.html" <<HTML

<!-- ${BASE} -->
<picture>
  <source type="image/avif"
    srcset="${AVIF_SET}"
    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1280px">
  <source type="image/webp"
    srcset="${WEBP_SET}"
    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1280px">
  <img
    src="images/jpg/${BASE}@1280.jpg"
    alt="${BASE}"
    loading="lazy"
    decoding="async"
    width="1280"
    height="853">
</picture>
HTML

  log "  <picture> tag appended → output/html/picture-tags.html"
  IMGS_DONE=$((IMGS_DONE + 1))
  log "  ✅ Done"
done

# ══════════════════════════════════════════════════════════════════════════════
# PART 2 — HERO VIDEOS
# ══════════════════════════════════════════════════════════════════════════════
section "Processing Hero Videos"

for FILE in "${HERO_FILES[@]}"; do
  divider
  NAME=$(basename "$FILE")
  BASE="${NAME%.*}"

  IN_SIZE=$(fsize "$FILE")
  TOTAL_IN=$((TOTAL_IN + IN_SIZE))

  DUR=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$FILE" 2>/dev/null \
        | xargs printf "%.1f")
  RES=$(ffprobe -v quiet -select_streams v:0 \
        -show_entries stream=width,height -of csv=s=x:p=0 "$FILE" 2>/dev/null)

  info "[$((VIDS_DONE + 1))/${#HERO_FILES[@]}]  $NAME  (${RES}, ${DUR}s, $(human "$IN_SIZE"))"

  # Warn about duration — hero loops should be 8–15 seconds
  if (( $(echo "$DUR > 15" | bc -l 2>/dev/null || echo 0) )); then
    warn "  Video is ${DUR}s — ideal hero loop is 8–15s."
    warn "  Trim tip: ffmpeg -i '$FILE' -ss 0 -t 12 -c copy trimmed.mp4"
  elif (( $(echo "$DUR < 5" | bc -l 2>/dev/null || echo 0) )); then
    warn "  Video is only ${DUR}s — may feel too short. Ideal: 8–15s."
  fi

  WEBM="$OUT_DIR/videos/hero/${BASE}.webm"
  MP4="$OUT_DIR/videos/hero/${BASE}.mp4"
  POSTER_JPG="/tmp/opt_poster_${BASE}.jpg"
  POSTER_AVIF="$OUT_DIR/videos/hero/${BASE}-poster.avif"

  # Encode WebM (VP9) — primary format, 40% smaller than MP4
  # -b:v 0 -crf = constant quality mode (best for web, predictable file size)
  # -an = strip audio (hero video is always silent)
  info "  Encoding WebM (VP9, CRF $HERO_CRF_WEBM)..."
  ffmpeg -i "$FILE" \
    -vf "scale=${HERO_MAX_W}:-2" \
    -c:v libvpx-vp9 -b:v 0 -crf "$HERO_CRF_WEBM" \
    -an -deadline good -cpu-used 2 \
    "$WEBM" -y -loglevel quiet
  log "  → ${WEBM}  ($(human "$(fsize "$WEBM")"))"

  # Encode MP4 (H.264) — Safari fallback
  # -preset slow = better compression at same CRF (adds ~30s encoding time)
  info "  Encoding MP4 (H.264, CRF $HERO_CRF_MP4)..."
  ffmpeg -i "$FILE" \
    -vf "scale=${HERO_MAX_W}:-2" \
    -c:v libx264 -crf "$HERO_CRF_MP4" -preset slow \
    -an \
    "$MP4" -y -loglevel quiet
  log "  → ${MP4}  ($(human "$(fsize "$MP4")"))"

  # Extract poster frame → AVIF
  # The poster shows before autoplay kicks in; AVIF keeps it small
  info "  Extracting poster frame (${POSTER_SECOND}s)..."
  ffmpeg -i "$FILE" -ss "$POSTER_SECOND" -vframes 1 "$POSTER_JPG" -y -loglevel quiet
  avifenc -q 60 "$POSTER_JPG" "$POSTER_AVIF" 2>/dev/null
  log "  → ${POSTER_AVIF}  ($(human "$(fsize "$POSTER_AVIF")"))"

  TOTAL_OUT=$((TOTAL_OUT + $(fsize "$WEBM") + $(fsize "$MP4") + $(fsize "$POSTER_AVIF")))

  # Append <video> HTML tag
  cat >> "$OUT_DIR/html/video-tags.html" <<HTML

<!-- Hero video: ${BASE} -->
<video
  autoplay muted loop playsinline
  preload="none"
  poster="videos/hero/${BASE}-poster.avif"
  aria-hidden="true">
  <source src="videos/hero/${BASE}.webm" type="video/webm">
  <source src="videos/hero/${BASE}.mp4"  type="video/mp4">
</video>
HTML

  log "  <video> tag appended → output/html/video-tags.html"
  VIDS_DONE=$((VIDS_DONE + 1))
  log "  ✅ Done"
done

# ══════════════════════════════════════════════════════════════════════════════
# PART 3 — SCROLL-SCRUB VIDEOS → FRAME SEQUENCE
# ══════════════════════════════════════════════════════════════════════════════
section "Processing Scroll-Scrub Videos  →  AVIF Frame Sequence"

for FILE in "${SCRUB_FILES[@]}"; do
  divider
  NAME=$(basename "$FILE")
  BASE="${NAME%.*}"

  IN_SIZE=$(fsize "$FILE")
  TOTAL_IN=$((TOTAL_IN + IN_SIZE))

  DUR=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$FILE" 2>/dev/null \
        | xargs printf "%.1f")
  RES=$(ffprobe -v quiet -select_streams v:0 \
        -show_entries stream=width,height -of csv=s=x:p=0 "$FILE" 2>/dev/null)

  info "Scrub: $NAME  (${RES}, ${DUR}s, $(human "$IN_SIZE"))"
  info "  Extracting $SCRUB_FRAMES frames at 1280px..."

  FRAMES_DIR="$OUT_DIR/videos/scrub/frames/${BASE}"
  mkdir -p "$FRAMES_DIR"

  # fps = desired frames / actual duration → evenly spaced across entire clip
  # scale=1280:-2 → width 1280, height auto-rounded to even number (required by codec)
  FPS=$(echo "scale=6; $SCRUB_FRAMES / $DUR" | bc 2>/dev/null || echo "20")
  ffmpeg -i "$FILE" \
    -vf "scale=1280:-2,fps=${FPS}" \
    -frames:v "$SCRUB_FRAMES" \
    "$FRAMES_DIR/%04d.png" \
    -y -loglevel quiet

  ACTUAL=$(find "$FRAMES_DIR" -name "*.png" 2>/dev/null | wc -l | tr -d ' ')
  info "  Extracted $ACTUAL frames. Converting each to AVIF..."

  FRAME_BYTES=0
  COUNT=0
  for PNG in "$FRAMES_DIR"/*.png; do
    AVIF_FRAME="${PNG%.png}.avif"
    avifenc -q "$PHOTO_AVIF_Q" "$PNG" "$AVIF_FRAME" 2>/dev/null
    rm "$PNG"
    SZ=$(fsize "$AVIF_FRAME")
    FRAME_BYTES=$((FRAME_BYTES + SZ))
    TOTAL_OUT=$((TOTAL_OUT + SZ))
    COUNT=$((COUNT + 1))
    # Print progress every 30 frames
    (( COUNT % 30 == 0 || COUNT == ACTUAL )) && \
      info "  Progress: $COUNT/$ACTUAL frames  ($(human "$FRAME_BYTES") so far)"
  done

  log "  → $FRAMES_DIR/  ($ACTUAL frames, $(human "$FRAME_BYTES") total)"

  # Append JS scroll-scrub code
  cat >> "$OUT_DIR/html/scrub-js.html" <<JS

<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- Scroll-scrub JS for: ${BASE}                                          -->
<!-- Paste the <canvas> in your HTML, and the <script> block before </body>-->
<!-- ═══════════════════════════════════════════════════════════════════════ -->

<!-- 1. Add this canvas where your scroll-scrub video used to be: -->
<canvas id="scrub-canvas-${BASE}" width="1280" height="720"
  style="width:100%;height:100%;object-fit:cover;display:block;"></canvas>

<!-- 2. Add this <script> block at the bottom of your page: -->
<script>
(function () {
  'use strict';

  const section = document.getElementById('scroll-video');   // your section id
  const canvas  = document.getElementById('scrub-canvas-${BASE}');
  if (!section || !canvas) return;

  const ctx    = canvas.getContext('2d');
  const TOTAL  = ${ACTUAL};
  const BASE   = 'videos/scrub/frames/${BASE}/';
  const pad    = (n) => String(n + 1).padStart(4, '0');

  // Preload all frames before user starts scrolling
  const frames = Array.from({ length: TOTAL }, (_, i) => {
    const img = new Image();
    img.src   = BASE + pad(i) + '.avif';
    return img;
  });

  let loaded = 0;
  frames.forEach((img) => img.addEventListener('load', () => {
    loaded++;
    // Draw first frame as soon as it lands
    if (loaded === 1) ctx.drawImage(frames[0], 0, 0, canvas.width, canvas.height);
  }));

  // Map scroll progress 0→1 to frame index 0→(TOTAL-1)
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate(self) {
      const idx = Math.min(TOTAL - 1, Math.round(self.progress * (TOTAL - 1)));
      if (frames[idx] && frames[idx].complete) {
        ctx.drawImage(frames[idx], 0, 0, canvas.width, canvas.height);
      }
    },
  });
})();
</script>
JS

  log "  JS snippet appended → output/html/scrub-js.html"
  log "  ✅ Done: $NAME"
done

# ══════════════════════════════════════════════════════════════════════════════
# FINAL SUMMARY REPORT
# ══════════════════════════════════════════════════════════════════════════════
section "Done — Summary Report"

SAVINGS=0
(( TOTAL_IN > 0 )) && SAVINGS=$(echo "scale=0; (($TOTAL_IN - $TOTAL_OUT) * 100) / $TOTAL_IN" | bc 2>/dev/null || echo "?")

REPORT="
════════════════════════════════════════════════════════
  optimize-media.sh  —  Optimization Report
════════════════════════════════════════════════════════

  Images processed   : $IMGS_DONE
  Videos processed   : $VIDS_DONE

  Total input size   : $(human "$TOTAL_IN")
  Total output size  : $(human "$TOTAL_OUT")
  Estimated savings  : ~${SAVINGS}%

  Output structure:
    output/images/avif/          → AVIF at 4 widths per photo
    output/images/webp/          → WebP at 4 widths per photo
    output/images/jpg/           → JPG fallback at 4 widths
    output/videos/hero/          → .webm + .mp4 + poster
    output/videos/scrub/frames/  → AVIF frame sequence

  Ready-to-paste HTML:
    output/html/picture-tags.html   <picture> tags for every image
    output/html/video-tags.html     <video> tags for hero videos
    output/html/scrub-js.html       <canvas> + JS for scroll-scrub

  Next steps:
  ① cp -r output/images/ your-project/images/
  ② cp -r output/videos/ your-project/videos/
  ③ Open output/html/*.html — copy each tag into index.html
  ④ Visually check 2–3 images at full zoom for any artifacts
  ⑤ Run Lighthouse → Performance score should be 90+

════════════════════════════════════════════════════════
"

echo -e "$REPORT"
echo "$REPORT" > "$OUT_DIR/report.txt"

log "Full report saved → $OUT_DIR/report.txt"
echo ""
