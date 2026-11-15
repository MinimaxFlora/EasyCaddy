#!/usr/bin/env bash
# Exercise make-apt-repo.sh with a temporary signing key and synthetic packages.
# The real amd64 .deb is supplied by CI; other architectures get minimal test
# packages so the full index and architecture rules can be checked.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
REAL_DEB="${1:?path to the amd64 .deb is required}"
SITE="${2:-$ROOT/.tmp/ci-apt-site}"
WORK="$(mktemp -d)"
export GNUPGHOME="$WORK/gnupg"
mkdir -m 700 "$GNUPGHOME"
trap 'rm -rf "$WORK" "$SITE"' EXIT

version="$(dpkg-deb -f "$REAL_DEB" Version)"
tag="v${version}"
mkdir -p "$WORK/debs"
cp "$REAL_DEB" "$WORK/debs/caddy_${version}_linux_amd64.deb"

# Create minimal but structurally valid packages for the other APT architectures.
python3 - "$ROOT/config/build-matrix.json" <<'PY' > "$WORK/arch-list.tsv"
import json, sys
with open(sys.argv[1], encoding="utf-8") as fh:
    matrix = json.load(fh)
for arch in matrix["architectures"]:
    print(f"{arch['asset']}\t{arch['debarch']}\t{'1' if arch['apt'] else '0'}")
PY

while IFS=$'\t' read -r asset debarch _apt; do
  [ "$asset" = "linux_amd64" ] && continue
  pkgroot="$WORK/pkg-$asset"
  mkdir -p "$pkgroot/DEBIAN" "$pkgroot/usr/share/doc/caddy"
  cat > "$pkgroot/DEBIAN/control" <<EOF
Package: caddy
Version: ${version}
Section: httpd
Priority: optional
Architecture: ${debarch}
Maintainer: EasyCaddy CI <ci@example.invalid>
Description: CI test package
 This package is generated only to test the APT index.
EOF
  printf 'test\n' > "$pkgroot/usr/share/doc/caddy/README"
  dpkg-deb --build --root-owner-group "$pkgroot" "$WORK/debs/caddy_${version}_${asset}.deb" >/dev/null
done < "$WORK/arch-list.tsv"

gpg --batch --gen-key <<'EOF'
%no-protection
Key-Type: RSA
Key-Length: 3072
Key-Usage: sign
Name-Real: EasyCaddy CI
Name-Email: ci@example.invalid
Expire-Date: 0
%commit
EOF
KEY_ID="$(gpg --batch --list-secret-keys --with-colons \
  | awk -F: '/^fpr:/{print $10; exit}')"
gpg --batch --armor --export "$KEY_ID" > "$WORK/public.key"

GPG_KEY_FINGERPRINT="$KEY_ID" \
PUBLIC_KEY_FILE="$WORK/public.key" \
LOCAL_DEB_DIR="$WORK/debs" \
PAGES_BASE_URL="https://example.invalid" \
GITHUB_REPOSITORY="MinimaxFlora/EasyCaddy" \
MATRIX_FILE="$ROOT/config/build-matrix.json" \
bash "$ROOT/.github/scripts/make-apt-repo.sh" "$tag" "$SITE" 3

gpg --batch --verify "$SITE/InRelease"
gpg --batch --verify "$SITE/Release.gpg" "$SITE/Release"
python3 "$ROOT/.github/scripts/ci/check-site.py" "$SITE"

if grep -q "linux_armv6" "$SITE/Packages"; then
  echo "error: ARMv6 leaked into Packages" >&2
  exit 1
fi
grep -q "Architectures: .*armhf" "$SITE/Release" \
  || { echo "error: armhf missing from Release architectures" >&2; exit 1; }

# A mismatched fingerprint must fail before signing.
if GPG_KEY_FINGERPRINT="0000000000000000000000000000000000000000" \
   PUBLIC_KEY_FILE="$WORK/public.key" \
   LOCAL_DEB_DIR="$WORK/debs" \
   PAGES_BASE_URL="https://example.invalid" \
   GITHUB_REPOSITORY="MinimaxFlora/EasyCaddy" \
   bash "$ROOT/.github/scripts/make-apt-repo.sh" "$tag" "$WORK/should-not-exist" 3 >/dev/null 2>&1; then
  echo "error: make-apt-repo accepted a missing signing key" >&2
  exit 1
fi

echo "APT repository test passed"
