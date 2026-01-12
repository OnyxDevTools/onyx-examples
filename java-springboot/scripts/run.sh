#!/usr/bin/env bash
set -euo pipefail

# Determine repo root (scripts directory sits under it)
ROOT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

get_major_version() {
  local java_bin="$1"
  "$java_bin" -version 2>&1 | head -n1 | sed -E 's/.*"([0-9]+).*/\1/'
}

find_java_home_21() {
  if command -v brew >/dev/null 2>&1; then
    local brew_java_home
    brew_java_home="$(brew --prefix openjdk@21 2>/dev/null)/libexec/openjdk.jdk/Contents/Home"
    if [[ -x "${brew_java_home}/bin/java" ]]; then
      echo "${brew_java_home}"
      return 0
    fi
  fi
  return 1
}

# Ensure Java 21+ is available; prefer Homebrew openjdk@21 if current JAVA_HOME is absent or too old.
ensure_java() {
  local chosen_home=""

  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
    local current_major
    current_major="$(get_major_version "${JAVA_HOME}/bin/java")"
    if [[ -n "${current_major}" && "${current_major}" -ge 21 ]]; then
      chosen_home="${JAVA_HOME}"
    fi
  fi

  if [[ -z "${chosen_home}" ]]; then
    local brew_home
    brew_home="$(find_java_home_21 || true)"
    if [[ -n "${brew_home}" ]]; then
      chosen_home="${brew_home}"
    fi
  fi

  if [[ -z "${chosen_home}" && -x "$(command -v java 2>/dev/null)" ]]; then
    local path_java_major
    path_java_major="$(get_major_version "$(command -v java)")"
    if [[ -n "${path_java_major}" && "${path_java_major}" -ge 21 ]]; then
      chosen_home="$(cd -- "$(dirname "$(dirname "$(command -v java)")")" && pwd)"
    fi
  fi

  if [[ -z "${chosen_home}" ]]; then
    echo "Java 21+ not found. Install with 'brew install openjdk@21' or set JAVA_HOME to a 21+ JDK." >&2
    exit 1
  fi

  export JAVA_HOME="${chosen_home}"
  export PATH="${JAVA_HOME}/bin:${PATH}"

  local final_major
  final_major="$(get_major_version "${JAVA_HOME}/bin/java")"
  if [[ -z "${final_major}" || "${final_major}" -lt 21 ]]; then
    echo "JAVA_HOME (${JAVA_HOME}) points to Java ${final_major:-unknown}; Java 21+ is required." >&2
    exit 1
  fi
}

load_onyx_env() {
  local config_file="${ROOT_DIR}/src/main/resources/onyx-database.json"
  if [[ ! -f "${config_file}" ]]; then
    echo "Onyx config file not found at ${config_file}" >&2
    exit 1
  fi

  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required to parse ${config_file}. Install jq and retry." >&2
    exit 1
  fi

  local base_url db_id api_key api_secret
  base_url="$(jq -r '.baseUrl // empty' "${config_file}")"
  db_id="$(jq -r '.databaseId // empty' "${config_file}")"
  api_key="$(jq -r '.apiKey // empty' "${config_file}")"
  api_secret="$(jq -r '.apiSecret // empty' "${config_file}")"

  [[ -z "${base_url}" || -z "${db_id}" || -z "${api_key}" || -z "${api_secret}" ]] && {
    echo "Missing required Onyx fields in ${config_file} (need baseUrl, databaseId, apiKey, apiSecret)." >&2
    exit 1
  }

  export ONYX_BASE_URL="${ONYX_BASE_URL:-${base_url}}"
  export ONYX_DATABASE_ID="${ONYX_DATABASE_ID:-${db_id}}"
  export ONYX_API_KEY="${ONYX_API_KEY:-${api_key}}"
  export ONYX_API_SECRET="${ONYX_API_SECRET:-${api_secret}}"
}

run_app() {
  cd "${ROOT_DIR}"

  load_onyx_env

  local mvn_cmd="mvn"
  [[ -x "./mvnw" ]] && mvn_cmd="./mvnw"

  "${mvn_cmd}" -B clean package -DskipTests

  "${mvn_cmd}" spring-boot:run \
    -Dspring-boot.run.jvmArguments='-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 --add-opens=java.base/java.time=ALL-UNNAMED --add-opens=java.base/java.lang=ALL-UNNAMED'
}

ensure_java
run_app
