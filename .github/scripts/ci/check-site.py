#!/usr/bin/env python3
"""Validate a generated EasyCaddy Pages/APT site directory."""
import hashlib
import json
import pathlib
import re
import sys

if len(sys.argv) != 2:
    print("usage: check-site.py <site-dir>", file=sys.stderr)
    sys.exit(2)

site = pathlib.Path(sys.argv[1]).resolve()
root = pathlib.Path(__file__).resolve().parents[3]
errors = []


def fail(message):
    errors.append(message)


html = (site / "index.html").read_text(encoding="utf-8")
for placeholder in ("@VERSION@", "@DATE@", "@PAGES_BASE_URL@"):
    if placeholder in html:
        fail(f"index.html: unreplaced {placeholder}")
if "<style" in html:
    fail("index.html: inline <style> is not allowed")
if re.search(r'\sstyle="', html):
    fail("index.html: inline style attribute is not allowed")
if "\n<script>\n" in html:
    fail("index.html: inline interaction script is not allowed")

for asset in sorted(set(re.findall(r'(?:src|href)="(assets/[^"]+)"', html))):
    if not (site / asset).is_file():
        fail(f"missing referenced asset: {asset}")

for required in (
    "assets/site.css", "assets/site.js", "assets/theme.js", "assets/field.js",
    "assets/i18n.js", "assets/caddy.svg", "assets/og.png", "install.sh", "uninstall.sh",
    "robots.txt", "sitemap.xml", "Packages", "Packages.gz",
    "Release", "InRelease", "Release.gpg", "public.key",
):
    if not (site / required).is_file():
        fail(f"missing site file: {required}")

match = re.search(r'<script type="application/ld\+json">\s*(.*?)\s*</script>', html, re.S)
if not match:
    fail("index.html: JSON-LD missing")
else:
    try:
        data = json.loads(match.group(1))
        if data.get("@type") != "SoftwareApplication":
            fail("index.html: JSON-LD is not a SoftwareApplication")
        if not data.get("softwareVersion"):
            fail("index.html: JSON-LD softwareVersion missing")
    except Exception as exc:  # noqa: BLE001
        fail(f"index.html: invalid JSON-LD: {exc}")

with open(root / "config/plugins.lock.json", encoding="utf-8") as fh:
    lock = json.load(fh)
for plugin in lock["plugins"]:
    if plugin["module"] not in html:
        fail(f"index.html: plugin module not present: {plugin['module']}")

with open(root / "config/build-matrix.json", encoding="utf-8") as fh:
    matrix = json.load(fh)
for arch in matrix["architectures"]:
    if arch["id"] not in html:
        fail(f"index.html: architecture not present: {arch['id']}")

robots = (site / "robots.txt").read_text(encoding="utf-8")
sitemap = (site / "sitemap.xml").read_text(encoding="utf-8")
if "Sitemap:" not in robots:
    fail("robots.txt: Sitemap entry missing")
if "@PAGES_BASE_URL@" in robots or "@PAGES_BASE_URL@" in sitemap:
    fail("robots/sitemap: unreplaced @PAGES_BASE_URL@")
if "<urlset" not in sitemap:
    fail("sitemap.xml: urlset missing")

# Parse Packages and verify every referenced .deb exists with a matching size/hash.
packages_path = site / "Packages"
if packages_path.is_file():
    paragraphs = [p for p in packages_path.read_text(encoding="utf-8").split("\n\n") if p.strip()]
    seen_arch = set()
    for paragraph in paragraphs:
        fields = {}
        for line in paragraph.splitlines():
            if ": " in line:
                key, value = line.split(": ", 1)
                fields[key] = value
        filename = fields.get("Filename")
        if not filename:
            fail("Packages: entry without Filename")
            continue
        deb = site / filename
        if not deb.is_file():
            fail(f"Packages: referenced file missing: {filename}")
            continue
        data = deb.read_bytes()
        if str(len(data)) != fields.get("Size"):
            fail(f"Packages: size mismatch for {filename}")
        if hashlib.sha256(data).hexdigest() != fields.get("SHA256"):
            fail(f"Packages: SHA256 mismatch for {filename}")
        seen_arch.add(fields.get("Architecture"))
        if "linux_armv6" in filename:
            fail(f"Packages: ARMv6 package must not be indexed: {filename}")
    expected = {a["debarch"] for a in matrix["architectures"] if a["apt"]}
    missing = expected - seen_arch
    if missing:
        fail(f"Packages: missing architectures: {', '.join(sorted(missing))}")

if errors:
    print("site validation FAILED")
    for error in errors:
        print(" -", error)
    sys.exit(1)
print(f"site OK: {len(html)} bytes of HTML, {len(list((site / 'assets').iterdir()))} assets")
