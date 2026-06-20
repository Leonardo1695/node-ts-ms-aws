#!/usr/bin/env bash
set -euo pipefail

max_attempts=60
sleep_seconds=5

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempt=1

  until curl -sf "$url" >/dev/null; then
    if [ "$attempt" -ge "$max_attempts" ]; then
      echo "Timed out waiting for ${label} at ${url}" >&2
      exit 1
    fi

    echo "Waiting for ${label} (${attempt}/${max_attempts})..."
    attempt=$((attempt + 1))
    sleep "$sleep_seconds"
  done

  echo "${label} is ready."
}

wait_for_url "http://localhost:3003/health/live" "api-service"
wait_for_url "http://localhost:4200" "web-dashboard"
