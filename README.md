<p align="center">
  <a href="https://caddyserver.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/caddy-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="assets/caddy-light.svg">
      <img src="assets/caddy-light.svg" alt="Caddy" width="550">
    </picture>
  </a>
  <br>
  <h3 align="center">EasyCaddy — Unofficial Caddy builds with extra plugins</h3>
</p>

<p align="center">
  <a href="https://github.com/MinimaxFlora/EasyCaddy/actions/workflows/build.yml"><img src="https://github.com/MinimaxFlora/EasyCaddy/actions/workflows/build.yml/badge.svg?branch=master" alt="Build Caddy with plugins"></a>
  &nbsp;
  <a href="https://github.com/MinimaxFlora/EasyCaddy/releases/latest"><img src="https://img.shields.io/github/v/release/MinimaxFlora/EasyCaddy" alt="Latest release"></a>
  &nbsp;
  <a href="https://caddy.tatalvpai.vip"><img src="https://img.shields.io/badge/APT-caddy.tatalvpai.vip-3d6b50" alt="APT repository"></a>
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README_ZH.md">简体中文</a> ·
  <a href="README_JA.md">日本語</a> ·
  <a href="README_KR.md">한국어</a>
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#plugins">Plugins</a> ·
  <a href="#architectures">Architectures</a> ·
  <a href="#quality-checks">QC</a> ·
  <a href="#contributing">Contributing</a>
</p>

> **Unofficial build.** EasyCaddy is not affiliated with or endorsed by the Caddy project. Caddy and the Caddy logo are trademarks of Stack Holdings GmbH.

<hr>

