#!/bin/sh
set -e

apk add --no-cache curl

# Write crontab using expanded env vars
cat > /etc/crontabs/root << EOF
0 8 * * * curl -s -X POST -H "Authorization: Bearer ${CRON_SECRET}" ${APP_URL}/api/cron/daily-digest
EOF

exec crond -f -l 2
