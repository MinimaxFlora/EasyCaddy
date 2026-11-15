#!/usr/bin/env bash
# Static quality checks used by the pull-request CI workflow.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"
fail=0
note() { printf '[ci] %s\n' "$*"; }
bad() { printf '[ci] FAIL: %s\n' "$*" >&2; fail=1; }

note "shell syntax"
for script in .github/scripts/*.sh .github/scripts/ci/*.sh pages/*.sh; do
  [ -e "$script" ] || continue
  bash -n "$script" || bad "bash -n $script"
done

note "shellcheck"
if command -v shellcheck >/dev/null 2>&1; then
  shellcheck -x .github/scripts/*.sh .github/scripts/ci/*.sh pages/*.sh \
    || bad "shellcheck reported errors"
else
  bad "shellcheck is not installed"
fi

note "actionlint"
if command -v actionlint >/dev/null 2>&1; then
  actionlint -color .github/workflows/*.yml || bad "actionlint reported errors"
elif [ -x /tmp/actionlint ]; then
  /tmp/actionlint -color .github/workflows/*.yml || bad "actionlint reported errors"
else
  bad "actionlint is not installed"
fi

note "yamllint"
if command -v yamllint >/dev/null 2>&1; then
  yamllint -c .yamllint .github/workflows .github/dependabot.yml .github/actionlint.yaml \
    || bad "yamllint reported errors"
else
  bad "yamllint is not installed"
fi

note "yaml parse"
python3 - <<'PY' || bad "YAML parse failed"
import pathlib, yaml
for path in list(pathlib.Path(".github/workflows").glob("*.yml")) + [
    pathlib.Path(".github/dependabot.yml"),
    pathlib.Path(".github/actionlint.yaml"),
    pathlib.Path(".github/ISSUE_TEMPLATE/config.yml"),
    pathlib.Path(".github/ISSUE_TEMPLATE/bug_report.yml"),
    pathlib.Path(".github/ISSUE_TEMPLATE/feature_request.yml"),
]:
    with open(path, encoding="utf-8") as fh:
        yaml.safe_load(fh)
    print("OK", path)
PY

note "repository configuration"
python3 .github/scripts/ci/check-config.py || bad "configuration consistency failed"

note "secret scan"
patterns=(
  'BEGIN PGP PRIVATE KEY'
  'BEGIN RSA PRIVATE KEY'
  'BEGIN OPENSSH PRIVATE KEY'
  'cfat_'
  'ghp_'
  'github_pat_'
  'AKIA[0-9A-Z]{16}'
  'xox[baprs]-'
)
for pattern in "${patterns[@]}"; do
  hits="$(grep -RIlE --exclude-dir=.git --exclude-dir=.tmp --exclude-dir=node_modules \
    --exclude=static-checks.sh "$pattern" . 2>/dev/null || true)"
  if [ -n "$hits" ]; then
    bad "possible secret matching '$pattern' in: $hits"
  fi
done

note "script modes"
for script in .github/scripts/*.sh .github/scripts/ci/*.sh pages/*.sh; do
  [ -e "$script" ] || continue
  mode="$(git ls-files -s -- "$script" | awk '{print $1}')"
  [ "$mode" = "100755" ] || bad "$script is not tracked as executable (mode $mode)"
done

note "whitespace"
git diff --check || bad "git diff --check failed"

if [ "$fail" -ne 0 ]; then
  exit 1
fi
note "all static checks passed"
