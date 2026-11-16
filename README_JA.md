<p align="center">
  <a href="https://caddyserver.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/caddy-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="assets/caddy-light.svg">
      <img src="assets/caddy-light.svg" alt="Caddy" width="550">
    </picture>
  </a>
  <br>
  <h3 align="center">EasyCaddy — プラグイン入り Caddy の非公式ビルド</h3>
</p>

<p align="center">
  <a href="https://github.com/MinimaxFlora/EasyCaddy/actions/workflows/build.yml"><img src="https://github.com/MinimaxFlora/EasyCaddy/actions/workflows/build.yml/badge.svg?branch=master" alt="Build Caddy with plugins"></a>
  &nbsp;
  <a href="https://github.com/MinimaxFlora/EasyCaddy/releases/latest"><img src="https://img.shields.io/github/v/release/MinimaxFlora/EasyCaddy" alt="Latest release"></a>
  &nbsp;
  <a href="https://caddy.tatalvpai.vip"><img src="https://img.shields.io/badge/APT-caddy.tatalvpai.vip-3d6b50" alt="APT repository"></a>
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README_ZH.md">简体中文</a> ·
  <a href="README_JA.md">日本語</a> ·
  <a href="README_KR.md">한국어</a>
</p>

<p align="center">
  <a href="#インストール">インストール</a> ·
  <a href="#プラグイン">プラグイン</a> ·
  <a href="#アーキテクチャ">アーキテクチャ</a> ·
  <a href="#品質チェック">品質チェック</a> ·
  <a href="#コントリビューション">コントリビューション</a>
</p>

> **非公式ビルド。** EasyCaddy は Caddy プロジェクトと提携しておらず、承認も受けていません。Caddy の名称とロゴは Stack Holdings GmbH の商標です。

<hr>

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

### アンインストールと復元

```bash
curl -fsSL https://caddy.tatalvpai.vip/uninstall.sh | sudo bash
```

既定ではパッケージを削除し（設定は purge しません）、EasyCaddy のソース/pin/keyring を
削除し、インストーラーがバックアップしたファイルを復元します。`/etc/caddy`、
`/var/lib/caddy`、証明書、ログ、サイトデータは保持されます。`--dry-run` で確認できます。
設定の削除には `--purge` と `--yes` の両方が必要です。

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

プラグインのバージョンは [`config/plugins.lock.json`](config/plugins.lock.json) に固定され、
CI が Caddy `v2.11.9` との組み合わせを検証します。ロックには用途、上流、ライセンス、
メンテナンス状態、スモークテスト用モジュールも記録されています。変更時はロックを更新し、
`force` で再ビルドしてください。

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
2. `config/build-matrix.json` のマトリックスが `config/plugins.lock.json` の固定版で
   8 つの Linux アーキテクチャ向けに `xcaddy build` を実行します。
3. `.github/scripts/make-deb.sh` が公式 `.deb` とその SHA-512 を検証し、
   `/usr/bin/caddy` を置き換え、Debian Policy の修正、ビルド/プラグイン情報の記録、
   チェックサム再生成を行います。
4. リリースジョブが `.deb`、`.tar.gz`、SHA-256、CycloneDX SBOM、ビルド情報、
   ロック/ツールチェーン/マトリクスを GitHub Release として公開します。
5. `.github/scripts/make-apt-repo.sh` が SemVer で現行と過去バージョンを保持し、
   全 APT アーキテクチャのパッケージ存在を検証し、`GPG_KEY_FINGERPRINT` の鍵で署名して
   GitHub Pages にデプロイします。

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
assets/caddy-light.svg             README ワードマーク（ライト）
assets/caddy-dark.svg              README ワードマーク（ダーク）
pages/index.html                   セマンティックなページ構造
pages/assets/site.css              デザイントークンとコンポーネント
pages/assets/site.js               テーマ、ナビ、タブ、コピー操作
pages/assets/theme.js              初回描画前のテーマ初期化
pages/assets/i18n.js               5 言語の翻訳
pages/assets/mascot.png            透明マスコット（hero のフローティング要素のみ）
pages/assets/caddy.svg             Caddy ブランドアイコンと favicon
pages/assets/og.png                1200×630 Open Graph 共有画像
pages/install.sh                   ユーザー向けインストーラー
pages/uninstall.sh                 安全なアンインストール/復元
pages/diagnose.sh                  読み取り専用の診断
pages/robots.txt                   クローラーポリシー
pages/sitemap.xml                  サイトマップ
README.md / README_ZH.md / README_JA.md / README_KR.md
CONTRIBUTING.md                    コントリビューションガイド
CHANGELOG.md                       リリース履歴
```

## リポジトリのメンテナンス

署名鍵のフィンガープリント:

```text
5D07 1390 261F C2DE BE57  7C7B 129D C816 26FF 07EE
EasyCaddy Repository <easycaddy@users.noreply.github.com>
```

公開鍵はリポジトリにコミットせず、Actions secret `GPG_PUBLIC_KEY` に保存し、Pages が
`https://caddy.tatalvpai.vip/public.key` として公開します。各デプロイで秘密鍵・公開鍵・
フィンガープリントを照合します。

1. 秘密鍵を Actions secret `GPG_PRIVATE_KEY` に登録します。パスフレーズはなく、オフラインで
   バックアップしてください。リポジトリには絶対にコミットしないでください。
2. ASCII-armored 公開鍵を Actions secret `GPG_PUBLIC_KEY` に登録します。
3. 完全なフィンガープリントを repository variable `GPG_KEY_FINGERPRINT` に登録します。
4. **Settings → Pages → Build and deployment** で **GitHub Actions** を選択し、
   カスタムドメインに `caddy.tatalvpai.vip` を設定します。
5. Cloudflare で `caddy.tatalvpai.vip` から `minimaxflora.github.io` への `CNAME` レコードを
   作成します。GitHub が TLS 証明書を発行する間は DNS のみ（グレークラウド）にし、
   完了後にプロキシを有効にできます。
6. **Actions → Build Caddy with plugins → Run workflow** を一度実行します。

手動操作:

- **特定バージョンをビルド**: `upstream_version` に `v2.11.9` などを指定。
- **既存 Release を強制再ビルド**: `force` を有効化。Release アセットを上書きし、
  インデックスを再生成します。
- **プラグインの追加・更新**: `config/plugins.lock.json` を変更し、現在の tag を
  `force` で再ビルドします。Caddy 標準ビルドに含まれるモジュールは追加しないでください。
- **ツールチェーンの固定・更新**: `config/toolchain.json` を変更します。
- **保持バージョン数の変更**: `config/build-matrix.json` の `keep_versions`（既定 `3`）を
  変更します。GitHub Pages には 1 GB のソフトリミットがあり、1 バージョンあたり 7
  パッケージで約 140 MB です。
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

`GPG_PRIVATE_KEY` と `GPG_PUBLIC_KEY` secret、`GPG_KEY_FINGERPRINT` variable を更新して
workflow を再実行します。Pages が新しい公開鍵を再公開します。既存のインストール環境では
新しい鍵をダウンロードし、`signed-by` の keyring を更新する必要があります。

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
- プラグインのバージョンは固定されていますが、Go バイナリの完全な再現性はツールチェーン、
  タイムスタンプ、上流のビルド環境に依存します。ビルド情報、チェックサム、SBOM を公開します。
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
