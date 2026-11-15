# Changelog

All notable changes to this repository are documented here. The package version follows
the upstream Caddy release tag; entries are grouped by that version.

## [Unreleased]

### Added

- Issue forms for bug reports and feature/plugin requests.
- Pull request template, CODEOWNERS, Dependabot configuration and funding metadata.
- English, Simplified Chinese, Japanese and Korean README files.
- Multilingual landing page with Simplified Chinese, Traditional Chinese, English, Japanese and Korean, including automatic language detection, a switcher and `?lang=` support.
- Redesigned landing page with the official Caddy logo as favicon and brand mark.
- Split the site into semantic `pages/index.html`, `pages/assets/site.css`, `pages/assets/site.js`, `pages/assets/theme.js` and `pages/assets/i18n.js`; dark theme is now the default, with a pre-paint light-theme bootstrap.
- Added `robots.txt`, `sitemap.xml`, structured data, canonical/hreflang metadata, a generated 1200×630 Open Graph card and a single theme-color source.
- Local Caddy wordmark assets (`assets/caddy-light.svg`, `assets/caddy-dark.svg`) used in every README header.
- Hero canvas crawler effect (`pages/assets/field.js`) with off-screen pause and reduced-motion fallback; the language button is now icon-only.
- Debian Policy quality checks and lintian overrides in the packaging script.
- Authoritative `config/plugins.lock.json`, `config/build-matrix.json` and `config/toolchain.json`; CI verifies modules, architecture lists and docs against them.
- Independent `ci.yml` with ShellCheck, actionlint, yamllint, config/secret checks, an amd64 package build, module smoke test and a signed APT test using a temporary key.
- Explicit `GPG_KEY_FINGERPRINT` verification and a full-fingerprint signing path.
- `pages/uninstall.sh` with dry-run, source restoration and explicit purge.
- SBOM, build info, lock/toolchain/matrix assets and build provenance attestation in releases.
- `LICENSE`, `NOTICE`, `SECURITY.md`, `SUPPORT.md`, `THIRD_PARTY_NOTICES.md`, `docs/COMPATIBILITY.md` and `docs/AUDIT.md`.

### Changed

- Build and packaging scripts moved from `scripts/` to `.github/scripts/`.
- The public APT repository URL is now `https://caddy.tatalvpai.vip`.
- The default branch is `master`.
- Plugin versions and the Go/xcaddy toolchain are pinned; releases use SemVer sorting for retention and no longer move the Latest pointer when rebuilding an older tag.
- The installer verifies the key fingerprint, handles `.list` and Deb822 `.sources`, backs up changes and distinguishes package installation from service activation.
- The packaging script verifies the upstream `.deb` SHA-512, asserts the upstream layout, records build/plugin provenance and generates accurate third-party notice text.
- Release metadata, quality checks and maintenance instructions now reference configuration files rather than duplicated lists.

## [2.11.9] - 2026-11-16

### Added

- Initial EasyCaddy build based on upstream Caddy `v2.11.9`.
- Plugins: `caddy-dns/cloudflare`, `caddy-dns/alidns`, `caddy-dns/tencentcloud`,
  `mholt/caddy-ratelimit`, `greenpau/caddy-security`, `mholt/caddy-l4`,
  `mholt/caddy-dynamicdns`, `mholt/caddy-webdav`, `caddyserver/cache-handler`,
  `zhangjiayin/caddy-geoip2`, `WeidiDeng/caddy-cloudflare-ip`.
- Linux builds for `amd64`, `arm64`, `armv7`, `armv6`, `armv5`, `ppc64le`, `riscv64` and
  `s390x`, published as `.deb` and `.tar.gz`.
- Signed flat APT repository hosted on GitHub Pages, with `Packages`, `Packages.gz`,
  `Release`, `InRelease`, `public.key` and an installer script.
- Automatic weekly check for a new upstream release, plus manual `workflow_dispatch`
  with optional version and force-rebuild inputs.
- GitHub Release assets with SHA-256 checksums.

### Changed

- Package version matches upstream exactly (`2.11.9`); `install.sh` uses an APT pin and
  `--reinstall` so it replaces an official package of the same version.
- `make-deb.sh` repacks the upstream `.deb` while preserving the systemd units, Caddyfile,
  maintainer scripts and man pages.

### Fixed

- Debian Policy issues inherited from the upstream package: aliased `/lib` paths,
  obsolete bash-completion directory, missing copyright/changelog, timestamped man pages
  and recursive `chown` in `postinst`.
- The ARMv6 package is excluded from the APT index because upstream labels both ARMv6 and
  ARMv7 as `armhf`; it remains available as a Release asset.
