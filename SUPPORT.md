# Support

EasyCaddy is a small, unofficial community project. Support is best-effort and
there is no guaranteed response time or paid support agreement.

## Where to ask

- **Bug reports and feature requests:** use the repository issue forms.
- **Security reports:** use GitHub private vulnerability reporting as described
  in [SECURITY.md](SECURITY.md). Do not open a public issue for an exploitable
  problem.
- **Caddy configuration and module questions:** consult the
  [Caddy documentation](https://caddyserver.com/docs/) and the upstream plugin
  repositories first. Questions that are not specific to this packaging
  project are better answered upstream.
- **Installation problems:** include the output of `install.sh`, the
  distribution name/version, `dpkg --print-architecture`, `apt-cache policy
  caddy`, `caddy version`, and relevant logs with secrets removed.

## Not supported

- Custom plugin combinations that are not in `config/plugins.lock.json`.
- Architectures or distributions that have not been tested; see
  [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md).
- Recovering data after `uninstall.sh --purge --yes` or after manual deletion of
  `/etc/caddy`, certificates or site data.
- Problems caused by running `caddy upgrade`, which replaces this custom build
  with the official binary and removes the additional modules.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.
