# Security Policy

## Scope

This policy covers the EasyCaddy repository's own artefacts:

- build and packaging scripts under `.github/scripts/`
- GitHub Actions workflows
- `install.sh` and `uninstall.sh`
- the signed APT repository and its metadata
- the static Pages site

Caddy itself and the third-party modules are upstream projects. Report issues
that reproduce with an official Caddy build to
[caddyserver/caddy](https://github.com/caddyserver/caddy/security), and report
module-specific issues to the module's upstream repository.

## Supported versions

Only the **latest published EasyCaddy release** receives security updates.
Older releases remain downloadable, but they are not supported and may contain
known vulnerabilities. Check the latest release at:

https://github.com/MinimaxFlora/EasyCaddy/releases/latest

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting:

https://github.com/MinimaxFlora/EasyCaddy/security/advisories/new

Do not open a public issue for a vulnerability that could put users at risk.
Include the affected version, architecture, distribution, a minimal
reproduction, and any relevant logs with secrets and personal data removed.

There is no paid security team and no guaranteed response SLA. Reports are
handled on a best-effort basis. Confirmed issues are fixed in a new release and
documented in `CHANGELOG.md` and the release notes. Please allow time for a fix
and a coordinated disclosure window before publishing details.

## Repository signing key

The APT repository is signed by the key with fingerprint:

```
5D07 1390 261F C2DE BE57  7C7B 129D C816 26FF 07EE
```

The public key is committed as `public.key` and served at
`https://caddy.tatalvpai.vip/public.key`. The CI verifies that the signing key
matches the expected fingerprint in the `GPG_KEY_FINGERPRINT` repository
variable. See the key rotation instructions in `README.md`.

A key compromise should be reported privately. Key rotation changes the
fingerprint and requires clients to re-import the keyring.

## Boundaries

- EasyCaddy is an unofficial community rebuild and is not endorsed by the Caddy
  project. Do not describe its artefacts as official Caddy signatures.
- SHA-256 checksums are integrity checks, not digital signatures.
- The installer verifies the repository key fingerprint before trusting the
  repository, but no software distribution mechanism can protect a system that
  is already compromised.
- Module versions are locked in `config/plugins.lock.json`. Report outdated or
  vulnerable modules through the security advisory channel as well; they may
  require a lock update and a new release.
