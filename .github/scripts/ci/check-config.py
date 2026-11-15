#!/usr/bin/env python3
"""Validate EasyCaddy's authoritative configuration and doc consistency."""
import json
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parents[3]
errors = []


def load(path):
    try:
        with open(root / path, encoding="utf-8") as fh:
            return json.load(fh)
    except Exception as exc:  # noqa: BLE001
        errors.append(f"{path}: {exc}")
        return {}


toolchain = load("config/toolchain.json")
matrix = load("config/build-matrix.json")
lock = load("config/plugins.lock.json")

for field in ("go", "xcaddy", "syft", "runner"):
    if not toolchain.get(field):
        errors.append(f"toolchain.json: missing {field}")

architectures = matrix.get("architectures", [])
if len(architectures) != 8:
    errors.append(f"build-matrix.json: expected 8 architectures, got {len(architectures)}")
seen_ids, seen_assets, seen_arch = set(), set(), set()
for arch in architectures:
    for field in ("id", "goarch", "asset", "debarch", "apt"):
        if field not in arch:
            errors.append(f"build-matrix.json: entry {arch.get('id', '?')} missing {field}")
    if arch.get("id") in seen_ids:
        errors.append(f"build-matrix.json: duplicate id {arch.get('id')}")
    if arch.get("asset") in seen_assets:
        errors.append(f"build-matrix.json: duplicate asset {arch.get('asset')}")
    seen_ids.add(arch.get("id"))
    seen_assets.add(arch.get("asset"))
    if arch.get("apt"):
        seen_arch.add(arch.get("debarch"))
    if arch.get("id") == "armv6" and arch.get("apt"):
        errors.append("build-matrix.json: armv6 must not enter the APT index")
    if not arch.get("apt") and not arch.get("exclusion_reason"):
        errors.append(f"build-matrix.json: non-APT arch {arch.get('id')} needs exclusion_reason")
if not matrix.get("keep_versions"):
    errors.append("build-matrix.json: keep_versions is required")

plugins = lock.get("plugins", [])
if len(plugins) != 11:
    errors.append(f"plugins.lock.json: expected 11 plugins, got {len(plugins)}")
seen_modules = set()
for plugin in plugins:
    for field in ("name", "module", "version", "purpose", "upstream", "license",
                  "maintenance", "caddy_compatibility", "smoke_modules"):
        if not plugin.get(field):
            errors.append(f"plugins.lock.json: {plugin.get('module', '?')} missing {field}")
    module = plugin.get("module")
    if module in seen_modules:
        errors.append(f"plugins.lock.json: duplicate module {module}")
    seen_modules.add(module)
    if not re.match(r"^github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", module or ""):
        errors.append(f"plugins.lock.json: invalid module path {module}")
    if not re.match(r"^(v[0-9]+\.[0-9]+\.[0-9]+|v[0-9]+\.[0-9]+\.[0-9]+-[0-9A-Za-z.-]+|[0-9a-f]{40})$",
                    plugin.get("version", "")):
        errors.append(f"plugins.lock.json: suspicious version {plugin.get('version')} for {module}")
if lock.get("verified_caddy") != "v2.11.9":
    errors.append("plugins.lock.json: verified_caddy should record the tested Caddy version")

# Page and documentation must mention every locked module.
page = (root / "pages/index.html").read_text(encoding="utf-8")
for module in seen_modules:
    if module not in page:
        errors.append(f"pages/index.html: locked module not documented: {module}")
    for readme in ("README.md", "README_ZH.md", "README_JA.md", "README_KR.md"):
        text = (root / readme).read_text(encoding="utf-8")
        if module not in text:
            errors.append(f"{readme}: locked module not documented: {module}")

for arch in architectures:
    if arch.get("id") not in page:
        errors.append(f"pages/index.html: architecture not documented: {arch.get('id')}")
    for readme in ("README.md", "README_ZH.md", "README_JA.md", "README_KR.md"):
        text = (root / readme).read_text(encoding="utf-8")
        if arch.get("id") not in text:
            errors.append(f"{readme}: architecture not documented: {arch.get('id')}")

workflow = (root / ".github/workflows/build.yml").read_text(encoding="utf-8")
for path in ("config/toolchain.json", "config/build-matrix.json", "config/plugins.lock.json"):
    if path not in workflow:
        errors.append(f".github/workflows/build.yml: must consume {path}")
if "PLUGINS: |" in workflow:
    errors.append(".github/workflows/build.yml: duplicate plugin list found; use plugins.lock.json")
if "go-version: stable" in workflow:
    errors.append(".github/workflows/build.yml: Go version must come from toolchain.json")

if errors:
    print("configuration validation FAILED")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print(f"configuration OK: {len(architectures)} architectures, {len(plugins)} plugins, "
      f"Go {toolchain['go']}, xcaddy {toolchain['xcaddy']}")
