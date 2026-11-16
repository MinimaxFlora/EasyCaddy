#!/usr/bin/env bash
# EasyCaddy installer.
#
#   curl -fsSL https://caddy.tatalvpai.vip/install.sh | sudo bash
#   curl -fsSL https://caddy.tatalvpai.vip/install.sh | sudo bash -s -- --dry-run
#
# The script is idempotent, backs up files it modifies, verifies the repository
# signing key fingerprint before trusting the repository, and distinguishes
# "package installed" from "service active".
set -Eeuo pipefail

BASE_URL="${EASYCADDY_BASE_URL:-https://caddy.tatalvpai.vip}"
EXPECTED_FINGERPRINT="${EASYCADDY_KEY_FINGERPRINT:-5D071390261FC2DEBE577C7B129DC81626FF07EE}"
KEYRING="/usr/share/keyrings/easycaddy-archive-keyring.gpg"
LIST_FILE="/etc/apt/sources.list.d/easycaddy.list"
PREF_FILE="/etc/apt/preferences.d/easycaddy"
BACKUP_ROOT="/var/backups/easycaddy"
STATE_DIR="/var/lib/easycaddy"
DRY_RUN=0
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

log() { printf '\033[1;34m[easycaddy]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[easycaddy] warning:\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31m[easycaddy] error:\033[0m %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Usage: install.sh [--dry-run] [--help]

  --dry-run   Run all checks and print intended changes without modifying the system.
  --help      Show this help.

Environment:
  EASYCADDY_BASE_URL          Override the repository base URL.
  EASYCADDY_KEY_FINGERPRINT   Override the trusted signing fingerprint (not recommended).
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --help|-h) usage; exit 0 ;;
    *) die "unknown argument: $1" ;;
  esac
  shift
done

[ "$(id -u)" -eq 0 ] || die "run this installer as root (use sudo)"
[ -r /etc/os-release ] || die "cannot read /etc/os-release; unsupported system"
. /etc/os-release
command -v apt-get >/dev/null 2>&1 || die "apt-get is required (Debian/Ubuntu only)"
command -v dpkg >/dev/null 2>&1 || die "dpkg is required (Debian/Ubuntu only)"

ARCH="$(dpkg --print-architecture 2>/dev/null || true)"
[ -n "$ARCH" ] || die "cannot determine the dpkg architecture"
log "system: ${PRETTY_NAME:-unknown} (${ARCH})"

HOST="$(printf '%s' "$BASE_URL" | sed -E 's|^https?://([^/]+).*|\1|')"
[ -n "$HOST" ] || die "cannot parse host from EASYCADDY_BASE_URL"
[ "$EXPECTED_FINGERPRINT" = "5D071390261FC2DEBE577C7B129DC81626FF07EE" ] \
  || warn "using a non-default signing fingerprint; confirm it independently"

install_dependencies() {
  local missing=()
  for cmd in curl gpg; do command -v "$cmd" >/dev/null 2>&1 || missing+=("$cmd"); done
  if [ "${#missing[@]}" -gt 0 ] || [ ! -d /etc/ssl/certs ]; then
    log "installing prerequisites"
    if [ "$DRY_RUN" -eq 1 ]; then
      log "dry-run: would run apt-get update and install ca-certificates curl gnupg"
    else
      apt-get update -qq
      DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ca-certificates curl gnupg
    fi
  fi
}

verify_key() {
  local key_file="$1"
  local actual
  actual="$(gpg --batch --show-keys --with-colons "$key_file" \
    | awk -F: '/^fpr:/{print toupper($10); exit}')"
  [ -n "$actual" ] || die "could not read a fingerprint from the downloaded key"
  [ "$actual" = "${EXPECTED_FINGERPRINT^^}" ] \
    || die "signing key mismatch: expected ${EXPECTED_FINGERPRINT^^}, got $actual"
  log "signing key fingerprint verified: $actual"
}

install_dependencies

log "downloading and verifying repository key"
curl -fsSL --retry 3 --retry-delay 2 "$BASE_URL/public.key" -o "$TMP_DIR/public.key" \
  || die "failed to download $BASE_URL/public.key"
verify_key "$TMP_DIR/public.key"

log "checking that $ARCH is present in the APT index"
curl -fsSL --retry 3 --retry-delay 2 "$BASE_URL/Packages" -o "$TMP_DIR/Packages" \
  || die "failed to download the APT Packages index"
