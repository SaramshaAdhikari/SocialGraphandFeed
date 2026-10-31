#!/bin/sh
set -e
# TEMPORARY ONE-TIME SEED - to be reverted after the production demo database is seeded.
# Backend runs on internal port 4000; the production server listens on $PORT
# (the platform-assigned public port) and serves the frontend + proxies /api.
PUBLIC_PORT="${PORT:-3000}"
export NODE_ENV=production
export PORT=4000
export HOST=127.0.0.1
export ALLOW_ATLAS_SEED=true
# Seed the production demo database on startup, using Render's environment variables.
# A seed failure must not stop the app, so do not let it abort the script.
npm run seed --workspace=@socialgraph/backend -- --allow-atlas-seed || echo "Temporary startup seed failed, continuing without seed"
node packages/backend/dist/index.js &
BACKEND_PID=$!
export PORT="${PUBLIC_PORT}"
export BACKEND_URL="http://127.0.0.1:4000"
# Wait briefly for the backend to start, then serve the frontend in foreground.
sleep 3
exec node production-server.mjs
