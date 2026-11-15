#!/usr/bin/env bash
# Build a .deb for a custom Caddy binary by reusing the upstream .deb package
# as a template. This keeps upstream's systemd units, maintainer scripts,
# conffiles, Caddyfile, man pages and bash completion intact.
#
# Usage: make-deb.sh <caddy-binary> <upstream-tag> <upstream-asset-suffix> <output-dir>
#   make-deb.sh dist/caddy v2.11.9 linux_amd64 dist
set -euo pipefail

BIN="${1:?caddy binary path is required}"
TAG="${2:?upstream tag is required (e.g. v2.11.9)}"
ASSET="${3:?upstream asset suffix is required (e.g. linux_amd64)}"
OUT_DIR="${4:-dist}"

VERSION="${TAG#v}"
EASY_VERSION="${VERSION}-1+easycaddy"
REPO_URL="${REPO_URL:-https://github.com/${GITHUB_REPOSITORY:-MinimaxFlora/EasyCaddy}}"
DEB_URL="https://github.com/caddyserver/caddy/releases/download/${TAG}/caddy_${VERSION}_${ASSET}.deb"

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

install -m 0755 "$BIN" "$WORK/root/usr/bin/caddy"

CONTROL="$WORK/root/DEBIAN/control"
sed -i "s/^Version: .*/Version: ${EASY_VERSION}/" "$CONTROL"
sed -i "s|^Maintainer: .*|Maintainer: EasyCaddy <easycaddy@users.noreply.github.com>|" "$CONTROL"
sed -i "s|^Homepage: .*|Homepage: ${REPO_URL}|" "$CONTROL"

INSTALLED_SIZE="$(du -sk --exclude=DEBIAN "$WORK/root" | cut -f1)"
if grep -q '^Installed-Size:' "$CONTROL"; then
  sed -i "s/^Installed-Size: .*/Installed-Size: ${INSTALLED_SIZE}/" "$CONTROL"
else
  sed -i "/^Priority:/a Installed-Size: ${INSTALLED_SIZE}" "$CONTROL"
fi

# Recompute md5sums: the main binary changed and is much larger than upstream's.
(
  cd "$WORK/root"
  find . -type f ! -path './DEBIAN/*' -printf '%P\n' | LC_ALL=C sort | xargs -r md5sum > DEBIAN/md5sums
)

OUT_DEB="$OUT_DIR/caddy_${VERSION}_${DEB_ARCH}.deb"
dpkg-deb --build --root-owner-group "$WORK/root" "$OUT_DEB" >/dev/null

log "built $OUT_DEB"
log "  package version: ${EASY_VERSION}"
log "  architecture:    ${DEB_ARCH}"
log "  size:            $(stat -c%s "$OUT_DEB") bytes"

# Print control fields for the CI log.
dpkg-deb -f "$OUT_DEB" Package Version Architecture Installed-Size