if ! grep -qx "Architecture: $ARCH" "$TMP_DIR/Packages"; then
  if [ "$ARCH" = "armhf" ]; then
    warn "armhf is served by the ARMv7 build; ARMv6 is Release-only and cannot be selected safely through APT"
  else
    die "architecture $ARCH is not present in the EasyCaddy APT index"
  fi
fi

if [ -r "$STATE_DIR/install.env" ]; then
  # Reuse the first installation's backup set so re-running the installer does not
  # replace the original source files with an already-modified copy.
  # shellcheck disable=SC1090,SC1091
  . "$STATE_DIR/install.env"
fi
BACKUP_DIR="${backup_dir:-$BACKUP_ROOT/$(date -u +%Y%m%dT%H%M%SZ)}"
MANIFEST="$BACKUP_DIR/manifest.tsv"
declare -A BACKED_UP=()

backup_file() {
  local path="$1"
  [ -e "$path" ] || return 0
  [ -n "${BACKED_UP[$path]:-}" ] && return 0
  if [ "$DRY_RUN" -eq 1 ]; then
    log "dry-run: would back up $path"
    BACKED_UP[$path]=1
    return 0
  fi
  mkdir -p "$BACKUP_DIR"
  local name
  name="$(printf '%s' "$path" | sed 's|/|_|g')"
  if [ -e "$BACKUP_DIR/$name" ]; then
    BACKED_UP[$path]=1
    log "keeping existing backup for $path"
    return 0
  fi
  cp -a "$path" "$BACKUP_DIR/$name"
  printf '%s\t%s\n' "$path" "$BACKUP_DIR/$name" >> "$MANIFEST"
  BACKED_UP[$path]=1
  log "backed up $path"
}

disable_official_sources() {
  local file changed
  while IFS= read -r -d '' file; do
    case "$file" in
      "$LIST_FILE") continue ;;
    esac
    if grep -Eq '(dl\.)?cloudsmith\.io/public/caddy|caddyserver\.com' "$file" 2>/dev/null; then
      backup_file "$file"
      if [ "${file##*.}" = "sources" ]; then
        changed="$TMP_DIR/$(basename "$file").new"
        awk '
          BEGIN { RS=""; ORS="\n\n" }
          {
            if ($0 ~ /(dl\.)?cloudsmith\.io\/public\/caddy|caddyserver\.com/ && $0 ~ /(^|\n)URIs:/) {
              if ($0 ~ /(^|\n)Enabled:/) sub(/(^|\n)Enabled:[^\n]*/, "\nEnabled: no")
              else $0 = $0 "\nEnabled: no"
            }
            print
          }
        ' "$file" > "$changed"
        if [ "$DRY_RUN" -eq 1 ]; then
          log "dry-run: would disable official Caddy source in $file"
        else
          cat "$changed" > "$file"
          log "disabled official Caddy source in $file"
        fi
      else
        changed="$TMP_DIR/$(basename "$file").new"
        awk '
          /^[[:space:]]*#/ { print; next }
          /(dl\.)?cloudsmith\.io\/public\/caddy|caddyserver\.com/ {
            print "# disabled by EasyCaddy: " $0
            next
          }
          { print }
        ' "$file" > "$changed"
        if [ "$DRY_RUN" -eq 1 ]; then
          log "dry-run: would comment out official Caddy source in $file"
        else
          cat "$changed" > "$file"
          log "disabled official Caddy source in $file"
        fi
      fi
    fi
  done < <(find /etc/apt/sources.list /etc/apt/sources.list.d -maxdepth 1 -type f \
    \( -name '*.list' -o -name '*.sources' \) -print0 2>/dev/null)
}

disable_official_sources

log "installing EasyCaddy repository configuration"
backup_file "$KEYRING"
backup_file "$LIST_FILE"
backup_file "$PREF_FILE"
if [ "$DRY_RUN" -eq 1 ]; then
  log "dry-run: would write $KEYRING, $LIST_FILE and $PREF_FILE"
