#!/bin/sh
# Generate empty env-config.js (no credentials exposed)
echo "window._env_ = {};" > /usr/share/nginx/html/env-config.js

# Execute the CMD (nginx)
exec "$@"
