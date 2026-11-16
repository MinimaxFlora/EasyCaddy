#!/usr/bin/env bash
# EasyCaddy read-only diagnosis.
#
#   curl -fsSL https://caddy.tatalvpai.vip/diagnose.sh | sudo bash
#
# This script never modifies files, packages, services or configuration. It only
# prints the state useful for a support request.
set -Eeuo pipefail

section() { printf '\n=== %s ===\n' "$*"; }
have() { command -v "$1" >/dev/null 2>&1; }

section "system"
if [ -r /etc/os-release ]; then
  . /etc/os-release
  echo "distribution: ${PRETTY_NAME:-unknown}"
fi
echo "kernel: $(uname -srm)"
echo "dpkg architecture: $(dpkg --print-architecture 2>/dev/null || echo unknown)"

section "package"
if dpkg -s caddy >/dev/null 2>&1; then
  dpkg-query -W -f='package: ${Package}\nversion: ${Version}\narchitecture: ${Architecture}\nstatus: ${Status}\n' caddy
  echo "source files:"
  dpkg-query -L caddy 2>/dev/null | grep -E '^/etc/apt|usr/lib/systemd/system' || true
else
  echo "caddy package is not installed"
fi

section "binary"
if have caddy; then
  caddy version || true
  modules_output="$(caddy list-modules 2>/dev/null || true)"
  echo "modules: $(printf '%s\n' "$modules_output" | wc -l)"
  missing=0
  for module in \
    dns.providers.cloudflare dns.providers.alidns dns.providers.tencentcloud \
    http.handlers.rate_limit security layer4 dynamic_dns \
    http.handlers.webdav http.handlers.cache geoip2 http.ip_sources.cloudflare; do
    if ! grep -qx "$module" <<< "$modules_output"; then
      echo "missing module: $module"
      missing=$((missing + 1))
    fi
  done
  echo "missing expected modules: $missing"
else
  echo "caddy binary not found in PATH"
fi

section "APT repository"
apt-cache policy caddy 2>/dev/null || true
echo "sources:"
for file in /etc/apt/sources.list.d/easycaddy.list /etc/apt/sources.list.d/caddy-stable.list; do
  [ -e "$file" ] && { echo "--- $file"; cat "$file"; }
done
[ -e /etc/apt/preferences.d/easycaddy ] && { echo "--- pin"; cat /etc/apt/preferences.d/easycaddy; }
[ -e /usr/share/keyrings/easycaddy-archive-keyring.gpg ] && \
  ls -l /usr/share/keyrings/easycaddy-archive-keyring.gpg

section "configuration"
if have caddy && [ -f /etc/caddy/Caddyfile ]; then
  if caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1; then
    echo "Caddyfile: valid"
  else
    echo "Caddyfile: INVALID (run: caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile)"
  fi
elif [ -f /etc/caddy/Caddyfile ]; then
  echo "Caddyfile exists but caddy is not installed"
else
  echo "no /etc/caddy/Caddyfile"
fi

section "service"
if have systemctl && [ -d /run/systemd/system ]; then
  systemctl is-enabled caddy 2>/dev/null || true
  systemctl is-active caddy 2>/dev/null || true
  systemctl status caddy --no-pager -l 2>/dev/null | head -20 || true
else
  echo "systemd is not available in this environment"
fi

section "recent logs"
if have journalctl; then
  journalctl -u caddy --no-pager -n 30 2>/dev/null || echo "journal not readable; run as root for logs"
else
  echo "journalctl not available"
fi

section "state"
[ -r /var/lib/easycaddy/install.env ] && sed -n '1,20p' /var/lib/easycaddy/install.env || echo "no EasyCaddy install state"
echo "diagnosis complete; no changes were made"
