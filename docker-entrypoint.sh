#!/bin/bash
set -e

Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
XVFB_PID=$!

sleep 2

DISPLAY=:99 fluxbox &
FLUXBOX_PID=$!

sleep 1

cleanup() {
  kill $XVFB_PID $FLUXBOX_PID 2>/dev/null || true
}

trap cleanup EXIT INT TERM

exec node dist/main.js