else
  install -d -m 0755 "$(dirname "$KEYRING")" "$(dirname "$LIST_FILE")" "$(dirname "$PREF_FILE")"
  gpg --batch --yes --dearmor -o "$KEYRING" "$TMP_DIR/public.key"
  chmod 0644 "$KEYRING"
  printf 'deb [signed-by=%s] %s/ ./\n' "$KEYRING" "$BASE_URL" > "$LIST_FILE"
  chmod 0644 "$LIST_FILE"
  printf 'Package: caddy\nPin: origin "%s"\nPin-Priority: 1001\n' "$HOST" > "$PREF_FILE"
  chmod 0644 "$PREF_FILE"
fi

if [ "$DRY_RUN" -eq 1 ]; then
  log "dry-run complete; no packages were installed and no files were changed"
  exit 0
fi

mkdir -p "$STATE_DIR" "$BACKUP_DIR"
touch "$MANIFEST"
ln -sfn "$BACKUP_DIR" "$BACKUP_ROOT/latest"
printf 'installed_at=%s\nbase_url=%s\nfingerprint=%s\nbackup_dir=%s\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$BASE_URL" "${EXPECTED_FINGERPRINT^^}" "$BACKUP_DIR" \
  > "$STATE_DIR/install.env"

log "updating package index"
apt-get update -qq

policy_output="$(apt-cache policy caddy)"
candidate="$(printf '%s\n' "$policy_output" | awk '/Candidate:/{print $2}')"
if [ -z "$candidate" ] || [ "$candidate" = "(none)" ]; then
  printf '%s\n' "$policy_output" >&2
  die "apt has no caddy candidate after adding the repository"
fi
case "$policy_output" in
  *"$HOST"*) ;;
  *)
    printf '%s\n' "$policy_output" >&2
    die "the EasyCaddy repository is not listed by apt-cache policy caddy"
    ;;
esac
log "selected caddy candidate: $candidate"

log "installing caddy"
if dpkg -s caddy >/dev/null 2>&1; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y --reinstall caddy
else
  DEBIAN_FRONTEND=noninteractive apt-get install -y caddy
fi

INSTALLED_VERSION="$(dpkg-query -W -f='${Version}' caddy 2>/dev/null || true)"
[ -n "$INSTALLED_VERSION" ] || die "the caddy package is not installed after apt-get"

log "verifying binary and modules"
caddy version || warn "caddy version failed"
missing_modules=0
modules_output="$(caddy list-modules 2>/dev/null || true)"
for module in \
  dns.providers.cloudflare dns.providers.alidns dns.providers.tencentcloud \
  http.handlers.rate_limit security layer4 dynamic_dns \
  http.handlers.webdav http.handlers.cache geoip2 http.ip_sources.cloudflare; do
  if ! grep -qx "$module" <<< "$modules_output"; then
    warn "module missing: $module"
    missing_modules=$((missing_modules + 1))
  fi
done
[ "$missing_modules" -eq 0 ] || die "$missing_modules expected module(s) are missing"

CONFIG_RESULT="not run"
if [ -f /etc/caddy/Caddyfile ]; then
  if caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1; then
    CONFIG_RESULT="valid"
  else
    CONFIG_RESULT="invalid"
    warn "caddy validate failed for /etc/caddy/Caddyfile"
  fi
fi

SERVICE_RESULT="not checked"
if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ]; then
  systemctl daemon-reload >/dev/null 2>&1 || true
  systemctl enable caddy >/dev/null 2>&1 || true
  systemctl start caddy >/dev/null 2>&1 || true
  if systemctl is-active --quiet caddy; then
    SERVICE_RESULT="active"
  else
    SERVICE_RESULT="inactive"
  fi
fi

cat <<EOF

EasyCaddy installation summary
  package:            caddy ${INSTALLED_VERSION}
  repository:         ${BASE_URL}
  signing fingerprint: ${EXPECTED_FINGERPRINT^^}
  modules:            $([ "$missing_modules" -eq 0 ] && echo "all expected modules present" || echo "$missing_modules missing")
  config validation:  ${CONFIG_RESULT}
  systemd service:    ${SERVICE_RESULT}
  config file:        /etc/caddy/Caddyfile
  logs:               journalctl -u caddy --no-pager -n 100

EOF

[ "$CONFIG_RESULT" = "invalid" ] && die "the installed Caddy configuration is invalid"
if [ "$SERVICE_RESULT" = "inactive" ]; then
  die "caddy is installed but the systemd service did not become active; inspect journalctl -u caddy"
fi

log "done. Edit /etc/caddy/Caddyfile, then run: systemctl reload caddy"
