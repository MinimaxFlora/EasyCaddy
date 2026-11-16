#!/usr/bin/env bash
# Assemble a signed, flat APT repository for GitHub Pages.
#
# Usage: make-apt-repo.sh <tag> <site-dir> [keep-versions]
#
# Environment:
#   GPG_KEY_FINGERPRINT  required full fingerprint of the signing key
#   PUBLIC_KEY_FILE      committed public key (default: <repo>/public.key)
#   LOCAL_DEB_DIR        test mode: copy .deb files from this directory instead
#                        of downloading GitHub Releases
#   MATRIX_FILE          build matrix (default: <repo>/config/build-matrix.json)
#   PAGES_BASE_URL       public repository base URL
#   GITHUB_REPOSITORY    owner/repo for gh commands
set -Eeuo pipefail

TAG="${1:?upstream tag is required (e.g. v2.11.9)}"
SITE="${2:?output site directory is required}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPO="${GITHUB_REPOSITORY:-MinimaxFlora/EasyCaddy}"
PAGES_BASE_URL="${PAGES_BASE_URL:-https://caddy.tatalvpai.vip}"
MATRIX_FILE="${MATRIX_FILE:-$REPO_ROOT/config/build-matrix.json}"
PUBLIC_KEY_FILE="${PUBLIC_KEY_FILE:-}"
LOCAL_DEB_DIR="${LOCAL_DEB_DIR:-}"
GPG_KEY_FINGERPRINT="${GPG_KEY_FINGERPRINT:-}"

log() { printf '[apt-repo] %s\n' "$*"; }
die() { printf '[apt-repo] error: %s\n' "$*" >&2; exit 1; }

