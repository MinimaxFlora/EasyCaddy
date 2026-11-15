#!/usr/bin/env bash
# Build a .deb for a custom Caddy binary by reusing the upstream .deb package
# as a template. This keeps upstream's systemd units, maintainer scripts,
# conffiles, Caddyfile, man pages and bash completion intact, then applies the
# fixes needed to satisfy Debian Policy / lintian.
#
# Usage: make-deb.sh <caddy-binary> <upstream-tag> <upstream-asset-suffix> <output-dir>
#   make-deb.sh dist/caddy v2.11.9 linux_amd64 dist
set -euo pipefail

BIN="${1:?caddy binary path is required}"
TAG="${2:?upstream tag is required (e.g. v2.11.9)}"
ASSET="${3:?upstream asset suffix is required (e.g. linux_amd64)}"
OUT_DIR="${4:-dist}"

VERSION="${TAG#v}"
# Keep the exact upstream version. The install script uses --reinstall to force
# our build over an already-installed official package of the same version.
PKG_VERSION="${VERSION}"
REPO_URL="${REPO_URL:-https://github.com/${GITHUB_REPOSITORY:-MinimaxFlora/EasyCaddy}}"
DEB_URL="https://github.com/caddyserver/caddy/releases/download/${TAG}/caddy_${VERSION}_${ASSET}.deb"
BUILD_DATE="$(LC_ALL=C date -u '+%a, %d %b %Y %H:%M:%S +0000')"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

log() { printf '[make-deb] %s\n' "$*"; }

if [ ! -f "$BIN" ]; then
  echo "error: binary not found: $BIN" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
OUT_DIR="$(cd "$OUT_DIR" && pwd)"

log "downloading upstream package: $DEB_URL"
if ! curl -fL --retry 3 --retry-delay 2 -o "$WORK/upstream.deb" "$DEB_URL"; then
  echo "error: upstream .deb not available for $ASSET at $TAG." >&2
  echo "error: the build workflow relies on official Caddy .deb files as packaging templates." >&2
  exit 1
fi

DEB_ARCH="$(dpkg-deb -f "$WORK/upstream.deb" Architecture)"
log "upstream package architecture: $DEB_ARCH"

dpkg-deb -R "$WORK/upstream.deb" "$WORK/root"
rm -rf "$WORK/root/DEBIAN"
dpkg-deb -e "$WORK/upstream.deb" "$WORK/root/DEBIAN"
ROOT="$WORK/root"

install -m 0755 "$BIN" "$ROOT/usr/bin/caddy"

# --- Debian Policy fixes -----------------------------------------------------
# 1. /lib is a compatibility symlink on merged-/usr systems; install units into
#    /usr/lib/systemd/system instead (lintian: aliased-location).
if [ -d "$ROOT/lib/systemd/system" ]; then
  mkdir -p "$ROOT/usr/lib/systemd/system"
  cp -a "$ROOT/lib/systemd/system/." "$ROOT/usr/lib/systemd/system/"
  rm -rf "$ROOT/lib"
fi

# 2. /etc/bash_completion.d is obsolete. Move the completion to the modern
#    location; this also removes the "file in /etc not marked conffile" error.
if [ -f "$ROOT/etc/bash_completion.d/caddy" ]; then
  mkdir -p "$ROOT/usr/share/bash-completion/completions"
  mv "$ROOT/etc/bash_completion.d/caddy" "$ROOT/usr/share/bash-completion/completions/caddy"
  rmdir "$ROOT/etc/bash_completion.d" 2>/dev/null || true
fi

# 3. Regenerate manpages with deterministic gzip (-9n) to avoid the
#    timestamped-gzip and poor-compression tags inherited from the template.
if [ -d "$ROOT/usr/share/man" ]; then
  while IFS= read -r -d '' page; do
    tmp="$(mktemp)"
    gzip -dc "$page" > "$tmp"
    gzip -9n -c "$tmp" > "$page"
    rm -f "$tmp"
  done < <(find "$ROOT/usr/share/man" -type f -name '*.gz' -print0)
fi

# 4. `chown -R` in maintainer scripts is flagged as a recursive privilege
#    change. The directory is created by this script, so chown the dir only.
if [ -f "$ROOT/DEBIAN/postinst" ]; then
  sed -i 's|chown -R caddy:caddy /var/log/caddy|chown caddy:caddy /var/log/caddy|' "$ROOT/DEBIAN/postinst"