Built from upstream [Caddy](https://github.com/caddyserver/caddy) with a curated set of
third-party modules, packaged as `.deb` files and published as a signed APT repository
at **https://caddy.tatalvpai.vip**.

- Tracks the latest upstream Caddy release (checked every Monday at 03:00 UTC, or manually)
- Release tags mirror upstream exactly, for example `v2.11.9`
- Builds 8 Linux architectures; the APT index covers 7 of them
- Package name and version match upstream (`caddy 2.11.9`), selected with an APT pin
  and `--reinstall`
- The APT index is signed with a dedicated GPG key

## Install

One command:

```bash
curl -fsSL https://caddy.tatalvpai.vip/install.sh | sudo bash
```

Or set up the repository manually:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://caddy.tatalvpai.vip/public.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/easycaddy-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/easycaddy-archive-keyring.gpg] https://caddy.tatalvpai.vip/ ./" \
  | sudo tee /etc/apt/sources.list.d/easycaddy.list
printf 'Package: caddy\nPin: origin "caddy.tatalvpai.vip"\nPin-Priority: 1001\n' \
  | sudo tee /etc/apt/preferences.d/easycaddy
sudo chmod o+r /usr/share/keyrings/easycaddy-archive-keyring.gpg
sudo chmod o+r /etc/apt/sources.list.d/easycaddy.list
sudo apt update
sudo apt install --reinstall caddy
```

Because the version is identical to upstream, a plain `apt install caddy` does nothing
when an official package of the same version is already installed. `--reinstall` forces
the package from this repository to be unpacked. The APT pin keeps this repository
selected if the official Caddy source is enabled again.

Verify the installation:

```bash
caddy version
caddy list-modules | grep -E 'dns.providers|rate_limit|security|layer4|dynamic_dns|webdav|cache|geoip2|cloudflare'
```

> **Do not enable the official Caddy APT repository at the same time.** Both sources ship
> a package named `caddy` with the same version. `install.sh` renames
> `/etc/apt/sources.list.d/caddy-stable.list` to `.disabled-by-easycaddy` and writes the pin
> shown above. If you use the manual setup, add the pin yourself.
>
> Do not run `caddy upgrade`: it downloads the official binary and overwrites this build,
> removing the extra modules. Upgrade with `sudo apt install --only-upgrade caddy`.

### Upgrades and downgrades

```bash
sudo apt update
sudo apt install --only-upgrade caddy
apt-cache policy caddy
```

The Pages site keeps the three most recent releases. Older `.deb` files remain available
from the corresponding GitHub Release.

## Plugins

| Module | Purpose |
| --- | --- |
| `github.com/caddy-dns/cloudflare` | Cloudflare DNS-01 challenge |
| `github.com/caddy-dns/alidns` | Alibaba Cloud DNS-01 challenge |
| `github.com/caddy-dns/tencentcloud` | Tencent Cloud DNSPod DNS-01 challenge |
| `github.com/mholt/caddy-ratelimit` | `rate_limit` request limiting |
| `github.com/greenpau/caddy-security` | Authentication, authorization, MFA and OAuth portal |
| `github.com/mholt/caddy-l4` | Layer 4 TCP/UDP proxying |
| `github.com/mholt/caddy-dynamicdns` | Dynamic DNS updates |
| `github.com/mholt/caddy-webdav` | WebDAV file serving |
| `github.com/caddyserver/cache-handler` | HTTP caching |
| `github.com/zhangjiayin/caddy-geoip2` | GeoIP2 matchers |
| `github.com/WeidiDeng/caddy-cloudflare-ip` | Restore real client IPs behind Cloudflare |

Plugin versions are **not pinned**. Every build resolves the default branch of each
repository, matching the behaviour of `--with github.com/caddy-dns/cloudflare`. To make
builds reproducible, append `@v1.2.3` or `@<commit>` in the `PLUGINS` block of
`.github/workflows/build.yml`.

## Architectures

Builds and Release assets: `amd64`, `arm64`, `armv7`, `armv6`, `armv5`, `ppc64le`,
`riscv64`, `s390x`.

The APT index includes every architecture except `armv6`. Upstream labels both ARMv6 and
ARMv7 packages as Debian architecture `armhf`, and two packages with the same name,
version and architecture cannot coexist in one package index. The ARMv7 build is served
through APT; the ARMv6 `.deb` and `.tar.gz` are available from the GitHub Release.

## How it works

1. `.github/workflows/build.yml` resolves the latest upstream release tag (or a tag
   supplied through `workflow_dispatch`).
2. A matrix job runs `xcaddy build` for all eight Linux architectures with the plugin
   list from the workflow `PLUGINS` environment variable.
3. `.github/scripts/make-deb.sh` downloads the matching official Caddy `.deb`, replaces
   `/usr/bin/caddy` with the custom binary, applies Debian Policy fixes, regenerates
   checksums and repacks the package.
4. The release job publishes a GitHub Release with `.deb`, `.tar.gz` and SHA-256
   checksums.
5. `.github/scripts/make-apt-repo.sh` downloads the current and two previous releases,
   generates `Packages` / `Packages.gz`, signs `Release` and `InRelease` with the
   repository key, and deploys the site to GitHub Pages.

## Repository layout

```text
.github/workflows/build.yml        Build, release and Pages deployment
.github/scripts/make-deb.sh        Repack the upstream .deb with the custom binary
.github/scripts/make-apt-repo.sh   Collect packages, build indexes and sign them
.github/ISSUE_TEMPLATE/            Issue forms
.github/CODEOWNERS                 Review ownership
.github/FUNDING.yml                Sponsorship links
.github/PULL_REQUEST_TEMPLATE.md   Pull request checklist
.github/dependabot.yml             Weekly GitHub Actions updates
.github/actionlint.yaml            actionlint configuration
assets/caddy-light.svg             README wordmark (light)
assets/caddy-dark.svg              README wordmark (dark)
pages/index.html                   Semantic page structure
pages/assets/site.css              Page design tokens and components
pages/assets/site.js               Theme, navigation, tabs and copy interactions
pages/assets/theme.js              Pre-paint theme bootstrap
pages/assets/i18n.js               Five-language translations
pages/assets/caddy.svg             Favicon and brand icon
pages/install.sh                   User installer
pages/robots.txt                   Crawler policy
pages/sitemap.xml                  Search-engine sitemap
public.key                         APT repository signing public key
README.md / README_ZH.md / README_JA.md / README_KR.md
CONTRIBUTING.md                    Contribution guide
CHANGELOG.md                       Release history
```

## Repository maintenance

The signing public key is committed as `public.key`:

```text
5D07 1390 261F C2DE BE57  7C7B 129D C816 26FF 07EE
EasyCaddy Repository <easycaddy@users.noreply.github.com>
```

1. Add the private key as the `GPG_PRIVATE_KEY` Actions secret. The key has no
   passphrase; keep an offline backup and never commit it.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the
   source and set the custom domain to `caddy.tatalvpai.vip`.
3. Create a DNS `CNAME` record for `caddy.tatalvpai.vip` pointing to
   `minimaxflora.github.io`. Use DNS-only mode (grey cloud) while GitHub provisions the
   TLS certificate; proxying can be enabled afterwards.
4. Run **Actions → Build Caddy with plugins → Run workflow** once.

Manual controls:

- **Build a specific version:** set `upstream_version` to a tag such as `v2.11.9`.
- **Rebuild an existing release:** enable `force`; release assets are overwritten and
  the index is regenerated.
- **Add a plugin:** add one module path per line to `PLUGINS`; do not add modules that are
  already part of the standard Caddy build.
- **Change the package retention:** edit `KEEP_VERSIONS` (default `3`). GitHub Pages has
  a 1 GB soft limit; seven packages per version are roughly 140 MB.
- **Change the public URL:** update `PAGES_BASE_URL` in the workflow, `BASE_URL` and the
  pin origin in `pages/install.sh`, the Pages custom domain, and the links in the READMEs.

### Rotating the signing key

```bash
gpg --batch --gen-key <<'EOF'
%no-protection
Key-Type: RSA
Key-Length: 4096
Key-Usage: sign
Name-Real: EasyCaddy Repository
Name-Email: easycaddy@users.noreply.github.com
Expire-Date: 0
%commit
EOF
gpg --armor --export-secret-keys easycaddy@users.noreply.github.com > easycaddy-private.asc
gpg --armor --export easycaddy@users.noreply.github.com > public.key
```

Update the `GPG_PRIVATE_KEY` secret and commit the new `public.key`, then run the
workflow again. Existing installations must download the new key and update their
`signed-by` keyring.

## Quality checks

The packaging step applies Debian Policy fixes instead of blindly repacking upstream:

- systemd units move from `/lib/systemd/system` to `/usr/lib/systemd/system`
- bash completion moves from the obsolete `/etc/bash_completion.d` to
  `/usr/share/bash-completion/completions`
- `copyright`, `changelog.gz` and an extended description are added
- man pages are recompressed with `gzip -9n`
- `chown -R` in the maintainer script is replaced with a directory-only `chown`
- lintian overrides cover properties inherent to Go static binaries

On Debian 13 with lintian 2.122.0 the amd64 package reports **0 errors and 0 warnings**.
CI also runs lintian on the amd64 build as an advisory step (`lintian.txt` is uploaded
with the build artifact). `actionlint`, YAML parsing and `bash -n` are part of the
development checks described in [CONTRIBUTING.md](CONTRIBUTING.md).

## Limitations

- This is an unofficial build and comes with no warranty. Validate it in a test
  environment before using it in production.
- Plugin versions are resolved at build time and are not reproducible by default.
- `caddy-geoip2` requires a MaxMind GeoLite2 or GeoIP2 database supplied by the user.
- `greenpau/caddy-security` significantly increases binary size and build time.
- The scheduled workflow only builds when upstream publishes a **new** release tag; an
  existing release with the same tag is skipped unless `force` is enabled.
- The release tag points to a commit in this packaging repository, not to an upstream
  commit. xcaddy fetches the upstream source by tag.
- If upstream stops publishing an official `.deb` for an architecture, the build fails
  with an explicit error; the packaging script would then need a self-contained template.

## Contributing

Bug reports, plugin requests and pull requests are welcome. See
[CONTRIBUTING.md](CONTRIBUTING.md), the issue templates, and
[CHANGELOG.md](CHANGELOG.md).

- Repository: https://github.com/MinimaxFlora/EasyCaddy
- Releases: https://github.com/MinimaxFlora/EasyCaddy/releases
- APT repository: https://caddy.tatalvpai.vip
- Upstream Caddy: https://github.com/caddyserver/caddy
- Caddy documentation: https://caddyserver.com/docs/