[[ "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "invalid tag '$TAG'"
[ -f "$MATRIX_FILE" ] || die "build matrix not found: $MATRIX_FILE"
command -v jq >/dev/null 2>&1 || die "jq is required"

KEEP="${3:-$(jq -r '.keep_versions // 3' "$MATRIX_FILE")}"
if ! [[ "$KEEP" =~ ^[0-9]+$ ]] || [ "$KEEP" -lt 1 ]; then
  die "keep-versions must be a positive integer"
fi
APT_ARCHS="$(jq -r '[.architectures[] | select(.apt) | .debarch] | unique | join(" ")' "$MATRIX_FILE")"
APT_ASSETS="$(jq -r '.architectures[] | select(.apt) | .asset' "$MATRIX_FILE")"
if [ -z "$APT_ARCHS" ] || [ -z "$APT_ASSETS" ]; then
  die "no APT architectures configured"
fi

[[ "$GPG_KEY_FINGERPRINT" =~ ^[0-9A-Fa-f]{40}$ ]] \
  || die "GPG_KEY_FINGERPRINT must be a full 40-character fingerprint"
[ -n "$PUBLIC_KEY_FILE" ] || die "PUBLIC_KEY_FILE is required (the CI job writes the GPG_PUBLIC_KEY secret to a temporary file)"
[ -f "$PUBLIC_KEY_FILE" ] || die "public key not found: $PUBLIC_KEY_FILE"

if ! gpg --batch --list-secret-keys "$GPG_KEY_FINGERPRINT" >/dev/null 2>&1; then
  die "signing key $GPG_KEY_FINGERPRINT is not present in the GPG keyring"
fi

published_fp="$(gpg --batch --show-keys --with-colons "$PUBLIC_KEY_FILE" \
  | awk -F: '/^fpr:/{print toupper($10); exit}')"
[ -n "$published_fp" ] || die "cannot read a fingerprint from $PUBLIC_KEY_FILE"
[ "$published_fp" = "${GPG_KEY_FINGERPRINT^^}" ] \
  || die "public key fingerprint $published_fp does not match expected ${GPG_KEY_FINGERPRINT^^}"

rm -rf "$SITE"
mkdir -p "$SITE/pool"

# Select the current version and the highest previous versions by SemVer, not by
# GitHub's creation order. The current tag is always included so a manual rebuild
# of an older release still produces a valid index.
if [ -n "$LOCAL_DEB_DIR" ]; then
  [ -d "$LOCAL_DEB_DIR" ] || die "LOCAL_DEB_DIR does not exist: $LOCAL_DEB_DIR"
  release_tags=("$TAG")
  log "test mode: using local packages from $LOCAL_DEB_DIR"
else
  command -v gh >/dev/null 2>&1 || die "gh is required"
  mapfile -t all_tags < <(
    gh release list --repo "$REPO" --limit 100 \
      --json tagName,isDraft,isPrerelease \
      --jq '.[] | select((.isDraft | not) and (.isPrerelease | not)) | .tagName' \
      | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' \
      | sort -Vr || true
  )
  release_tags=("$TAG")
  for candidate in "${all_tags[@]:-}"; do
    [ "$candidate" = "$TAG" ] && continue
    [ "${#release_tags[@]}" -ge "$KEEP" ] && break
    release_tags+=("$candidate")
  done
fi

for release_tag in "${release_tags[@]}"; do
  version="${release_tag#v}"
  log "collecting Debian packages for $release_tag"
  if [ -n "$LOCAL_DEB_DIR" ]; then
    cp "$LOCAL_DEB_DIR"/*.deb "$SITE/pool/"
  else
    gh release download "$release_tag" --repo "$REPO" --pattern '*.deb' \
      --dir "$SITE/pool" --clobber
  fi

  # Every APT architecture must be present; never publish a partial index.
  for asset in $APT_ASSETS; do
    package="$SITE/pool/caddy_${version}_${asset}.deb"
    [ -s "$package" ] || die "missing package for $release_tag: $(basename "$package")"
  done
done

# ARMv6 and ARMv7 both use Debian's armhf architecture. Keep ARMv6 out of the
# shared index; it remains available from the GitHub Release.
while IFS= read -r -d '' armv6; do
  rm -f -- "$armv6"
  log "excluded from APT index (available in Releases): $(basename "$armv6")"
done < <(find "$SITE/pool" -type f -name '*_linux_armv6.deb' -print0)

# Generate Packages and Packages.gz.
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

# Generate Release. No Valid-Until is emitted: a stale Pages deployment would
# otherwise make every apt client fail until the next publication.
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
    echo "Architectures: $APT_ARCHS"
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

log "signing with $GPG_KEY_FINGERPRINT"
gpg --batch --yes --pinentry-mode loopback \
  --local-user "$GPG_KEY_FINGERPRINT" --clearsign -o "$SITE/InRelease" "$SITE/Release"
gpg --batch --yes --pinentry-mode loopback \
  --local-user "$GPG_KEY_FINGERPRINT" --detach-sign --armor -o "$SITE/Release.gpg" "$SITE/Release"
gpg --batch --armor --export "$GPG_KEY_FINGERPRINT" > "$SITE/public.key"
gpg --batch --export "$GPG_KEY_FINGERPRINT" > "$SITE/easycaddy-archive-keyring.gpg"

# Verify what will be published before the Pages job uploads it.
gpg --batch --verify "$SITE/InRelease" >/dev/null 2>&1 \
  || die "InRelease signature verification failed"
gpg --batch --verify "$SITE/Release.gpg" "$SITE/Release" >/dev/null 2>&1 \
  || die "Release.gpg signature verification failed"

# Static site content.
VERSION="${TAG#v}"
DATE_UTC="$(date -u +'%Y-%m-%d %H:%M UTC')"
sed -e "s/@VERSION@/${VERSION}/g" \
    -e "s/@DATE@/${DATE_UTC//\//\\/}/g" \
    -e "s|@PAGES_BASE_URL@|${PAGES_BASE_URL}|g" \
    "$REPO_ROOT/pages/index.html" > "$SITE/index.html"
install -m 0755 "$REPO_ROOT/pages/install.sh" "$SITE/install.sh"
install -m 0755 "$REPO_ROOT/pages/uninstall.sh" "$SITE/uninstall.sh"
install -d "$SITE/assets"
cp -R "$REPO_ROOT/pages/assets/." "$SITE/assets/"
find "$SITE/assets" -type d -exec chmod 0755 {} +
find "$SITE/assets" -type f -exec chmod 0644 {} +
sed "s|@PAGES_BASE_URL@|${PAGES_BASE_URL}|g" "$REPO_ROOT/pages/robots.txt" > "$SITE/robots.txt"
sed "s|@PAGES_BASE_URL@|${PAGES_BASE_URL}|g" "$REPO_ROOT/pages/sitemap.xml" > "$SITE/sitemap.xml"
find "$SITE" -maxdepth 1 -type f -exec chmod 0644 {} +
chmod 0755 "$SITE/install.sh" "$SITE/uninstall.sh"

log "repository contents:"
( cd "$SITE" && ls -lh )
log "package index:"
grep -E '^(Package|Version|Architecture|Filename):' "$SITE/Packages" || true

test -s "$SITE/Packages"        || die "Packages is empty"
test -s "$SITE/InRelease"       || die "InRelease is missing"
test -s "$SITE/Release.gpg"     || die "Release.gpg is missing"
test -s "$SITE/public.key"      || die "public.key is missing"
test -s "$SITE/easycaddy-archive-keyring.gpg" || die "keyring is missing"
test -s "$SITE/assets/site.css" || die "site.css is missing"
test -s "$SITE/assets/site.js"  || die "site.js is missing"
test -s "$SITE/assets/i18n.js"  || die "i18n.js is missing"
test -s "$SITE/assets/theme.js" || die "theme.js is missing"
test -s "$SITE/assets/mascot.png" || die "mascot.png is missing"
test -s "$SITE/assets/caddy.svg" || die "caddy.svg is missing"
test -s "$SITE/robots.txt"      || die "robots.txt is missing"
test -s "$SITE/sitemap.xml"     || die "sitemap.xml is missing"

if ! grep -q "^Filename: pool/.*\.deb$" "$SITE/Packages"; then
  die "Packages does not reference any pool/*.deb files"
fi

log "done: APT repository prepared in $SITE"