fi

# 5. Add the copyright and changelog files required by Debian Policy.
DOC_DIR="$ROOT/usr/share/doc/caddy"
mkdir -p "$DOC_DIR"
cat > "$DOC_DIR/copyright" <<EOF
Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/
Upstream-Name: caddy
Source: https://github.com/caddyserver/caddy

Files: *
Copyright: 2015-2026 Matthew Holt and The Caddy Authors
License: Apache-2.0
 On Debian systems, the complete text of the Apache License 2.0 can be found
 in /usr/share/common-licenses/Apache-2.0.

Files: debian/*
Copyright: ${YEAR:-$(date -u +%Y)} EasyCaddy contributors
License: Apache-2.0
 This package is an unofficial rebuild of Caddy with additional third-party
 modules. It is not produced or endorsed by the Caddy project.
 On Debian systems, the complete text of the Apache License 2.0 can be found
 in /usr/share/common-licenses/Apache-2.0.
EOF

cat > "$WORK/changelog" <<EOF
caddy (${PKG_VERSION}) unstable; urgency=medium

  * Unofficial EasyCaddy rebuild of upstream Caddy ${TAG}.
  * Includes additional third-party modules for DNS providers, rate limiting,
    security, layer 4 proxying, dynamic DNS, WebDAV, caching, GeoIP2 and
    Cloudflare client IP handling.

 -- EasyCaddy <easycaddy@users.noreply.github.com>  ${BUILD_DATE}
EOF
gzip -9n -c "$WORK/changelog" > "$DOC_DIR/changelog.gz"

# 6. Lintian overrides for properties that are inherent to this package.
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

# Replace the one-line synopsis and add the extended description required by
# Debian Policy (lintian: description-starts-with-package-name,
# extended-description-is-empty, synopsis-too-long).
python3 - "$CONTROL" <<'PY'
import sys

path = sys.argv[1]
with open(path, encoding="utf-8") as fh:
    lines = fh.read().splitlines()

out = []
skip_continuation = False
for line in lines:
    if line.startswith("Description:"):
        out.append("Description: powerful, enterprise-ready web server with automatic HTTPS")
        out.append(" Caddy is a general-purpose web server that serves static files and")
        out.append(" reverse proxies. It obtains and renews TLS certificates automatically")
        out.append(" and is written in Go.")
        out.append(" .")
        out.append(" This is an unofficial EasyCaddy build with additional modules for")
        out.append(" Cloudflare, Alibaba Cloud and Tencent Cloud DNS, rate limiting,")
        out.append(" security, layer 4 proxying, dynamic DNS, WebDAV, HTTP caching,")
        out.append(" GeoIP2 and Cloudflare real client IP handling.")
        skip_continuation = True
    elif skip_continuation and line.startswith(" "):
        # Drop the upstream continuation lines of the old Description field.
        continue
    else:
        skip_continuation = False
        out.append(line)

with open(path, "w", encoding="utf-8") as fh:
    fh.write("\n".join(out) + "\n")
PY

# --- sizes and checksums -----------------------------------------------------
INSTALLED_SIZE="$(du -sk --exclude=DEBIAN "$ROOT" | cut -f1)"
if grep -q '^Installed-Size:' "$CONTROL"; then
  sed -i "s/^Installed-Size: .*/Installed-Size: ${INSTALLED_SIZE}/" "$CONTROL"
else
  sed -i "/^Priority:/a Installed-Size: ${INSTALLED_SIZE}" "$CONTROL"
fi

# Recompute md5sums: the main binary changed and paths were moved.
(
  cd "$ROOT"
  find . -type f ! -path './DEBIAN/*' -printf '%P\n' | LC_ALL=C sort | xargs -r md5sum > DEBIAN/md5sums
)

# Use the upstream asset suffix in the filename. armv6 and armv7 both report
# Architecture: armhf, so naming by $ASSET keeps the two files distinct.
OUT_DEB="$OUT_DIR/caddy_${VERSION}_${ASSET}.deb"
dpkg-deb --build --root-owner-group "$ROOT" "$OUT_DEB" >/dev/null

log "built $OUT_DEB"
log "  package version: ${PKG_VERSION}"
log "  architecture:    ${DEB_ARCH}"
log "  size:            $(stat -c%s "$OUT_DEB") bytes"

# Print control fields for the CI log.
dpkg-deb -f "$OUT_DEB" Package Version Architecture Installed-Size
