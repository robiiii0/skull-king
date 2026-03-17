#!/bin/bash
# Auto-update script — run via cron every 5 min
# crontab -e → */5 * * * * /opt/skull-king/update.sh >> /var/log/skull-king-update.log 2>&1

IMAGE="TONUSER/skull-king:latest"
CONTAINER="skull-king"

# Pull latest image
docker pull "$IMAGE" -q

# Compare running image ID with pulled one
RUNNING=$(docker inspect --format='{{.Image}}' "$CONTAINER" 2>/dev/null)
LATEST=$(docker inspect --format='{{.Id}}' "$IMAGE" 2>/dev/null)

if [ "$RUNNING" != "$LATEST" ]; then
  echo "[$(date)] New image detected, restarting..."
  docker stop "$CONTAINER" 2>/dev/null
  docker rm "$CONTAINER" 2>/dev/null
  docker run -d \
    --name "$CONTAINER" \
    --restart unless-stopped \
    -p 3000:3000 \
    "$IMAGE"
  # Cleanup old images
  docker image prune -f
  echo "[$(date)] Updated successfully."
else
  echo "[$(date)] Up to date."
fi
