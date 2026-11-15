# Contributing to EasyCaddy

EasyCaddy is a packaging and release repository. It does not fork Caddy: every build
fetches the upstream source at a release tag with `xcaddy` and repacks the official
`.deb`. Please report bugs that also occur with an official Caddy build to
[caddyserver/caddy](https://github.com/caddyserver/caddy/issues) instead.

## Ways to contribute

- **Bug reports:** use the bug report issue form and include `caddy version`, architecture,
  distribution, install method, a minimal config and relevant logs.
- **Plugin requests:** open a feature request with the Go module path and a concrete use
  case. Check that the plugin is not already part of the standard Caddy build and that it
  supports the current upstream release.
- **Pull requests:** keep changes focused. Packaging, workflow and documentation changes
  are all welcome.

## Development setup

Requirements:

- Go (a version supported by the current Caddy release)
- `xcaddy`
- `dpkg-deb`, `curl`, `gzip`, `python3`
- Optional: `lintian`, `actionlint`

```bash
git clone https://github.com/MinimaxFlora/EasyCaddy.git
cd EasyCaddy
git switch master
```

Build a single architecture locally:

```bash
go install github.com/caddyserver/xcaddy/cmd/xcaddy@v0.4.7
mkdir -p dist
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 xcaddy build v2.11.9 \
  --output dist/caddy \
  --with github.com/caddy-dns/cloudflare \
  --with github.com/caddy-dns/alidns \
  --with github.com/caddy-dns/tencentcloud \
  --with github.com/mholt/caddy-ratelimit \
  --with github.com/greenpau/caddy-security \
  --with github.com/mholt/caddy-l4 \
  --with github.com/mholt/caddy-dynamicdns \
  --with github.com/mholt/caddy-webdav \
  --with github.com/caddyserver/cache-handler \
  --with github.com/zhangjiayin/caddy-geoip2 \
  --with github.com/WeidiDeng/caddy-cloudflare-ip
```

Repack it as a Debian package:

```bash
bash .github/scripts/make-deb.sh dist/caddy v2.11.9 linux_amd64 dist
```

The package version must stay identical to the upstream release. `make-deb.sh` applies the
Debian Policy fixes documented in the README and writes the package to
`dist/caddy_2.11.9_linux_amd64.deb`.

## Website architecture

The repository site is a no-build static site. Keep the separation strict:

- `pages/index.html` — semantic markup and default Chinese copy only.
- `pages/assets/site.css` — design tokens, layout, components and responsive rules.
- `pages/assets/site.js` — theme toggle, navigation, tabs, copy buttons and scroll progress.
- `pages/assets/theme.js` — the small pre-paint bootstrap that applies a stored light theme and the theme-color meta tag.
- `pages/assets/i18n.js` — the five-language dictionary and language switcher.
- `pages/robots.txt` and `pages/sitemap.xml` — deployed with `@PAGES_BASE_URL@` replaced by `make-apt-repo.sh`.

Rules:

- Do not add inline `<style>` blocks, inline event handlers, or large inline scripts. Inline JSON-LD is the only intentional exception.
- Keep the default theme dark; verify the light theme through the toggle and a reload.
- Verify the page without JavaScript: core install information must remain readable.
- Check 390 px mobile layout, keyboard navigation, copy buttons, both themes, all five languages, and that no page has horizontal overflow.
- `make-apt-repo.sh` copies `pages/assets/` recursively. Any new asset must be linked with a relative `assets/...` path.

## Checks before opening a pull request

```bash
# Shell syntax
bash -n .github/scripts/*.sh pages/install.sh

# Workflow static analysis
actionlint -color .github/workflows/build.yml

# Debian package policy
lintian --display-info dist/caddy_2.11.9_linux_amd64.deb

# Configuration smoke test
dist/caddy validate --config Caddyfile --adapter caddyfile
```

For APT repository changes, also verify the signed metadata:

```bash
gpg --verify InRelease
gpg --verify Release.gpg Release
```

## Adding or changing plugins

Edit the `PLUGINS` block at the top of `.github/workflows/build.yml`, one Go module path
per line. Keep the list sorted by repository for easier review.

- Do **not** add modules already imported by Caddy's `modules/standard` packages; duplicate
  registration causes a startup panic.
- Plugin versions are intentionally unpinned. If you pin a module, use a released tag or a
  full commit hash and explain why in the pull request.
- Update the plugin table and all four README files when the public plugin set changes.

## Manual workflow runs

From the Actions tab, or with the GitHub CLI:

```bash
gh workflow run build.yml -f upstream_version=v2.11.9
gh workflow run build.yml -f upstream_version=v2.11.9 -f force=true
```

A run without `upstream_version` builds the latest upstream release. If a release with that
tag already exists, the build is skipped unless `force` is enabled.

## Repository secrets

`GPG_PRIVATE_KEY` holds the ASCII-armored APT signing key. Never commit it, paste it into an
issue, or include it in logs. If the key is rotated, update the secret, commit the new
`public.key`, and mention the new fingerprint in the pull request.

## Commit and pull request guidelines

- Write commit messages in the imperative mood, for example `Add cache-handler module`.
- Keep unrelated changes in separate commits.
- Update `CHANGELOG.md` for user-visible changes.
- Complete the pull request checklist, including the lintian and install checks that apply
  to your change.
