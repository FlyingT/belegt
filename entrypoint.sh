#!/bin/sh
# Generate env-config.js
echo "window._env_ = {" > /usr/share/nginx/html/env-config.js
echo "  ADMIN_USER: \"${ADMIN_USER:-admin}\"," >> /usr/share/nginx/html/env-config.js
echo "  ADMIN_PASSWORD: \"${ADMIN_PASSWORD:-belegt}\"" >> /usr/share/nginx/html/env-config.js
echo "};" >> /usr/share/nginx/html/env-config.js

# Execute the CMD (nginx)
exec "$@"
