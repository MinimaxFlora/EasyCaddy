# EasyCaddy

用 xcaddy 编译带常用插件的 [Caddy](https://github.com/caddyserver/caddy)，产出 deb 包，并通过 GitHub Pages 提供可直接 `apt install` 的签名 APT 仓库。

- 自动跟随上游最新 release tag（每周一 UTC 03:00 检查，也可手动触发）
- 本仓库的 tag / release 与上游同名，例如 `v2.11.9`
- 8 个 Linux 架构：`amd64` `arm64` `armv7` `armv6` `armv5` `ppc64le` `riscv64` `s390x`
- 包名就是 `caddy`，版本为 `2.11.9-1+easycaddy`，排序高于官方同版本包
- APT 索引用 GPG 签名，安装方式与官方源一致

## 安装

一条命令：

```bash
curl -fsSL https://minimaxflora.github.io/EasyCaddy/install.sh | sudo bash
```

或者手动：

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://minimaxflora.github.io/EasyCaddy/public.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/easycaddy-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/easycaddy-archive-keyring.gpg] https://minimaxflora.github.io/EasyCaddy/ ./" \
  | sudo tee /etc/apt/sources.list.d/easycaddy.list
sudo chmod o+r /usr/share/keyrings/easycaddy-archive-keyring.gpg
sudo chmod o+r /etc/apt/sources.list.d/easycaddy.list
sudo apt update
sudo apt install caddy
```

验证：

```bash
caddy version
caddy list-modules | grep -E 'dns.providers|ratelimit|security|layer4|dynamic_dns|webdav|cache|geoip2|cloudflare'
```

> **不要同时启用官方 Caddy 源。** 两者包名都是 `caddy`，官方发布新版本时 apt 可能把你的带插件构建覆盖掉。`install.sh` 会自动把 `/etc/apt/sources.list.d/caddy-stable.list` 改名为 `.disabled-by-easycaddy`，并写入 `/etc/apt/preferences.d/easycaddy` 把本仓库的 `caddy` 固定为优先版本；手动安装的用户建议自行添加同样的 pin。
>
> 另外不要运行 `caddy upgrade`：它会从官方下载不带插件的二进制并覆盖当前文件。请用 `apt install --only-upgrade caddy` 升级。

## 插件

| 模块 | 用途 |
| --- | --- |
| `github.com/caddy-dns/cloudflare` | Cloudflare DNS-01 |
| `github.com/caddy-dns/alidns` | 阿里云 DNS-01 |
| `github.com/caddy-dns/tencentcloud` | 腾讯云 DNSPod DNS-01 |
| `github.com/mholt/caddy-ratelimit` | `rate_limit` 限流 |
| `github.com/greenpau/caddy-security` | 认证 / 授权 / MFA / OAuth 门户 |
| `github.com/mholt/caddy-l4` | 四层 TCP/UDP 代理 |
| `github.com/mholt/caddy-dynamicdns` | 动态 DNS |
| `github.com/mholt/caddy-webdav` | WebDAV |
| `github.com/caddyserver/cache-handler` | HTTP 缓存 |
| `github.com/zhangjiayin/caddy-geoip2` | GeoIP2 匹配器 |
| `github.com/WeidiDeng/caddy-cloudflare-ip` | 恢复 Cloudflare 后真实客户端 IP |

插件版本**没有固定**，每次构建都解析各仓库默认分支的最新版本（与 `--with github.com/caddy-dns/cloudflare` 的默认行为一致）。如果你希望构建可复现，可以在 `.github/workflows/build.yml` 的 `PLUGINS` 里写成 `github.com/...@v1.2.3` 或 `@<commit>`。

## 仓库结构

```
.github/workflows/build.yml   # 检测上游版本 → 8 架构构建 → 发布 Release → 部署 Pages
scripts/make-deb.sh           # 以上游官方 deb 为模板替换二进制并重打包
scripts/make-apt-repo.sh      # 收集最近 3 个版本的 deb、生成索引、GPG 签名
pages/index.html              # APT 仓库首页
pages/install.sh              # 用户安装脚本
```

`make-deb.sh` 直接下载上游对应版本的官方 `.deb`，解包后替换 `/usr/bin/caddy`，保留官方的 systemd 单元、`caddy` 用户创建脚本、`/etc/caddy/Caddyfile`、man page 与 bash completion，再重新计算 md5sums 和 Installed-Size 后打包。这样新包的行为与官方安装完全一致。

## 首次部署（仓库维护者）

1. **生成签名密钥**（只需一次；建议在离线或可信环境执行）：

   ```bash
   gpg --batch --gen-key <<'EOF'
   %no-protection
   Key-Type: eddsa
   Key-Curve: ed25519
   Key-Usage: sign
   Subkey-Type: eddsa
   Subkey-Curve: ed25519
   Subkey-Usage: sign
   Name-Real: EasyCaddy Repository
   Name-Email: easycaddy@users.noreply.github.com
   Expire-Date: 0
   %commit
   EOF
   gpg --armor --export-secret-keys easycaddy@users.noreply.github.com > easycaddy-private.key
   gpg --armor --export easycaddy@users.noreply.github.com > public.key
   ```

2. 在仓库 **Settings → Secrets and variables → Actions** 新建 secret：
   - `GPG_PRIVATE_KEY`：上面 `easycaddy-private.key` 的完整内容（含 BEGIN/END 行）

   然后删除本地私钥文件，并妥善备份（丢失后旧版本仍可安装，但无法继续发布更新索引）。
   公钥 `public.key` 可留作核对，首页也会从 GPG keyring 动态导出。

3. 在 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。

4. 触发一次构建：**Actions → Build Caddy with plugins → Run workflow**。留空版本号即构建上游最新版。

5. 构建完成后访问 `https://minimaxflora.github.io/EasyCaddy/`，确认首页版本号正确。

## 日常维护

**手动构建指定版本**：Actions → Run workflow，在 `upstream_version` 填 `v2.11.9`。

**强制重建已存在的 release**：勾选 `force`。会覆盖 Release 资产并重新生成索引。

**新增插件**：编辑 `.github/workflows/build.yml` 顶部的 `PLUGINS`，每行一个模块，然后手动触发一次构建。注意不要加入 Caddy 标准构建里已有的模块，重复注册会导致启动 panic。

**调整保留版本数**：修改 `env.KEEP_VERSIONS`。GitHub Pages 站点有 1GB 软上限，8 架构 × 每架构约 20–30MB，保留 3 个版本约 500–700MB，不建议调大。

**更换 Pages 地址**：同时修改 `env.PAGES_BASE_URL` 与 `pages/install.sh` 里的默认 `BASE_URL`，再修改 `pages/index.html` 中的链接（脚本会用 `@PAGES_BASE_URL@` 替换）。

## 说明与限制

- 这是非官方构建，不提供任何担保；生产环境请先在测试机验证。
- `caddy-geoip2` 需要自行提供 MaxMind GeoLite2/GeoIP2 数据库文件。
- `caddy-security` 体积较大，会明显拉长构建时间。
- 定时任务只在**上游出现新 release tag** 时构建；已存在同名 release 时自动跳过。
- Release 的 tag 指向本打包仓库的提交，不是上游提交；上游源码由 xcaddy 按 tag 拉取。
- 上游若停止为某个架构提供官方 `.deb`，该架构的构建会失败并给出明确错误；届时需要改为自建 deb 模板。
