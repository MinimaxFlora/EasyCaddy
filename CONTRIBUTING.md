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

- Go `1.27.4` (see `config/toolchain.json`)
- `xcaddy v0.4.7` (see `config/toolchain.json`)
- `jq`, `dpkg-deb`, `curl`, `gzip`, `python3`
- Optional: `shellcheck`, `yamllint`, `lintian`, `actionlint`

```bash
git clone https://github.com/MinimaxFlora/EasyCaddy.git
cd EasyCaddy
git switch master
```

Build a single architecture locally:

```bash
go install github.com/caddyserver/xcaddy/cmd/xcaddy@v0.4.7
mkdir -p dist
tag="$(jq -r .verified_caddy config/plugins.lock.json)"
args=()
while IFS= read -r plugin; do
  args+=(--with "$plugin")
done < <(jq -r '.plugins[] | "\(.module)@\(.version)"' config/plugins.lock.json)
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 xcaddy build "$tag" \
  --output dist/caddy "${args[@]}"
python3 .github/scripts/ci/verify-build.py dist/caddy config/plugins.lock.json
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
- `pages/assets/field.js` — the optional hero canvas crawler effect; it pauses off-screen and becomes static under reduced motion.
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
# All static checks (shell syntax, ShellCheck, actionlint, yamllint,
# config consistency, secret scan and script modes)
bash .github/scripts/ci/static-checks.sh

# Configuration and site consistency
python3 .github/scripts/ci/check-config.py
python3 .github/scripts/ci/check-site.py site

# Debian package policy and contents
lintian --display-info dist/caddy_2.11.9_linux_amd64.deb
dpkg-deb -I dist/caddy_2.11.9_linux_amd64.deb

# Binary and module smoke test
dist/caddy version
dist/caddy list-modules
dist/caddy validate --config Caddyfile --adapter caddyfile
```

For APT repository changes, also verify the signed metadata:

```bash
gpg --verify InRelease
gpg --verify Release.gpg Release
```

## Adding or changing plugins

Edit `config/plugins.lock.json`. Every entry needs the module path, an immutable version or
pseudo-version, purpose, upstream URL, verified license, maintenance status,
`caddy_compatibility` and at least one `smoke_modules` value.

- Do **not** add modules already imported by Caddy's `modules/standard` packages; duplicate
  registration causes a startup panic.
- Use a released tag or a full commit hash. Do not use a floating branch.
- Update `THIRD_PARTY_NOTICES.md`, the page, the four README files, and the compatibility
  note when the public plugin set changes.
- Run the workflow with `force=true` for the current tag after merging a lock change.
- If the lock changes the Caddy version, update `verified_caddy` and rebuild all
  architectures before publishing.

## Manual workflow runs

From the Actions tab, or with the GitHub CLI:

```bash
gh workflow run build.yml -f upstream_version=v2.11.9
gh workflow run build.yml -f upstream_version=v2.11.9 -f force=true
```

A run without `upstream_version` builds the latest upstream release. If a release with that
tag already exists, the build is skipped unless `force` is enabled.

## Repository secrets

`GPG_PRIVATE_KEY` holds the ASCII-armored APT signing key. `GPG_KEY_FINGERPRINT` is a
repository variable containing the expected full fingerprint. Never commit or paste the
private key into an issue or log. If the key is rotated, update both, commit the new
`public.key`, update `SECURITY.md` and mention the new fingerprint in the pull request.
The signing scripts abort if the secret key, the expected fingerprint and the committed
public key disagree.

Installer changes must be tested with a disposable VM or container. At minimum, run
`install.sh --dry-run` and `uninstall.sh --dry-run` on Debian, then test a real install in
an environment where losing `/etc/caddy` would not matter. Record the distribution and
whether the systemd service actually became active; do not report a build-only result as a
runtime pass.

## Commit and pull request guidelines

- Write commit messages in the imperative mood, for example `Add cache-handler module`.
- Keep unrelated changes in separate commits.
- Update `CHANGELOG.md` for user-visible changes.
- Complete the pull request checklist, including the lintian and install checks that apply
  to your change.
