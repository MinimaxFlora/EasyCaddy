# Compatibility

Compatibility is stated only for what has actually been exercised. “Build-only”
means the cross-compilation and package generation completed; it does not mean
the binary was executed on that platform.

## Verified

| Distribution | Architecture | Scope | Date |
| --- | --- | --- | --- |
| Debian GNU/Linux 13 (trixie) | amd64 | APT install, same-version `--reinstall`, module loading, systemd start, HTTP smoke test, custom domain, uninstall, Deb822 `.sources` detection/restore | 2026-11-16 |
| Ubuntu 26.04 LTS (systemd container) | amd64 | APT install from the published repository, key fingerprint, APT pin, modules, Caddyfile validation, systemd active, uninstall with user data preserved | 2026-11-16 |

## Cross-compiled and executed under QEMU user emulation

| Architecture | Runtime result |
| --- | --- |
| amd64 | `caddy version`, 205 modules, all expected plugins, `caddy validate` |
| arm64 | same |
| armv7 | same |
| armv6 | same |
| armv5 | same |
| ppc64le | same |
| riscv64 | same |
| s390x | same |

These runs used `qemu-user-static` on an amd64 host. They prove the binaries
start, load the plugins and parse a Caddyfile, but they are **not target-hardware
tests**. Real-device behaviour (performance, kernel features, network interfaces)
still needs validation by users.

## Not executed

- Native execution on ARM, RISC-V, POWER or s390x hardware.
- Unsupported or untested Linux distributions.
- A real signing-key rotation against the production key (the rotation mechanics
  are tested with temporary keys; rotating the production key would invalidate
  every existing installation's keyring).

## APT architecture notes

- APT serves `amd64`, `arm64`, `armv7` (`armhf`), `armv5` (`armel`),
  `ppc64le` (`ppc64el`), `riscv64` and `s390x`.
- `armv6` uses Debian architecture `armhf`, the same as ARMv7. Two packages with
  the same name, version and architecture cannot share one APT index, so the
  ARMv6 build is published only as a GitHub Release asset.
- On an `armhf` system the installer cannot distinguish ARMv6 from ARMv7; APT
  installs the ARMv7 build and warns if the system reports `armhf`.

## Distribution policy

The installer targets Debian and Ubuntu systems using APT/dpkg. Other
distributions are unsupported. Ubuntu versions other than the CI runner have
not been tested for installation. Compatibility with “all Debian/Ubuntu” is not
claimed.

## Updating this document

Add a row only after running the described checks. Record the date and the exact
scope. Do not convert build-only results into runtime claims.
