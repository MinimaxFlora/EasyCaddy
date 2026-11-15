#!/usr/bin/env bash
# Assemble a signed, flat APT repository for GitHub Pages.
#
# Usage: make-apt-repo.sh <tag> <site-dir> [keep-versions]
#   make-apt-repo.sh v2.11.9 site 3
#
# Requires: gh (GH_TOKEN), apt-ftparchive, gpg with an imported secret key.
set -euo pipefail

TAG="${1:?upstream tag is required (e.g. v2.11.9)}"
SITE="${2:?output site directory is required}"
KEEP="${3:-3}"
REPO="${GITHUB_REPOSITORY:-MinimaxFlora/EasyCaddy}"
PAGES_BASE_URL="${PAGES_BASE_URL:-https://caddy.tatalvpai.vip}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

log() { printf '[apt-repo] %s\n' "$*"; }

if ! [[ "$KEEP" =~ ^[0-9]+$ ]] || [ "$KEEP" -lt 1 ]; then
  echo "error: keep-versions must be a positive integer, got '$KEEP'" >&2
  exit 1
fi

rm -rf "$SITE"
mkdir -p "$SITE/pool"

# --- collect .deb files: current release first, then the previous KEEP-1 ---
log "downloading .deb assets from release $TAG"
gh release download "$TAG" --repo "$REPO" --pattern '*.deb' --dir "$SITE/pool" --clobber

mapfile -t older < <(
  gh release list --repo "$REPO" --limit 50 --json tagName --jq '.[].tagName' \
    | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' \
    | grep -Fvx "$TAG" \
    | head -n "$((KEEP - 1))" || true
)
if [ "${#older[@]}" -gt 0 ]; then
  for old_tag in "${older[@]}"; do
    log "downloading .deb assets from previous release $old_tag"
    gh release download "$old_tag" --repo "$REPO" --pattern '*.deb' --dir "$SITE/pool" --clobber
  done
else
  log "no previous releases to include"
fi

# Drop duplicate filenames defensively (same version should not be duplicated).
find "$SITE/pool" -type f -name '*.deb' -printf '%f\n' | sort | uniq -d | while read -r dup; do
  log "warning: duplicate package filename $dup"
done

# Debian's armhf architecture cannot distinguish ARMv6 from ARMv7. Both upstream
# .deb files declare Architecture: armhf, so they cannot coexist in one package
# index. Keep the ARMv7 build in APT (the common case) and leave the ARMv6 build
# as a GitHub Release download.
find "$SITE/pool" -type f -name '*_linux_armv6.deb' -print -delete | while read -r f; do
  log "excluded from APT index (available in Releases): $(basename "$f")"
done

# --- generate Packages ---
log "generating Packages"
(
  cd "$SITE"
  apt-ftparchive \
    -o APT::FTPArchive::Packages::SHA256=true \
    -o APT::FTPArchive::Packages::SHA1=true \
    -o APT::FTPArchive::Packages::MD5=true \
    packages pool > Packages
  gzip -9 -k -f Packages
)

# --- generate and sign Release ---
# Write Release by hand instead of using `apt-ftparchive release .`: the latter
# would also hash every .deb under pool/, which is slow and unnecessary. apt only
# needs checksums for the index files it downloads.
log "generating Release"
(
  cd "$SITE"
  packages_size="$(stat -c%s Packages)"
  packages_md5="$(md5sum Packages | cut -d' ' -f1)"
  packages_sha1="$(sha1sum Packages | cut -d' ' -f1)"
  packages_sha256="$(sha256sum Packages | cut -d' ' -f1)"
  gz_size="$(stat -c%s Packages.gz)"
  gz_md5="$(md5sum Packages.gz | cut -d' ' -f1)"
  gz_sha1="$(sha1sum Packages.gz | cut -d' ' -f1)"
  gz_sha256="$(sha256sum Packages.gz | cut -d' ' -f1)"

  {
    echo "Origin: EasyCaddy"
    echo "Label: EasyCaddy"
    echo "Suite: stable"
    echo "Codename: stable"
    echo "Date: $(date -Ru)"
    echo "Architectures: amd64 arm64 armhf armel ppc64el riscv64 s390x"
    echo "Components: main"
    echo "Description: EasyCaddy - Caddy built with extra plugins"
    echo "MD5Sum:"
    echo " ${packages_md5} ${packages_size} Packages"
    echo " ${gz_md5} ${gz_size} Packages.gz"
    echo "SHA1:"
    echo " ${packages_sha1} ${packages_size} Packages"
    echo " ${gz_sha1} ${gz_size} Packages.gz"
    echo "SHA256:"
    echo " ${packages_sha256} ${packages_size} Packages"
    echo " ${gz_sha256} ${gz_size} Packages.gz"
  } > Release
)

KEY_ID="$(gpg --batch --list-secret-keys --with-colons | awk -F: '/^sec:/{print $5; exit}')"
if [ -z "$KEY_ID" ]; then
  echo "error: no GPG secret key found in the keyring" >&2
  exit 1
fi
log "signing with key $KEY_ID"

gpg --batch --yes --pinentry-mode loopback \
  --local-user "$KEY_ID" --clearsign -o "$SITE/InRelease" "$SITE/Release"
gpg --batch --yes --pinentry-mode loopback \
  --local-user "$KEY_ID" --detach-sign --armor -o "$SITE/Release.gpg" "$SITE/Release"

gpg --batch --armor --export "$KEY_ID" > "$SITE/public.key"
gpg --batch --export "$KEY_ID" > "$SITE/easycaddy-archive-keyring.gpg"

# --- static site content ---
VERSION="${TAG#v}"
DATE_UTC="$(date -u +'%Y-%m-%d %H:%M UTC')"
sed -e "s/@VERSION@/${VERSION}/g" \
    -e "s/@DATE@/${DATE_UTC//\//\\/}/g" \
    -e "s|@PAGES_BASE_URL@|${PAGES_BASE_URL}|g" \
    "$REPO_ROOT/pages/index.html" > "$SITE/index.html"
install -m 0755 "$REPO_ROOT/pages/install.sh" "$SITE/install.sh"
install -m 0644 "$REPO_ROOT/pages/i18n.js" "$SITE/i18n.js"
install -m 0644 "$REPO_ROOT/assets/caddy.svg" "$SITE/caddy.svg"

# --- summary for the CI log ---
log "repository contents:"
( cd "$SITE" && ls -lh )
log "package index:"
grep -E '^(Package|Version|Architecture|Filename):' "$SITE/Packages" || true

# Sanity checks that catch the most common signing/index mistakes before deploy.
test -s "$SITE/Packages"        || { echo "error: Packages is empty" >&2; exit 1; }
test -s "$SITE/InRelease"       || { echo "error: InRelease is missing" >&2; exit 1; }
test -s "$SITE/Release.gpg"     || { echo "error: Release.gpg is missing" >&2; exit 1; }
test -s "$SITE/public.key"      || { echo "error: public.key is missing" >&2; exit 1; }
test -s "$SITE/easycaddy-archive-keyring.gpg" || { echo "error: keyring is missing" >&2; exit 1; }
test -s "$SITE/i18n.js"         || { echo "error: i18n.js is missing" >&2; exit 1; }
test -s "$SITE/caddy.svg"       || { echo "error: caddy.svg is missing" >&2; exit 1; }

if ! grep -q "^Filename: pool/.*\.deb$" "$SITE/Packages"; then
  echo "error: Packages does not reference any pool/*.deb files" >&2
  exit 1
fi

log "done: APT repository prepared in $SITE"
