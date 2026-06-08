#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_URL="http://${BACKEND_HOST}:${BACKEND_PORT}"

BACKEND_PID=""
FRONTEND_PID=""
CLEANED_UP=0

log() {
  printf '[dev] %s\n' "$*"
}

cleanup() {
  if [[ "${CLEANED_UP}" -eq 1 ]]; then
    return
  fi
  CLEANED_UP=1
  log "stopping services..."
  if [[ -n "${FRONTEND_PID}" ]]; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi
  if [[ -n "${BACKEND_PID}" ]]; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

require_command() {
  local command_name="$1"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    log "missing command: ${command_name}"
    exit 1
  fi
}

port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -tln "sport = :${port}" 2>/dev/null | tail -n +2 | grep -q .
    return
  fi
  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1
    return
  fi
  return 1
}

pick_backend_python() {
  local venv_python="${ROOT_DIR}/agent/venv/bin/python"
  if [[ -x "${venv_python}" ]] && "${venv_python}" -c "import fastapi, uvicorn" >/dev/null 2>&1; then
    printf '%s\n' "${venv_python}"
    return
  fi

  if python3 -c "import fastapi, uvicorn" >/dev/null 2>&1; then
    printf '%s\n' "python3"
    return
  fi

  log "no Python runtime with fastapi and uvicorn found"
  log "install backend dependencies first, for example:"
  log "  cd ${ROOT_DIR}/agent && python3 -m pip install -r requirements.txt"
  exit 1
}

require_command yarn

if port_in_use "${BACKEND_PORT}"; then
  log "backend port ${BACKEND_PORT} is already in use"
  log "stop the existing process or run with BACKEND_PORT=<port> scripts/dev.sh"
  exit 1
fi

if port_in_use "${FRONTEND_PORT}"; then
  log "frontend port ${FRONTEND_PORT} is already in use"
  log "stop the existing process or run with FRONTEND_PORT=<port> scripts/dev.sh"
  exit 1
fi

BACKEND_PYTHON="$(pick_backend_python)"

log "starting backend on ${BACKEND_URL}"
(
  cd "${ROOT_DIR}/agent"
  PYTHONPATH=. "${BACKEND_PYTHON}" -m uvicorn api:app --host "${BACKEND_HOST}" --port "${BACKEND_PORT}"
) &
BACKEND_PID="$!"

log "starting frontend on http://127.0.0.1:${FRONTEND_PORT}"
(
  cd "${ROOT_DIR}/frontend"
  SENTINEL_BACKEND_URL="${BACKEND_URL}" yarn workspace @se-2/nextjs dev --hostname 127.0.0.1 --port "${FRONTEND_PORT}"
) &
FRONTEND_PID="$!"

log "ready when both services finish booting"
log "frontend: http://127.0.0.1:${FRONTEND_PORT}"
log "backend:  ${BACKEND_URL}/health"
log "press Ctrl+C to stop both services"

wait -n "${BACKEND_PID}" "${FRONTEND_PID}"
