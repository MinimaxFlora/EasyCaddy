#!/usr/bin/env python3
"""Verify that a built Caddy binary embeds the locked module versions."""
import json
import pathlib
import re
import subprocess
import sys

if len(sys.argv) != 3:
    print("usage: verify-build.py <caddy-binary> <plugins.lock.json>", file=sys.stderr)
    sys.exit(2)

binary = pathlib.Path(sys.argv[1])
lock_path = pathlib.Path(sys.argv[2])
with open(lock_path, encoding="utf-8") as fh:
    lock = json.load(fh)

result = subprocess.run(["go", "version", "-m", str(binary)], text=True,
                        capture_output=True, check=False)
if result.returncode != 0:
    print(result.stderr, file=sys.stderr)
    sys.exit(f"cannot read build info from {binary}")

deps = {}
for line in result.stdout.splitlines():
    parts = line.split()
    if len(parts) >= 3 and parts[0] == "dep":
        deps[parts[1]] = parts[2]

errors = []
for plugin in lock["plugins"]:
    module = plugin["module"]
    expected = plugin["version"]
    actual = deps.get(module)
    if actual != expected:
        errors.append(f"{module}: expected {expected}, got {actual or 'missing'}")

caddy = deps.get("github.com/caddyserver/caddy/v2")
if caddy != lock["verified_caddy"]:
    errors.append(f"caddy: expected {lock['verified_caddy']}, got {caddy or 'missing'}")

if errors:
    print("build verification FAILED")
    for error in errors:
        print(" -", error)
    sys.exit(1)
print(f"build OK: Caddy {caddy}, {len(lock['plugins'])} locked plugins")
