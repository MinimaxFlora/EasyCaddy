#!/usr/bin/env bash
# EasyCaddy uninstaller.
#
#   curl -fsSL https://caddy.tatalvpai.vip/uninstall.sh | sudo bash
#   curl -fsSL https://caddy.tatalvpai.vip/uninstall.sh | sudo bash -s -- --dry-run
#
# Default behaviour:
#   - remove the caddy package (apt remove, not purge)
#   - remove the EasyCaddy APT source, pin and keyring
#   - restore files that install.sh backed up
#   - preserve /etc/caddy, /var/lib/caddy, certificates, logs and site data
#
# Purge is opt-in and requires both --purge and --yes.
set -Eeuo pipefail

KEYRING="/usr/share/keyrings/easycaddy-archive-keyring.gpg"
LIST_FILE="/etc/apt/sources.list.d/easycaddy.list"
PREF_FILE="/etc/apt/preferences.d/easycaddy"
BACKUP_ROOT="/var/backups/easycaddy"
BACKUP_DIR="$BACKUP_ROOT/latest"
MANIFEST="$BACKUP_DIR/manifest.tsv"
DRY_RUN=0
KEEP_PACKAGE=0
PURGE=0
ASSUME_YES=0

log() { printf '\033[1;34m[easycaddy]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[easycaddy] warning:\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31m[easycaddy] error:\033[0m %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Usage: uninstall.sh [options]

  --dry-run        Print intended actions without changing the system.
  --keep-package   Remove only the EasyCaddy APT configuration, keep caddy installed.
  --purge          Purge the caddy package and its configuration. Requires --yes.
  --yes            Confirm --purge without an interactive prompt.
  --help           Show this help.

Without --purge, user configuration under /etc/caddy, /var/lib/caddy, certificates,
logs and site data are preserved.
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --keep-package) KEEP_PACKAGE=1 ;;
    --purge) PURGE=1 ;;
    --yes) ASSUME_YES=1 ;;
    --help|-h) usage; exit 0 ;;
    *) die "unknown argument: $1" ;;
  esac
  shift
done

[ "$(id -u)" -eq 0 ] || die "run this uninstaller as root (use sudo)"
command -v apt-get >/dev/null 2>&1 || die "apt-get is required"

if [ "$PURGE" -eq 1 ] && [ "$ASSUME_YES" -ne 1 ]; then
  die "--purge removes /etc/caddy and user data; re-run with --purge --yes if that is intended"
fi
if [ "$PURGE" -eq 1 ] && [ "$KEEP_PACKAGE" -eq 1 ]; then
  die "--purge and --keep-package cannot be used together"
fi

run() {
  if [ "$DRY_RUN" -eq 1 ]; then
    log "dry-run: $*"
  else
    "$@"
  fi
}

if [ "$KEEP_PACKAGE" -eq 1 ]; then
  PACKAGE_ACTION="keep caddy"
  PACKAGE_SUMMARY="kept"
elif [ "$PURGE" -eq 1 ]; then
  PACKAGE_ACTION="apt purge caddy"
  PACKAGE_SUMMARY="purged"
else
  PACKAGE_ACTION="apt remove caddy"
  PACKAGE_SUMMARY="removed"
fi

log "uninstalling EasyCaddy"
log "package action: $PACKAGE_ACTION"
if [ "$PURGE" -eq 1 ]; then
  log "user data: will be removed by purge"
else
  log "user data: preserved (/etc/caddy, /var/lib/caddy, certificates, logs)"
fi

if [ -f "$MANIFEST" ]; then
  log "restoring files backed up by install.sh from $BACKUP_DIR"
  CONFLICT_DIR="$BACKUP_ROOT/conflicts/$(date -u +%Y%m%dT%H%M%SZ)"
  while IFS=$'\t' read -r original backup; do
    [ -n "$original" ] || continue
    [ -e "$backup" ] || { warn "backup is missing, skipping: $backup"; continue; }
    if [ "$DRY_RUN" -eq 1 ]; then
      log "dry-run: restore $original from $backup"
      continue
    fi
    mkdir -p "$(dirname "$original")"
    if [ -e "$original" ]; then
      mkdir -p "$CONFLICT_DIR"
      conflict="$CONFLICT_DIR/$(printf '%s' "$original" | sed 's|/|_|g')"
      mv "$original" "$conflict"
      log "moved current $original to $conflict"
    fi
    cp -a "$backup" "$original"
    log "restored $original"
  done < "$MANIFEST"
else
  warn "no install backup manifest found at $MANIFEST; source restore is skipped"
fi

for path in "$LIST_FILE" "$PREF_FILE" "$KEYRING"; do
  if [ -e "$path" ]; then
    if [ "$DRY_RUN" -eq 1 ]; then
      log "dry-run: would remove $path"
    else
      rm -f "$path"
      log "removed $path"
    fi
  fi
done

if [ "$KEEP_PACKAGE" -ne 1 ] && dpkg -s caddy >/dev/null 2>&1; then
  if [ "$PURGE" -eq 1 ]; then
    run env DEBIAN_FRONTEND=noninteractive apt-get purge -y caddy
  else
    run env DEBIAN_FRONTEND=noninteractive apt-get remove -y caddy
  fi
else
  log "caddy package left installed"
fi

if [ "$DRY_RUN" -ne 1 ]; then
  apt-get update -qq || warn "apt-get update failed after removing the EasyCaddy source"
fi

cat <<EOF

EasyCaddy uninstall summary
  package:          ${PACKAGE_SUMMARY}
  APT source:       removed
  APT pin:          removed
  signing keyring:  removed
  backups:          preserved under $BACKUP_ROOT
  user data:        $([ "$PURGE" -eq 1 ] && echo "purged" || echo "preserved")
  restore conflicts: preserved under $BACKUP_ROOT/conflicts

EOF
