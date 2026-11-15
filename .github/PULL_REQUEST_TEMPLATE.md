## Summary

<!-- What does this pull request change, and why? -->

## Type of change

- [ ] Plugin set / workflow change
- [ ] Packaging or APT repository change
- [ ] CI / quality tooling
- [ ] Documentation
- [ ] Security fix

## Testing

<!-- Describe what you ran. For packaging changes, include lintian output. -->

- [ ] `bash -n` on every modified shell script
- [ ] `actionlint` on `.github/workflows/build.yml`
- [ ] `lintian` on the rebuilt amd64 `.deb`
- [ ] Built and validated a Caddyfile with `caddy validate`
- [ ] Tested the APT repository with `apt-get update` and `apt-get install --reinstall caddy`

## Checklist

- [ ] I updated `CHANGELOG.md` for user-visible changes.
- [ ] I updated the relevant README files (`README.md`, `README_ZH.md`, `README_JA.md`, `README_KR.md`) if behaviour or installation changed.
- [ ] No secrets, private keys, tokens or personal data are included.
- [ ] New plugins are not already part of the standard Caddy build.
- [ ] The package version still matches the upstream Caddy release tag.
