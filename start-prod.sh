#!/bin/sh
set -e
# Backend runs on internal port 4000; the production server listens on $PORT
# (the platform-assigned public port) and serves the frontend + proxies /api.
PUBLIC_PORT="${PORT:-3000}"
export NODE_ENV=production
export PORT=4000
export HOST=127.0.0.1
node packages/backend/dist/index.js &
BACKEND_PID=$!
export PORT="${PUBLIC_PORT}"
export BACKEND_URL="http://127.0.0.1:4000"
# Wait briefly for the backend to start, then serve the frontend in foreground.
sleep 3
exec node production-server.mjs
