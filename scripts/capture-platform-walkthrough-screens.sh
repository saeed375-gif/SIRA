#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
capture_directory="${1:-/tmp/sira-platform-walkthrough}"
server_log="/tmp/sira-platform-walkthrough-vite.log"

mkdir -p "$capture_directory"
base_url="http://127.0.0.1:3000"
server_pid=""

if ! curl --silent --fail "$base_url/" >/dev/null; then
  (
    cd "$project_root"
    npm run dev:web >"$server_log" 2>&1
  ) &
  server_pid=$!

  for _ in {1..30}; do
    if curl --silent --fail "$base_url/" >/dev/null; then
      break
    fi
    sleep 0.25
  done

  if ! curl --silent --fail "$base_url/" >/dev/null; then
    echo "Vite did not become ready. See $server_log" >&2
    exit 1
  fi
fi

cleanup() {
  if [ -n "$server_pid" ]; then
    kill "$server_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT

capture() {
  local number="$1"
  local route="$2"
  brave-browser \
    --headless=new \
    --no-sandbox \
    --disable-gpu \
    --hide-scrollbars \
    --window-size=1920,1080 \
    --virtual-time-budget=3500 \
    --screenshot="$capture_directory/$number.png" \
    "$base_url$route" \
    >/dev/null 2>&1
}

capture 01 "/"
capture 02 "/explore"
capture 03 "/explore?category=history"
capture 04 "/place/bab-al-amoud"
capture 05 "/place/khan-al-zait"
capture 06 "/routes"
capture 07 "/routes/journey-in-heart-of-jerusalem"
capture 08 "/explore?category=life"
capture 09 "/moment/morning-bread"
capture 10 "/games"
capture 11 "/search"
capture 12 "/about"

printf 'Captured walkthrough screens in %s\n' "$capture_directory"
