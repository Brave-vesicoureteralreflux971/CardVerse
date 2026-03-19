#!/bin/sh
set -eu

should_run() {
  value=$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]')
  case "$value" in
    1|true|yes|on)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

if should_run "${RUN_DB_PUSH:-true}"; then
  npm run prisma:db:push
fi

if should_run "${RUN_DB_SEED:-true}"; then
  npm run prisma:seed
fi

npm run start &
api_pid=$!
caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &
caddy_pid=$!

cleanup() {
  kill "$api_pid" 2>/dev/null || true
  kill "$caddy_pid" 2>/dev/null || true
}

trap cleanup INT TERM

while kill -0 "$api_pid" 2>/dev/null && kill -0 "$caddy_pid" 2>/dev/null; do
  sleep 2
done

cleanup
wait "$api_pid" 2>/dev/null || true
wait "$caddy_pid" 2>/dev/null || true
exit 1
