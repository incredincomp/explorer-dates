#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${ROOT_DIR}/logs"
NODE_BIN="${NODE_BIN:-node}"

DEFAULT_HEAP_DELTA_THRESHOLD_MB="${HEAP_DELTA_THRESHOLD_MB:-1.25}"

run_and_check() {
    local label="$1"; shift
    local threshold="${DEFAULT_HEAP_DELTA_THRESHOLD_MB}"
    if [[ $# -gt 0 ]]; then
        threshold="$1"
        shift
    fi
    echo "==> Running scenario: ${label}"
    ${NODE_BIN} --expose-gc tests/test-memory-soak.js "$@"
    local log_file
    log_file="$(ls -t "${LOG_DIR}"/memory-soak-*.json | head -1)"
    if [[ -z "${log_file}" ]]; then
        echo "❌ No log file produced for ${label}"
        exit 1
    fi
    local delta
    delta="$(jq -r '.heap.deltaMB' "${log_file}")"
    echo "   ${label} delta: ${delta} MB (${log_file})"
    awk -v d="${delta}" -v limit="${threshold}" 'BEGIN { if (d > limit) { exit 1 } }' \
        || { echo "❌ ${label} exceeded ${threshold} MB (got ${delta})"; exit 1; }
}

# Scenario: default
MEMORY_SOAK_ITERATIONS="${MEMORY_SOAK_ITERATIONS:-2000}" \
MEMORY_SOAK_DELAY_MS="${MEMORY_SOAK_DELAY_MS:-0}" \
MEMORY_SOAK_MAX_DELTA_MB="${MEMORY_SOAK_MAX_DELTA_MB:-12}" \
run_and_check "default" "${DEFAULT_HEAP_DELTA_THRESHOLD_MB}"

# Scenario: forced bypass
EXPLORER_DATES_FORCE_CACHE_BYPASS=1 \
MEMORY_SOAK_ITERATIONS="${MEMORY_SOAK_ITERATIONS:-2000}" \
MEMORY_SOAK_DELAY_MS="${MEMORY_SOAK_DELAY_MS:-0}" \
MEMORY_SOAK_MAX_DELTA_MB="${MEMORY_SOAK_MAX_DELTA_MB:-24}" \
MEMORY_SOAK_LABEL="ci-forced-bypass" \
run_and_check "forced-bypass" "${HEAP_DELTA_THRESHOLD_FORCED_BYPASS_MB:-1.40}"

# Scenario: lightweight
EXPLORER_DATES_LIGHTWEIGHT_MODE=1 \
MEMORY_SOAK_ITERATIONS="${MEMORY_SOAK_ITERATIONS:-2000}" \
MEMORY_SOAK_DELAY_MS="${MEMORY_SOAK_DELAY_MS:-0}" \
MEMORY_SOAK_MAX_DELTA_MB="${MEMORY_SOAK_MAX_DELTA_MB:-12}" \
MEMORY_SOAK_LABEL="ci-lightweight" \
run_and_check "lightweight" "${HEAP_DELTA_THRESHOLD_LIGHTWEIGHT_MB:-1.15}"

# Scenario: memory shedding
EXPLORER_DATES_MEMORY_SHEDDING=1 \
MEMORY_SOAK_ITERATIONS="${MEMORY_SOAK_ITERATIONS:-2000}" \
MEMORY_SOAK_DELAY_MS="${MEMORY_SOAK_DELAY_MS:-0}" \
MEMORY_SOAK_MAX_DELTA_MB="${MEMORY_SOAK_MAX_DELTA_MB:-12}" \
MEMORY_SOAK_LABEL="ci-shedding" \
run_and_check "memory-shedding" "${HEAP_DELTA_THRESHOLD_SHEDDING_MB:-1.15}"

echo "✅ Memory regression suite passed"
