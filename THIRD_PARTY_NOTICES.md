# Third-party notices

EasyCaddy packages an unofficial build of Caddy. The packaging scripts and
documentation in this repository are licensed under Apache-2.0 (see
[LICENSE](LICENSE)). That license does not replace or alter the licenses of the
upstream Caddy source or of any bundled module.

Caddy is a trademark of Stack Holdings GmbH. EasyCaddy is not affiliated with or
endorsed by the Caddy project.

## Upstream

| Component | License | Source |
| --- | --- | --- |
| Caddy | Apache-2.0 | https://github.com/caddyserver/caddy |

## Directly bundled modules

The versions below are the versions locked by `config/plugins.lock.json` and
verified against Caddy `v2.11.9`. Each module remains under its own license;
the license identifiers are taken from the upstream repositories.

| Module | Version | License | Source |
| --- | --- | --- | --- |
| `github.com/caddy-dns/cloudflare` | `v0.2.4` | Apache-2.0 | https://github.com/caddy-dns/cloudflare |
| `github.com/caddy-dns/alidns` | `v1.0.29` | MIT | https://github.com/caddy-dns/alidns |
| `github.com/caddy-dns/tencentcloud` | `v0.4.3` | MIT | https://github.com/caddy-dns/tencentcloud |
| `github.com/mholt/caddy-ratelimit` | `v0.1.0` | Apache-2.0 | https://github.com/mholt/caddy-ratelimit |
| `github.com/greenpau/caddy-security` | `v1.6.2` | Apache-2.0 | https://github.com/greenpau/caddy-security |
| `github.com/mholt/caddy-l4` | `v0.1.3` | Apache-2.0 | https://github.com/mholt/caddy-l4 |
| `github.com/mholt/caddy-dynamicdns` | `v0.0.0-20260805195708-67d107a42c02` | Apache-2.0 | https://github.com/mholt/caddy-dynamicdns |
| `github.com/mholt/caddy-webdav` | `v0.0.0-20260127042217-fa2f366b0d75` | Apache-2.0 | https://github.com/mholt/caddy-webdav |
| `github.com/caddyserver/cache-handler` | `v0.17.0` | Apache-2.0 | https://github.com/caddyserver/cache-handler |
| `github.com/zhangjiayin/caddy-geoip2` | `v1.3.1` | Apache-2.0 | https://github.com/zhangjiayin/caddy-geoip2 |
| `github.com/WeidiDeng/caddy-cloudflare-ip` | `v0.0.0-20231130002422-f53b62aa13cb` | Apache-2.0 | https://github.com/WeidiDeng/caddy-cloudflare-ip |

Transitive Go dependencies are not listed individually here; they are recorded
in the CycloneDX SBOM published with each release and retain their upstream
licenses. If a module's upstream license changes, the lock file and this notice
must be updated in the same pull request.
