#!/usr/bin/env bash
# EasyCaddy installer: adds the signed APT repository and installs Caddy.
#
#   curl -fsSL https://caddy.tatalvpai.vip/install.sh | sudo bash
#
# The script is idempotent and safe to re-run for upgrades.
set -euo pipefail

BASE_URL="${EASYCADDY_BASE_URL:-https://caddy.tatalvpai.vip}"
KEYRING="/usr/share/keyrings/easycaddy-archive-keyring.gpg"
LIST="/etc/apt/sources.list.d/easycaddy.list"

log() { printf '\033[1;34m[easycaddy]\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m[easycaddy] error:\033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "run this script as root (use sudo)"
command -v apt-get >/dev/null 2>&1 || die "this installer requires a Debian/Ubuntu system"

log "installing prerequisites"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ca-certificates curl gnupg

log "installing repository signing key"
curl -fsSL "$BASE_URL/public.key" | gpg --batch --yes --dearmor -o "$KEYRING"
chmod 0644 "$KEYRING"

log "adding APT source"
printf 'deb [signed-by=%s] %s/ ./\n' "$KEYRING" "$BASE_URL" > "$LIST"
chmod 0644 "$LIST"

# The official Caddy repository ships the same package name. If it is enabled,
# apt could silently prefer an official build without the extra plugins.
for f in /etc/apt/sources.list.d/caddy-stable.list /etc/apt/sources.list.d/caddy.list; do
  if [ -f "$f" ]; then
    mv "$f" "$f.disabled-by-easycaddy"
    log "disabled official Caddy source: $f (renamed to $(basename "$f").disabled-by-easycaddy)"
  fi
done

# Keep this build selected even if an official Caddy source is re-added later.
printf 'Package: caddy\nPin: origin "caddy.tatalvpai.vip"\nPin-Priority: 1001\n' \
  > /etc/apt/preferences.d/easycaddy
chmod 0644 /etc/apt/preferences.d/easycaddy

log "updating package index"
apt-get update -qq

log "installing caddy"
# Our package intentionally uses the same version as upstream. If an official
# caddy of the same version is already installed, a plain install is a no-op,
# so force a reinstall from this repository.
if dpkg -s caddy >/dev/null 2>&1; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y --reinstall caddy
else
  DEBIAN_FRONTEND=noninteractive apt-get install -y caddy
fi

log "Caddy installed:"
caddy version
log "Plugins present:"
caddy list-modules 2>/dev/null | grep -E 'dns\.providers\.(cloudflare|alidns|tencentcloud)|http\.handlers\.ratelimit|http\.handlers\.cache|http\.handlers\.webdav|http\.matchers\.ip|tls\.issuers\.acme|layer4|dynamic_dns|security|geoip2|remote_ip' || true

if command -v systemctl >/dev/null 2>&1; then
  systemctl daemon-reload || true
  systemctl enable caddy >/dev/null 2>&1 || true
  if ! systemctl is-active --quiet caddy; then
    log "starting caddy"
    systemctl start caddy || log "caddy did not start; check /etc/caddy/Caddyfile and 'journalctl -u caddy'"
  fi
fi

log "done. Edit /etc/caddy/Caddyfile, then run: systemctl reload caddy"
