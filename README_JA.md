# EasyCaddy

[English](README.md) | [简体中文](README_ZH.md) | [日本語](README_JA.md) | [한국어](README_KR.md)

[![Build Caddy with plugins](https://github.com/MinimaxFlora/EasyCaddy/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/MinimaxFlora/EasyCaddy/actions/workflows/build.yml)
[![Latest release](https://img.shields.io/github/v/release/MinimaxFlora/EasyCaddy)](https://github.com/MinimaxFlora/EasyCaddy/releases/latest)

[Caddy](https://github.com/caddyserver/caddy) の公式ソースに厳選したサードパーティ
モジュールを組み込んだ非公式ビルドです。`.deb` パッケージとして配布し、署名付き APT
リポジトリで公開しています。

**https://caddy.tatalvpai.vip**

- 上流の最新リリースを自動追跡（毎週月曜 03:00 UTC、手動実行も可能）
- リリースタグは上流と同一（例: `v2.11.9`）
- Linux 8 アーキテクチャをビルドし、APT インデックスは 7 アーキテクチャを収録
- パッケージ名とバージョンは上流と同一（`caddy 2.11.9`）。APT pin と `--reinstall` で
  このリポジトリのビルドを選択
- APT インデックスは専用 GPG キーで署名

## インストール

ワンコマンド:

```bash
curl -fsSL https://caddy.tatalvpai.vip/install.sh | sudo bash
```

手動でリポジトリを設定する場合:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://caddy.tatalvpai.vip/public.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/easycaddy-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/easycaddy-archive-keyring.gpg] https://caddy.tatalvpai.vip/ ./" \
  | sudo tee /etc/apt/sources.list.d/easycaddy.list
printf 'Package: caddy\nPin: origin "caddy.tatalvpai.vip"\nPin-Priority: 1001\n' \
  | sudo tee /etc/apt/preferences.d/easycaddy
sudo chmod o+r /usr/share/keyrings/easycaddy-archive-keyring.gpg
sudo chmod o+r /etc/apt/sources.list.d/easycaddy.list
sudo apt update
sudo apt install --reinstall caddy
```

バージョンが上流と同一のため、同じバージョンの公式パッケージが既にインストールされている
場合、通常の `apt install caddy` では何も行われません。`--reinstall` を付けることで、
このリポジトリのパッケージが強制的に展開されます。APT pin により、公式 Caddy リポジトリを
再度有効にしてもこのリポジトリが優先されます。

確認:

```bash
caddy version
caddy list-modules | grep -E 'dns.providers|rate_limit|security|layer4|dynamic_dns|webdav|cache|geoip2|cloudflare'
```

> **公式 Caddy APT リポジトリを同時に有効にしないでください。** 両方とも同じ名前・同じ
> バージョンの `caddy` パッケージを提供します。`install.sh` は
> `/etc/apt/sources.list.d/caddy-stable.list` を `.disabled-by-easycaddy` にリネームし、
> 上記の pin を書き込みます。手動で設定する場合も pin を追加してください。
>
> `caddy upgrade` は実行しないでください。公式のバイナリをダウンロードして上書きするため、
> 追加モジュールが失われます。アップグレードには
> `sudo apt install --only-upgrade caddy` を使用してください。

### アップグレードとダウングレード

```bash
sudo apt update
sudo apt install --only-upgrade caddy
apt-cache policy caddy
```

Pages サイトには直近 3 バージョンを保持します。それより古い `.deb` は対応する GitHub
Release からダウンロードできます。

## プラグイン

| モジュール | 用途 |
| --- | --- |
| `github.com/caddy-dns/cloudflare` | Cloudflare DNS-01 |
| `github.com/caddy-dns/alidns` | Alibaba Cloud DNS-01 |
| `github.com/caddy-dns/tencentcloud` | Tencent Cloud DNSPod DNS-01 |
| `github.com/mholt/caddy-ratelimit` | `rate_limit` によるリクエスト制限 |
| `github.com/greenpau/caddy-security` | 認証・認可・MFA・OAuth ポータル |
| `github.com/mholt/caddy-l4` | レイヤー4 TCP/UDP プロキシ |
| `github.com/mholt/caddy-dynamicdns` | ダイナミック DNS |
| `github.com/mholt/caddy-webdav` | WebDAV ファイル配信 |
| `github.com/caddyserver/cache-handler` | HTTP キャッシュ |
| `github.com/zhangjiayin/caddy-geoip2` | GeoIP2 マッチャー |
| `github.com/WeidiDeng/caddy-cloudflare-ip` | Cloudflare 経由の実クライアント IP を復元 |

プラグインのバージョンは**固定していません**。各ビルドで各リポジトリのデフォルトブランチ
を解決します（`--with github.com/caddy-dns/cloudflare` の既定動作と同じ）。再現性が必要な
場合は `.github/workflows/build.yml` の `PLUGINS` に `@v1.2.3` や `@<commit>` を付けて
ください。

## アーキテクチャ

ビルドおよび Release アセット: `amd64`、`arm64`、`armv7`、`armv6`、`armv5`、`ppc64le`、
`riscv64`、`s390x`。

APT インデックスは `armv6` を除くすべてのアーキテクチャを収録します。上流は ARMv6 と
ARMv7 の両方を Debian アーキテクチャ `armhf` として提供しており、同名・同バージョン・
同アーキテクチャの 2 パッケージを 1 つのインデックスに共存させることはできません。
ARMv7 を APT で提供し、ARMv6 の `.deb` と `.tar.gz` は GitHub Release で配布します。

## 仕組み

1. `.github/workflows/build.yml` が上流の最新リリースタグ（または `workflow_dispatch` で
   指定したタグ）を解決します。
2. マトリックスジョブが workflow の `PLUGINS` 環境変数のモジュール群を使って、
   8 つの Linux アーキテクチャ向けに `xcaddy build` を実行します。
3. `.github/scripts/make-deb.sh` が対応する公式 Caddy の `.deb` をダウンロードし、
   `/usr/bin/caddy` を独自バイナリに置き換え、Debian Policy の修正を適用し、
   チェックサムを再生成して再パッケージします。
4. リリースジョブが `.deb`、`.tar.gz`、SHA-256 チェックサムを含む GitHub Release を公開します。
5. `.github/scripts/make-apt-repo.sh` が現行と過去 2 バージョンの deb を取得し、
   `Packages` / `Packages.gz` を生成、`Release` と `InRelease` を署名して GitHub Pages に
   デプロイします。

## リポジトリ構成

```text
.github/workflows/build.yml        ビルド・リリース・Pages デプロイ
.github/scripts/make-deb.sh        公式 deb をテンプレートに再パッケージ
.github/scripts/make-apt-repo.sh   deb 収集・インデックス生成・署名
.github/ISSUE_TEMPLATE/            Issue フォーム
.github/CODEOWNERS                 レビュー担当
.github/FUNDING.yml                スポンサー情報
.github/PULL_REQUEST_TEMPLATE.md   PR チェックリスト
.github/dependabot.yml             GitHub Actions の週次更新
.github/actionlint.yaml            actionlint 設定
pages/index.html                   APT リポジトリのトップページ
pages/install.sh                   ユーザー向けインストーラー
public.key                         APT リポジトリ署名用公開鍵
README.md / README_ZH.md / README_JA.md / README_KR.md
CONTRIBUTING.md                    コントリビューションガイド
CHANGELOG.md                       リリース履歴
```

## リポジトリのメンテナンス

署名用公開鍵は `public.key` としてコミットされています:

```text
5D07 1390 261F C2DE BE57  7C7B 129D C816 26FF 07EE
EasyCaddy Repository <easycaddy@users.noreply.github.com>
```

1. 秘密鍵を Actions secret `GPG_PRIVATE_KEY` に登録します。パスフレーズはなく、オフラインで
   バックアップしてください。リポジトリには絶対にコミットしないでください。
2. **Settings → Pages → Build and deployment** で **GitHub Actions** を選択し、
   カスタムドメインに `caddy.tatalvpai.vip` を設定します。
3. Cloudflare で `caddy.tatalvpai.vip` から `minimaxflora.github.io` への `CNAME` レコードを
   作成します。GitHub が TLS 証明書を発行する間は DNS のみ（グレークラウド）にし、
   完了後にプロキシを有効にできます。
4. **Actions → Build Caddy with plugins → Run workflow** を一度実行します。

手動操作:

- **特定バージョンをビルド**: `upstream_version` に `v2.11.9` などを指定。
- **既存 Release を強制再ビルド**: `force` を有効化。Release アセットを上書きし、
  インデックスを再生成します。
- **プラグイン追加**: `PLUGINS` に 1 行 1 モジュールで追加。Caddy 標準ビルドに含まれる
  モジュールは追加しないでください。
- **保持バージョン数の変更**: `KEEP_VERSIONS`（既定 `3`）を変更。GitHub Pages には 1 GB の
  ソフトリミットがあり、1 バージョンあたり 7 パッケージで約 140 MB です。
- **公開 URL の変更**: workflow の `PAGES_BASE_URL`、`pages/install.sh` の `BASE_URL` と
  pin の origin、Pages のカスタムドメイン、各 README のリンクを更新します。

### 署名キーのローテーション

```bash
gpg --batch --gen-key <<'EOF'
%no-protection
Key-Type: RSA
Key-Length: 4096
Key-Usage: sign
Name-Real: EasyCaddy Repository
Name-Email: easycaddy@users.noreply.github.com
Expire-Date: 0
%commit
EOF
gpg --armor --export-secret-keys easycaddy@users.noreply.github.com > easycaddy-private.asc
gpg --armor --export easycaddy@users.noreply.github.com > public.key
```

`GPG_PRIVATE_KEY` secret を更新し、新しい `public.key` をコミットして workflow を再実行します。
既存のインストール環境では新しい鍵をダウンロードし、`signed-by` の keyring を更新する必要が
あります。

## 品質チェック

再パッケージ工程では上流 deb をそのまま転包するのではなく、Debian Policy の修正を適用します:

- systemd unit を `/lib/systemd/system` から `/usr/lib/systemd/system` へ移動
- bash completion を廃止された `/etc/bash_completion.d` から
  `/usr/share/bash-completion/completions` へ移動
- `copyright`、`changelog.gz`、Extended Description を追加
- man page を `gzip -9n` で再圧縮
- maintainer script の `chown -R` をディレクトリのみの `chown` に変更
- Go の静的バイナリなど固有の項目は lintian override で対応

Debian 13 + lintian 2.122.0 で amd64 パッケージは **0 error / 0 warning** です。CI でも
amd64 ビルド後に lintian を実行します（advisory、公開はブロックしません。レポート
`lintian.txt` はビルド artifact に含まれます）。`actionlint`、YAML パース、`bash -n` は
[CONTRIBUTING.md](CONTRIBUTING.md) に記載しています。

## 制限事項

- 非公式ビルドであり、保証はありません。本番環境では事前にテストしてください。
- プラグインのバージョンはビルド時に解決されるため、既定では再現可能ではありません。
- `caddy-geoip2` は MaxMind GeoLite2 / GeoIP2 データベースを別途用意する必要があります。
- `greenpau/caddy-security` はバイナリサイズとビルド時間を大幅に増やします。
- 定期実行は上流に**新しい**リリースタグが現れた場合のみビルドします。同名の Release が
  既にある場合は `force` を有効にしない限りスキップされます。
- Release のタグはこのパッケージングリポジトリのコミットを指します。上流のソースは
  xcaddy がタグで取得します。
- 上流が特定アーキテクチャの公式 `.deb` を提供しなくなった場合、そのビルドは明示的な
  エラーで失敗します。その場合は自前の deb テンプレートが必要になります。

## コントリビューション

バグ報告、プラグインの要望、Pull Request を歓迎します。
[CONTRIBUTING.md](CONTRIBUTING.md)、Issue テンプレート、[CHANGELOG.md](CHANGELOG.md) を
参照してください。

- リポジトリ: https://github.com/MinimaxFlora/EasyCaddy
- リリース: https://github.com/MinimaxFlora/EasyCaddy/releases
- APT リポジトリ: https://caddy.tatalvpai.vip
- 上流 Caddy: https://github.com/caddyserver/caddy
- Caddy ドキュメント: https://caddyserver.com/docs/
