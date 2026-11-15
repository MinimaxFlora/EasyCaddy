# EasyCaddy

[English](README.md) | [简体中文](README_ZH.md) | [日本語](README_JA.md) | [한국어](README_KR.md)

[![Build Caddy with plugins](https://github.com/MinimaxFlora/EasyCaddy/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/MinimaxFlora/EasyCaddy/actions/workflows/build.yml)
[![Latest release](https://img.shields.io/github/v/release/MinimaxFlora/EasyCaddy)](https://github.com/MinimaxFlora/EasyCaddy/releases/latest)

用 Caddy 官方源码加一组精选第三方模块编译的非官方构建，产出 `.deb` 并通过签名 APT 仓库发布：

**https://caddy.tatalvpai.vip**

- 自动跟随上游最新 release（每周一 UTC 03:00 检查，也可手动触发）
- 本仓库的 tag / Release 与上游完全同名，例如 `v2.11.9`
- 构建 8 个 Linux 架构，APT 索引覆盖其中 7 个
- 包名和版本与官方一致（`caddy 2.11.9`），通过 APT pin 和 `--reinstall` 选中本仓库构建
- APT 索引使用专用 GPG 密钥签名

## 安装

一条命令：

```bash
curl -fsSL https://caddy.tatalvpai.vip/install.sh | sudo bash
```

或者手动配置：

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

因为版本号和官方相同，如果机器上已经装了官方同版本 `caddy`，普通的
`apt install caddy` 会认为“已是最新”而不做任何事；`--reinstall` 才会真正换成带插件的构建。
APT pin 保证即使之后重新启用官方源，也仍然优先选择本仓库的包。

验证：

```bash
caddy version
caddy list-modules | grep -E 'dns.providers|rate_limit|security|layer4|dynamic_dns|webdav|cache|geoip2|cloudflare'
```

> **不要同时启用官方 Caddy APT 源。** 两个源的包名和版本都相同。`install.sh` 会把
> `/etc/apt/sources.list.d/caddy-stable.list` 改名为 `.disabled-by-easycaddy`，并写入上面的 pin。
> 手动安装的用户请自行添加 pin。
>
> 不要执行 `caddy upgrade`：它会从官方下载不带插件的二进制并覆盖当前文件。
> 升级请使用 `sudo apt install --only-upgrade caddy`。

### 升级与降级

```bash
sudo apt update
sudo apt install --only-upgrade caddy
apt-cache policy caddy
```

Pages 站点保留最近 3 个版本。更早的 `.deb` 可以从对应的 GitHub Release 下载。

## 内置插件

| 模块 | 用途 |
| --- | --- |
| `github.com/caddy-dns/cloudflare` | Cloudflare DNS-01 |
| `github.com/caddy-dns/alidns` | 阿里云 DNS-01 |
| `github.com/caddy-dns/tencentcloud` | 腾讯云 DNSPod DNS-01 |
| `github.com/mholt/caddy-ratelimit` | `rate_limit` 请求限流 |
| `github.com/greenpau/caddy-security` | 认证、授权、MFA 与 OAuth 门户 |
| `github.com/mholt/caddy-l4` | 四层 TCP/UDP 代理 |
| `github.com/mholt/caddy-dynamicdns` | 动态 DNS |
| `github.com/mholt/caddy-webdav` | WebDAV 文件服务 |
| `github.com/caddyserver/cache-handler` | HTTP 缓存 |
| `github.com/zhangjiayin/caddy-geoip2` | GeoIP2 匹配器 |
| `github.com/WeidiDeng/caddy-cloudflare-ip` | 恢复 Cloudflare 后真实客户端 IP |

插件版本**没有固定**，每次构建都解析各仓库默认分支的最新版本，与
`--with github.com/caddy-dns/cloudflare` 的默认行为一致。若希望构建可复现，可在
`.github/workflows/build.yml` 的 `PLUGINS` 中写成 `github.com/...@v1.2.3` 或 `@<commit>`。

## 架构

构建和 Release 资产：`amd64`、`arm64`、`armv7`、`armv6`、`armv5`、`ppc64le`、
`riscv64`、`s390x`。

APT 索引包含除 `armv6` 之外的所有架构。上游把 ARMv6 和 ARMv7 都标记为 Debian 架构
`armhf`，同包名、同版本、同架构的两个包不能共存于一个索引。ARMv7 通过 APT 提供；
ARMv6 的 `.deb` 和 `.tar.gz` 放在 GitHub Release 供手动下载。

## 工作方式

1. `.github/workflows/build.yml` 解析上游最新 release tag（或 `workflow_dispatch` 指定的 tag）。
2. 矩阵任务用 `xcaddy build` 为 8 个 Linux 架构编译，插件清单来自 workflow 的
   `PLUGINS` 环境变量。
3. `.github/scripts/make-deb.sh` 下载对应版本的官方 `.deb`，替换 `/usr/bin/caddy`，
   应用 Debian Policy 修复，重新计算校验和并打包。
4. Release 任务发布包含 `.deb`、`.tar.gz` 和 SHA-256 校验和的 GitHub Release。
5. `.github/scripts/make-apt-repo.sh` 下载当前及前两个版本的 deb，生成
   `Packages` / `Packages.gz`，用仓库密钥签名 `Release` 与 `InRelease`，然后部署到
   GitHub Pages。

## 仓库结构

```text
.github/workflows/build.yml        构建、发布与 Pages 部署
.github/scripts/make-deb.sh        以上游 deb 为模板重打包
.github/scripts/make-apt-repo.sh   收集 deb、生成索引并签名
.github/ISSUE_TEMPLATE/            Issue 表单
.github/CODEOWNERS                 代码审查归属
.github/FUNDING.yml                赞助信息
.github/PULL_REQUEST_TEMPLATE.md   PR 检查清单
.github/dependabot.yml             每周更新 GitHub Actions
.github/actionlint.yaml            actionlint 配置
pages/index.html                   APT 仓库首页
pages/install.sh                   用户安装脚本
public.key                         APT 仓库签名公钥
README.md / README_ZH.md / README_JA.md / README_KR.md
CONTRIBUTING.md                    贡献指南
CHANGELOG.md                       版本历史
```

## 仓库维护

签名公钥已提交为 `public.key`：

```text
5D07 1390 261F C2DE BE57  7C7B 129D C816 26FF 07EE
EasyCaddy Repository <easycaddy@users.noreply.github.com>
```

1. 把私钥写入 Actions secret `GPG_PRIVATE_KEY`。密钥没有 passphrase，请离线备份，且不要提交到仓库。
2. 在 **Settings → Pages → Build and deployment** 选择 **GitHub Actions**，自定义域名填
   `caddy.tatalvpai.vip`。
3. 在 Cloudflare 为 `caddy.tatalvpai.vip` 添加指向 `minimaxflora.github.io` 的 `CNAME`
   记录。GitHub 签发 TLS 证书期间建议使用仅 DNS（灰云）模式，证书就绪后再考虑开启代理。
4. 运行一次 **Actions → Build Caddy with plugins → Run workflow**。

手动操作：

- **构建指定版本**：在 `upstream_version` 填 `v2.11.9`。
- **强制重建已有 Release**：勾选 `force`，会覆盖 Release 资产并重新生成索引。
- **新增插件**：在 `PLUGINS` 中每行添加一个模块路径，不要添加 Caddy 标准构建已有的模块。
- **调整版本保留数**：修改 `KEEP_VERSIONS`（默认 `3`）。GitHub Pages 有 1 GB 软上限，
  每版本 7 个包约 140 MB。
- **更换公开地址**：同步修改 workflow 的 `PAGES_BASE_URL`、`pages/install.sh` 的
  `BASE_URL` 与 pin origin、Pages 自定义域名，以及各 README 中的链接。

### 轮换签名密钥

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

更新 `GPG_PRIVATE_KEY` secret、提交新的 `public.key`，然后重新运行 workflow。已安装的机器
需要重新下载公钥并更新 `signed-by` keyring。

## 质量检查

重打包阶段会主动应用 Debian Policy 修复，而不是原样转包上游：

- systemd unit 从 `/lib/systemd/system` 移到 `/usr/lib/systemd/system`
- bash completion 从已废弃的 `/etc/bash_completion.d` 移到 `/usr/share/bash-completion/completions`
- 补全 `copyright`、`changelog.gz` 和 Extended Description
- man page 用 `gzip -9n` 重新压缩
- maintainer script 中的 `chown -R` 改为只 chown 目录
- 用 lintian overrides 处理 Go 静态二进制等固有属性

在 Debian 13 + lintian 2.122.0 上，amd64 包为 **0 error / 0 warning**。CI 也会在 amd64
构建后运行 lintian（advisory，不阻塞发布，报告 `lintian.txt` 随构建 artifact 上传）。
`actionlint`、YAML 解析和 `bash -n` 见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 说明与限制

- 这是非官方构建，不提供任何担保；生产环境请先在测试机验证。
- 插件版本在构建时解析，默认不可复现。
- `caddy-geoip2` 需要自行提供 MaxMind GeoLite2/GeoIP2 数据库。
- `greenpau/caddy-security` 会显著增加二进制体积和构建时间。
- 定时任务只在上游出现**新** release tag 时构建；已存在同名 Release 时自动跳过，除非勾选 `force`。
- Release 的 tag 指向本打包仓库的提交，不是上游提交；上游源码由 xcaddy 按 tag 拉取。
- 上游若停止为某个架构提供官方 `.deb`，该架构构建会失败并给出明确错误；届时需要改为自建 deb 模板。

## 贡献

欢迎提交 Bug、插件请求和 Pull Request。请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)、
Issue 模板和 [CHANGELOG.md](CHANGELOG.md)。

- 仓库：https://github.com/MinimaxFlora/EasyCaddy
- Release：https://github.com/MinimaxFlora/EasyCaddy/releases
- APT 仓库：https://caddy.tatalvpai.vip
- 上游 Caddy：https://github.com/caddyserver/caddy
- Caddy 文档：https://caddyserver.com/docs/
