# Compatibility

Compatibility is stated only for what has actually been exercised. “Build-only”
means the cross-compilation and package generation completed; it does not mean
the binary was executed on that platform.

## Verified

| Distribution | Architecture | Scope | Date |
| --- | --- | --- | --- |
| Debian GNU/Linux 13 (trixie) | amd64 | APT install, same-version `--reinstall`, module loading, systemd start, HTTP smoke test, custom domain | 2026-11-15 |

## Build-only

| Environment | Architecture | Scope |
| --- | --- | --- |
| Ubuntu 26.04 GitHub Actions runner | amd64 | cross-build, `.deb` generation, lintian, module smoke test |

## Cross-compiled but not executed

`arm64`, `armv7`, `armv6`, `armv5`, `ppc64le`, `riscv64` and `s390x` are
compiled and packaged in CI. They have not been executed on target hardware by
this project. Users should verify them in their own environment.

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
