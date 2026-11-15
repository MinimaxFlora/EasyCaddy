#!/usr/bin/env bash
# Build a .deb for a custom Caddy binary by reusing the upstream .deb package
# as a template, then applying Debian Policy fixes.
#
# Usage: make-deb.sh <caddy-binary> <upstream-tag> <upstream-asset-suffix> <output-dir>
#   make-deb.sh dist/caddy v2.11.9 linux_amd64 dist
set -Eeuo pipefail

BIN="${1:?caddy binary path is required}"
TAG="${2:?upstream tag is required (e.g. v2.11.9)}"
ASSET="${3:?upstream asset suffix is required (e.g. linux_amd64)}"
OUT_DIR="${4:-dist}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOCK_FILE="${PLUGINS_LOCK:-$REPO_ROOT/config/plugins.lock.json}"

[[ "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "error: invalid tag '$TAG'" >&2; exit 1; }
[[ "$ASSET" =~ ^linux_[a-z0-9]+$ ]] || { echo "error: invalid asset suffix '$ASSET'" >&2; exit 1; }
[ -f "$BIN" ] || { echo "error: binary not found: $BIN" >&2; exit 1; }
[ -f "$LOCK_FILE" ] || { echo "error: plugin lock not found: $LOCK_FILE" >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "error: curl is required" >&2; exit 1; }
command -v dpkg-deb >/dev/null 2>&1 || { echo "error: dpkg-deb is required" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "error: python3 is required" >&2; exit 1; }

VERSION="${TAG#v}"
PKG_VERSION="${VERSION}"
REPO_URL="${REPO_URL:-https://github.com/${GITHUB_REPOSITORY:-MinimaxFlora/EasyCaddy}}"
BUILD_DATE="$(LC_ALL=C date -u '+%a, %d %b %Y %H:%M:%S +0000')"
DEB_URL="https://github.com/caddyserver/caddy/releases/download/${TAG}/caddy_${VERSION}_${ASSET}.deb"
CHECKSUM_URL="https://github.com/caddyserver/caddy/releases/download/${TAG}/caddy_${VERSION}_checksums.txt"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
log() { printf '[make-deb] %s\n' "$*"; }

mkdir -p "$OUT_DIR"
OUT_DIR="$(cd "$OUT_DIR" && pwd)"

log "downloading upstream package and checksums"
checksum_name="$(basename "$DEB_URL")"
DEB_FILE="$WORK/$checksum_name"
curl -fL --retry 3 --retry-delay 2 -o "$DEB_FILE" "$DEB_URL"
curl -fL --retry 3 --retry-delay 2 -o "$WORK/checksums.txt" "$CHECKSUM_URL"

grep -F "  ${checksum_name}" "$WORK/checksums.txt" > "$WORK/selected.sha512" \
  || { echo "error: upstream checksum for $checksum_name not found" >&2; exit 1; }
[ -s "$WORK/selected.sha512" ] || { echo "error: empty upstream checksum" >&2; exit 1; }
(
  cd "$WORK"
  sha512sum -c selected.sha512
)

DEB_ARCH="$(dpkg-deb -f "$DEB_FILE" Architecture)"
log "upstream package architecture: $DEB_ARCH"

dpkg-deb -R "$DEB_FILE" "$WORK/root"
ROOT="$WORK/root"
for path in \
  "$ROOT/DEBIAN/control" \
  "$ROOT/DEBIAN/postinst" \
  "$ROOT/usr/bin/caddy" \
  "$ROOT/etc/caddy/Caddyfile"; do
  [ -e "$path" ] || { echo "error: unexpected upstream package layout, missing $path" >&2; exit 1; }
done
if [ ! -d "$ROOT/lib/systemd/system" ] && [ ! -d "$ROOT/usr/lib/systemd/system" ]; then
  echo "error: upstream package has no systemd units" >&2
  exit 1
fi

install -m 0755 "$BIN" "$ROOT/usr/bin/caddy"

# --- Debian Policy fixes -----------------------------------------------------
if [ -d "$ROOT/lib/systemd/system" ]; then
  mkdir -p "$ROOT/usr/lib/systemd/system"
  cp -a "$ROOT/lib/systemd/system/." "$ROOT/usr/lib/systemd/system/"
  rm -rf "${ROOT:?}/lib"
fi

if [ -f "$ROOT/etc/bash_completion.d/caddy" ]; then
  mkdir -p "$ROOT/usr/share/bash-completion/completions"
  mv "$ROOT/etc/bash_completion.d/caddy" "$ROOT/usr/share/bash-completion/completions/caddy"
  rmdir "$ROOT/etc/bash_completion.d" 2>/dev/null || true
fi

if [ -d "$ROOT/usr/share/man" ]; then
  while IFS= read -r -d '' page; do
    tmp="$(mktemp)"
    gzip -dc "$page" > "$tmp"
    gzip -9n -c "$tmp" > "$page"
    rm -f "$tmp"
  done < <(find "$ROOT/usr/share/man" -type f -name '*.gz' -print0)
fi

grep -q 'chown -R caddy:caddy /var/log/caddy' "$ROOT/DEBIAN/postinst" \
  || { echo "error: expected chown pattern not found in postinst" >&2; exit 1; }
sed -i 's|chown -R caddy:caddy /var/log/caddy|chown caddy:caddy /var/log/caddy|' "$ROOT/DEBIAN/postinst"

DOC_DIR="$ROOT/usr/share/doc/caddy"
mkdir -p "$DOC_DIR"
cat > "$DOC_DIR/copyright" <<EOF
Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/
Upstream-Name: caddy
Source: https://github.com/caddyserver/caddy
Comment: This is an unofficial EasyCaddy rebuild, based on upstream Caddy ${TAG}.
 The binary additionally links the third-party Go modules listed below. Each
 module remains under its own upstream license; see the listed source
 repositories and the published SBOM for the complete dependency graph.

Files: *
Copyright: 2015-2026 Matthew Holt and The Caddy Authors
License: Apache-2.0
 On Debian systems, the complete text of the Apache License 2.0 can be found
 in /usr/share/common-licenses/Apache-2.0.

Files: debian/*
Copyright: 2026 EasyCaddy contributors
License: Apache-2.0
 On Debian systems, the complete text of the Apache License 2.0 can be found
 in /usr/share/common-licenses/Apache-2.0.
EOF
python3 - "$LOCK_FILE" "$DOC_DIR/copyright" <<'PY'
import json, sys
lock_path, out_path = sys.argv[1], sys.argv[2]
with open(lock_path, encoding="utf-8") as fh:
    lock = json.load(fh)
lines = [
    "",
    "Comment: Bundled third-party modules:",
]
for plugin in lock.get("plugins", []):
    lines.append(f" {plugin['module']} {plugin['version']} ({plugin['license']}) - {plugin['upstream']}")
with open(out_path, "a", encoding="utf-8") as fh:
    fh.write("\n".join(lines) + "\n")
PY

cat > "$WORK/changelog" <<EOF
caddy (${PKG_VERSION}) unstable; urgency=medium

  * Unofficial EasyCaddy rebuild of upstream Caddy ${TAG}.
  * Plugins are locked in config/plugins.lock.json and verified at build time.

 -- EasyCaddy <easycaddy@users.noreply.github.com>  ${BUILD_DATE}
EOF
gzip -9n -c "$WORK/changelog" > "$DOC_DIR/changelog.gz"

install -m 0644 "$LOCK_FILE" "$DOC_DIR/plugins.lock.json"
if command -v go >/dev/null 2>&1; then
  go version -m "$BIN" > "$DOC_DIR/build-info.txt" 2>/dev/null || true
  [ -f "$DOC_DIR/build-info.txt" ] && chmod 0644 "$DOC_DIR/build-info.txt"
fi

mkdir -p "$ROOT/usr/share/lintian/overrides"
cat > "$ROOT/usr/share/lintian/overrides/caddy" <<'EOF'
# Go binaries built with CGO_ENABLED=0 are statically linked by design.
caddy: statically-linked-binary
# Upstream's welcome page is served by the default configuration.
caddy: package-contains-documentation-outside-usr-share-doc [usr/share/caddy/index.html]
# Generated upstream; the whatis entry is intentional.
caddy: bad-whatis-entry [usr/share/man/man8/caddy.8.gz]
EOF

# --- control metadata --------------------------------------------------------
CONTROL="$ROOT/DEBIAN/control"
sed -i "s/^Version: .*/Version: ${PKG_VERSION}/" "$CONTROL"
sed -i "s|^Maintainer: .*|Maintainer: EasyCaddy <easycaddy@users.noreply.github.com>|" "$CONTROL"
sed -i "s|^Homepage: .*|Homepage: ${REPO_URL}|" "$CONTROL"
if grep -q '^Section:[[:space:]]*$' "$CONTROL"; then
  sed -i "s/^Section:.*/Section: httpd/" "$CONTROL"
fi
grep -q "^Version: ${PKG_VERSION}$" "$CONTROL" || { echo "error: Version update failed" >&2; exit 1; }
grep -q "^Maintainer: EasyCaddy" "$CONTROL" || { echo "error: Maintainer update failed" >&2; exit 1; }
grep -q "^Homepage: " "$CONTROL" || { echo "error: Homepage update failed" >&2; exit 1; }

python3 - "$CONTROL" <<'PY'
import sys
path = sys.argv[1]
with open(path, encoding="utf-8") as fh:
    lines = fh.read().splitlines()
out = []
skip_continuation = False
for line in lines:
    if line.startswith("Description:"):
        out.extend([
            "Description: powerful, enterprise-ready web server with automatic HTTPS",
            " Caddy is a general-purpose web server that serves static files and",
            " reverse proxies. It obtains and renews TLS certificates automatically",
            " and is written in Go.",
            " .",
            " This is an unofficial EasyCaddy build with additional modules for",
            " Cloudflare, Alibaba Cloud and Tencent Cloud DNS, rate limiting,",
            " security, layer 4 proxying, dynamic DNS, WebDAV, HTTP caching,",
            " GeoIP2 and Cloudflare real client IP handling.",
        ])
        skip_continuation = True
    elif skip_continuation and line.startswith(" "):
        continue
    else:
        skip_continuation = False
        out.append(line)
with open(path, "w", encoding="utf-8") as fh:
    fh.write("\n".join(out) + "\n")
PY

INSTALLED_SIZE="$(du -sk --exclude=DEBIAN "$ROOT" | cut -f1)"
if grep -q '^Installed-Size:' "$CONTROL"; then
  sed -i "s/^Installed-Size: .*/Installed-Size: ${INSTALLED_SIZE}/" "$CONTROL"
else
  sed -i "/^Priority:/a Installed-Size: ${INSTALLED_SIZE}" "$CONTROL"
fi

(
  cd "$ROOT"
  find . -type f ! -path './DEBIAN/*' -printf '%P\n' | LC_ALL=C sort | xargs -r md5sum > DEBIAN/md5sums
)

OUT_DEB="$OUT_DIR/caddy_${VERSION}_${ASSET}.deb"
dpkg-deb --build --root-owner-group "$ROOT" "$OUT_DEB" >/dev/null

for field in Package Version Architecture Maintainer Homepage; do
  value="$(dpkg-deb -f "$OUT_DEB" "$field")"
  [ -n "$value" ] || { echo "error: missing control field: $field" >&2; exit 1; }
done
[ "$(dpkg-deb -f "$OUT_DEB" Package)" = "caddy" ] || { echo "error: unexpected Package field" >&2; exit 1; }
[ "$(dpkg-deb -f "$OUT_DEB" Version)" = "$PKG_VERSION" ] || { echo "error: unexpected Version field" >&2; exit 1; }
[ "$(dpkg-deb -f "$OUT_DEB" Architecture)" = "$DEB_ARCH" ] || { echo "error: unexpected Architecture field" >&2; exit 1; }

log "built $OUT_DEB"
log "  package version: ${PKG_VERSION}"
log "  architecture:    ${DEB_ARCH}"
log "  size:            $(stat -c%s "$OUT_DEB") bytes"
dpkg-deb -f "$OUT_DEB" Package Version Architecture Installed-Size
