/* EasyCaddy page translations.
 * The default markup is Simplified Chinese; this script swaps text, title,
 * meta description and ARIA labels, and remembers the choice in localStorage.
 */
(function () {
  "use strict";

  var I18N = {
    "zh-CN": {
      "meta.title": "EasyCaddy — 带插件的 Caddy 签名 APT 仓库",
      "meta.desc": "EasyCaddy 是基于上游 Caddy 源码、内置 DNS、限流、安全门户、四层代理、WebDAV、缓存与 GeoIP2 等模块的非官方构建，通过 GPG 签名的 APT 仓库发布。",
      "nav.skip": "跳到安装步骤",
      "nav.install": "安装",
      "nav.plugins": "插件",
      "nav.arch": "架构",
      "nav.security": "签名",
      "nav.faq": "说明",
      "nav.main": "主导航",
      "nav.theme": "切换明暗主题",
      "nav.menu": "打开导航菜单",
      "nav.closeMenu": "关闭导航菜单",
      "nav.lang": "切换语言",
      "nav.langLabel": "语言",
      "nav.releases": "GitHub Releases",
      "hero.eyebrow": "GPG 签名 APT 仓库 · 自动跟随上游",
      "hero.title1": "Caddy，",
      "hero.title2": "开箱即用。",
      "hero.lede": "基于上游最新源码，内置 DNS、限流、安全门户、四层代理、WebDAV、缓存与 GeoIP2。签名 APT 仓库，一条命令安装。",
      "hero.cta": "开始安装",
      "hero.gh": "在 GitHub 查看",
      "hero.version": "当前版本",
      "hero.modules": "个模块",
      "hero.archs": "个架构",
      "hero.updated": "更新于",
      "float.title": "APT 仓库优先级",
      "float.detail": "1001 · 优先使用 EasyCaddy",
      "stats.modules": "第三方模块",
      "stats.archs": "Linux 构建架构",
      "stats.apt": "APT 覆盖架构",
      "stats.signed": "索引签名校验",
      "install.title": "三分钟，换上一个更完整的 Caddy。",
      "install.sub": "安装脚本会导入签名公钥、写入 APT 源和 pin，并处理与官方同版本包的替换。可重复执行，升级也用它。",
      "tabs.one": "一键安装",
      "tabs.manual": "手动配置",
      "tabs.upgrade": "升级 / 降级",
      "install.one.desc": "自动完成：安装依赖 → 导入公钥 → 写 APT 源与 pin → 安装 <code>caddy</code> → 启用并启动 systemd 服务。",
      "install.one.note": "包版本与官方一致。脚本使用 <code>--reinstall</code> 和 APT pin，确保选中这个带插件的构建，而不是跳过安装。",
      "install.manual.note": "不要同时启用官方 Caddy APT 源。两者包名和版本相同，apt 只能靠 pin 区分；<code>install.sh</code> 会自动把官方源改名为 <code>.disabled-by-easycaddy</code>。",
      "install.upgrade.desc": "站点保留最近 3 个版本，旧版本仍可从 GitHub Releases 下载。需要固定版本时，用 <code>apt</code> 显式安装指定版本。",
      "install.uninstallLabel": "卸载或恢复官方源：",
      "install.diagnoseLabel": "只读诊断：",
      "install.upgrade.note": "不要运行 <code>caddy upgrade</code>：它会下载官方二进制并覆盖当前文件，新增模块会全部丢失。",
      "mini.verify": "验证安装",
      "mini.source": "检查来源与优先级",
      "plugins.title": "11 个模块，覆盖最常见的生产场景。",
      "plugins.sub": "全部模块与上游 Caddy 一起编译进单一二进制，不依赖额外进程。插件版本在构建时解析，未固定版本号。",
      "plugins.note": "插件版本没有固定，每次构建解析各仓库默认分支的最新版本。需要可复现构建时，可在 <code>.github/workflows/build.yml</code> 的 <code>PLUGINS</code> 中添加 <code>@v1.2.3</code> 或 <code>@commit</code>。",
      "plugin.cloudflare": "Cloudflare DNS-01 证书签发，支持 API Token 与通配符域名。",
      "plugin.alidns": "阿里云 DNS-01，适合国内域名与内网服务的证书自动化。",
      "plugin.tencentcloud": "腾讯云 DNSPod DNS-01，支持国内外解析线路。",
      "plugin.ratelimit": "<code>rate_limit</code> 按 key、事件数和时间窗口限制请求速率。",
      "plugin.security": "认证、授权、MFA、OAuth / OIDC 门户，适合内部服务统一登录。",
      "plugin.l4": "四层 TCP/UDP 代理，支持 TLS 分流、SNI 路由与代理协议。",
      "plugin.dynamicdns": "动态 DNS 更新，把本机公网 IP 同步到 Cloudflare 等提供商。",
      "plugin.webdav": "WebDAV 文件服务，可用于私有网盘、挂载和同步目录。",
      "plugin.cache": "HTTP 响应缓存，降低后端压力并加快重复请求。",
      "plugin.geoip2": "GeoIP2 匹配器，按国家、城市、ASN 做访问控制或分流。",
      "plugin.cloudflareip": "从 Cloudflare 请求头恢复真实客户端 IP，供日志和匹配器使用。",
      "arch.title": "从 x86 VPS 到 ARM 路由器，都能用。",
      "arch.sub": "每次发布构建 8 个 Linux 架构。APT 索引覆盖 7 个；ARMv6 的包因 Debian 架构命名冲突只放在 Release。",
      "arch.tag": "仅 Release",
      "arch.note": "上游把 ARMv6 和 ARMv7 都标为 <code>armhf</code>，同包名、同版本、同架构的两个包不能共存于一个 APT 索引。ARMv6 的 <code>.deb</code> 和 <code>.tar.gz</code> 可从 GitHub Release 下载。",
      "security.title": "每一个字节，都有签名。",
      "security.desc": "APT 索引由专用 GPG 密钥签名，apt 会在安装前校验 <code>InRelease</code>、<code>Packages</code> 的 SHA-256。构建全程在 GitHub Actions 完成。",
      "security.check1": "InRelease + Release.gpg 双重签名",
      "security.check2": "SHA-256 / SHA-1 / MD5 索引校验",
      "security.check3": "lintian 2.122.0：0 error / 0 warning",
      "security.check4": "上游 deb 模板 + Debian Policy 修复",
      "security.copyFp": "复制指纹",
      "security.viewKey": "查看公钥",
      "faq.title": "常见问题。",
      "faq.subPrefix": "更多细节见",
      "faq.subSuffix": "的 README 与 CONTRIBUTING。",
      "faq.q1": "为什么包版本和官方完全一样？",
      "faq.a1": "为了与上游 tag 一一对应，Release 仍与上游同名，包版本也是同一个版本号。同版本时 apt 不会自动替换，所以安装脚本使用 <code>--reinstall</code> 并写入 APT pin。",
      "faq.q2": "需要删除官方 Caddy 源吗？",
      "faq.a2": "建议删除或停用。两个源的包名、版本都相同，apt 只能靠 pin 区分。<code>install.sh</code> 会自动把 <code>caddy-stable.list</code> 改名为 <code>.disabled-by-easycaddy</code>，并写入优先级 1001 的 pin。",
      "faq.q3": "为什么 armv6 不在 APT 索引里？",
      "faq.a3": "上游把 ARMv6 和 ARMv7 的 deb 都标为 Debian 架构 <code>armhf</code>，同包名、同版本、同架构无法共存于一个 <code>Packages</code> 索引。ARMv7 进入 APT，ARMv6 的 deb/tar.gz 放在 GitHub Release。",
      "faq.q4": "如何升级或降级？",
      "faq.a4": "升级用 <code>sudo apt update &amp;&amp; sudo apt install --only-upgrade caddy</code>。站点保留最近 3 个版本，需要旧版时从对应 Release 下载 deb，或用 <code>apt</code> 安装指定版本。不要运行 <code>caddy upgrade</code>。",
      "faq.q5": "插件版本固定吗？",
      "faq.a5": "不固定。每次构建解析各插件仓库默认分支的最新版本，与 <code>--with github.com/...</code> 的默认行为一致。需要可复现构建时，在 workflow 的 <code>PLUGINS</code> 中写死 tag 或 commit。",
      "faq.q6": "这是 Caddy 官方构建吗？",
      "faq.a6": "不是。EasyCaddy 是非官方重新构建，与 Caddy 项目没有隶属关系。标准构建能复现的问题请报告给 <a href=\"https://github.com/caddyserver/caddy/issues\" target=\"_blank\" rel=\"noreferrer noopener\">caddyserver/caddy</a>。",
      "footer.tagline": "带插件的 Caddy 非官方构建，签名 APT 仓库。",
      "footer.version": "当前版本",
      "footer.repo": "Repository",
      "footer.docs": "Docs",
      "footer.upstream": "Upstream",
      "footer.changelog": "Changelog",
      "footer.zhReadme": "中文 README",
      "footer.enReadme": "English README",
      "footer.contributing": "Contributing",
      "footer.caddyDocs": "Caddy Docs",
      "footer.upstreamReleases": "Upstream releases",
      "footer.caddyfile": "Caddyfile",
      "footer.disclaimer": "非官方构建，与 Caddy 项目无隶属关系。使用前请在测试环境验证。",
      "misc.copy": "复制",
      "misc.copied": "已复制",
      "misc.copyFailed": "复制失败"
    },

    "zh-TW": {
      "meta.title": "EasyCaddy — 帶外掛的 Caddy 簽章 APT 倉庫",
      "meta.desc": "EasyCaddy 是基於上游 Caddy 原始碼、內建 DNS、限流、安全入口、四層代理、WebDAV、快取與 GeoIP2 等模組的非官方建置，透過 GPG 簽章的 APT 倉庫發布。",
      "nav.skip": "跳到安裝步驟",
      "nav.install": "安裝",
      "nav.plugins": "外掛",
      "nav.arch": "架構",
      "nav.security": "簽章",
      "nav.faq": "說明",
      "nav.main": "主導覽",
      "nav.theme": "切換明暗主題",
      "nav.menu": "開啟導覽選單",
      "nav.closeMenu": "關閉導覽選單",
      "nav.lang": "切換語言",
      "nav.langLabel": "語言",
      "nav.releases": "GitHub Releases",
      "hero.eyebrow": "GPG 簽章 APT 倉庫 · 自動跟隨上游",
      "hero.title1": "Caddy，",
      "hero.title2": "開箱即用。",
      "hero.lede": "基於上游最新原始碼，內建 DNS、限流、安全入口、四層代理、WebDAV、快取與 GeoIP2。簽章 APT 倉庫，一條命令安裝。",
      "hero.cta": "開始安裝",
      "hero.gh": "在 GitHub 查看",
      "hero.version": "目前版本",
      "hero.modules": "個模組",
      "hero.archs": "個架構",
      "hero.updated": "更新於",
      "float.title": "APT 倉庫優先順序",
      "float.detail": "1001 · 優先使用 EasyCaddy",
      "stats.modules": "第三方模組",
      "stats.archs": "Linux 建置架構",
      "stats.apt": "APT 涵蓋架構",
      "stats.signed": "索引簽章驗證",
      "install.title": "三分鐘，換上一個更完整的 Caddy。",
      "install.sub": "安裝腳本會匯入簽章公鑰、寫入 APT 來源和 pin，並處理與官方同版本套件的替換。可重複執行，升級也用它。",
      "tabs.one": "一鍵安裝",
      "tabs.manual": "手動設定",
      "tabs.upgrade": "升級 / 降級",
      "install.one.desc": "自動完成：安裝相依套件 → 匯入公鑰 → 寫入 APT 來源與 pin → 安裝 <code>caddy</code> → 啟用並啟動 systemd 服務。",
      "install.one.note": "套件版本與官方一致。腳本使用 <code>--reinstall</code> 和 APT pin，確保選中這個帶外掛的建置，而不是跳過安裝。",
      "install.manual.note": "不要同時啟用官方 Caddy APT 來源。兩者套件名稱和版本相同，apt 只能靠 pin 區分；<code>install.sh</code> 會自動把官方來源改名為 <code>.disabled-by-easycaddy</code>。",
      "install.upgrade.desc": "網站保留最近 3 個版本，舊版本仍可從 GitHub Releases 下載。需要固定版本時，用 <code>apt</code> 明確安裝指定版本。",
      "install.uninstallLabel": "解除安裝或還原來源：",
      "install.diagnoseLabel": "唯讀診斷：",
      "install.upgrade.note": "不要執行 <code>caddy upgrade</code>：它會下載官方二進位檔並覆蓋目前檔案，新增模組會全部遺失。",
      "mini.verify": "驗證安裝",
      "mini.source": "檢查來源與優先順序",
      "plugins.title": "11 個模組，涵蓋最常見的生產情境。",
      "plugins.sub": "全部模組與上游 Caddy 一起編譯進單一二進位檔，不依賴額外程序。外掛版本在建置時解析，未固定版本號。",
      "plugins.note": "外掛版本沒有固定，每次建置解析各倉庫預設分支的最新版本。需要可重現建置時，可在 <code>.github/workflows/build.yml</code> 的 <code>PLUGINS</code> 中加入 <code>@v1.2.3</code> 或 <code>@commit</code>。",
      "plugin.cloudflare": "Cloudflare DNS-01 憑證簽發，支援 API Token 與萬用字元網域。",
      "plugin.alidns": "阿里雲 DNS-01，適合國內網域與內網服務的憑證自動化。",
      "plugin.tencentcloud": "騰訊雲 DNSPod DNS-01，支援國內外解析線路。",
      "plugin.ratelimit": "<code>rate_limit</code> 依 key、事件數和時間視窗限制請求速率。",
      "plugin.security": "認證、授權、MFA、OAuth / OIDC 入口，適合內部服務統一登入。",
      "plugin.l4": "四層 TCP/UDP 代理，支援 TLS 分流、SNI 路由與代理協定。",
      "plugin.dynamicdns": "動態 DNS 更新，把本機公網 IP 同步到 Cloudflare 等供應商。",
      "plugin.webdav": "WebDAV 檔案服務，可用於私有網盤、掛載和同步目錄。",
      "plugin.cache": "HTTP 回應快取，降低後端壓力並加快重複請求。",
      "plugin.geoip2": "GeoIP2 比對器，依國家、城市、ASN 做存取控制或分流。",
      "plugin.cloudflareip": "從 Cloudflare 請求標頭還原真實用戶端 IP，供日誌和比對器使用。",
      "arch.title": "從 x86 VPS 到 ARM 路由器，都能用。",
      "arch.sub": "每次發布建置 8 個 Linux 架構。APT 索引涵蓋 7 個；ARMv6 的套件因 Debian 架構命名衝突只放在 Release。",
      "arch.tag": "僅 Release",
      "arch.note": "上游把 ARMv6 和 ARMv7 都標為 <code>armhf</code>，同套件名、同版本、同架構的兩個套件不能共存於一個 APT 索引。ARMv6 的 <code>.deb</code> 和 <code>.tar.gz</code> 可從 GitHub Release 下載。",
      "security.title": "每一個位元組，都有簽章。",
      "security.desc": "APT 索引由專用 GPG 金鑰簽章，apt 會在安裝前驗證 <code>InRelease</code>、<code>Packages</code> 的 SHA-256。建置全程在 GitHub Actions 完成。",
      "security.check1": "InRelease + Release.gpg 雙重簽章",
      "security.check2": "SHA-256 / SHA-1 / MD5 索引驗證",
      "security.check3": "lintian 2.122.0：0 error / 0 warning",
      "security.check4": "上游 deb 模板 + Debian Policy 修正",
      "security.copyFp": "複製指紋",
      "security.viewKey": "檢視公鑰",
      "faq.title": "常見問題。",
      "faq.subPrefix": "更多細節見",
      "faq.subSuffix": "的 README 與 CONTRIBUTING。",
      "faq.q1": "為什麼套件版本和官方完全一樣？",
      "faq.a1": "為了與上游 tag 一一對應，Release 仍與上游同名，套件版本也是同一個版本號。同版本時 apt 不會自動替換，所以安裝腳本使用 <code>--reinstall</code> 並寫入 APT pin。",
      "faq.q2": "需要刪除官方 Caddy 來源嗎？",
      "faq.a2": "建議刪除或停用。兩個來源的套件名稱、版本都相同，apt 只能靠 pin 區分。<code>install.sh</code> 會自動把 <code>caddy-stable.list</code> 改名為 <code>.disabled-by-easycaddy</code>，並寫入優先順序 1001 的 pin。",
      "faq.q3": "為什麼 armv6 不在 APT 索引裡？",
      "faq.a3": "上游把 ARMv6 和 ARMv7 的 deb 都標為 Debian 架構 <code>armhf</code>，同套件名、同版本、同架構無法共存於一個 <code>Packages</code> 索引。ARMv7 進入 APT，ARMv6 的 deb/tar.gz 放在 GitHub Release。",
      "faq.q4": "如何升級或降級？",
      "faq.a4": "升級用 <code>sudo apt update &amp;&amp; sudo apt install --only-upgrade caddy</code>。網站保留最近 3 個版本，需要舊版時從對應 Release 下載 deb，或用 <code>apt</code> 安裝指定版本。不要執行 <code>caddy upgrade</code>。",
      "faq.q5": "外掛版本固定嗎？",
      "faq.a5": "不固定。每次建置解析各外掛倉庫預設分支的最新版本，與 <code>--with github.com/...</code> 的預設行為一致。需要可重現建置時，在 workflow 的 <code>PLUGINS</code> 中寫死 tag 或 commit。",
      "faq.q6": "這是 Caddy 官方建置嗎？",
      "faq.a6": "不是。EasyCaddy 是非官方重新建置，與 Caddy 專案沒有隸屬關係。標準建置能重現的問題請回報給 <a href=\"https://github.com/caddyserver/caddy/issues\" target=\"_blank\" rel=\"noreferrer noopener\">caddyserver/caddy</a>。",
      "footer.tagline": "帶外掛的 Caddy 非官方建置，簽章 APT 倉庫。",
      "footer.version": "目前版本",
      "footer.repo": "Repository",
      "footer.docs": "Docs",
      "footer.upstream": "Upstream",
      "footer.changelog": "Changelog",
      "footer.zhReadme": "中文 README",
      "footer.enReadme": "English README",
      "footer.contributing": "Contributing",
      "footer.caddyDocs": "Caddy Docs",
      "footer.upstreamReleases": "Upstream releases",
      "footer.caddyfile": "Caddyfile",
      "footer.disclaimer": "非官方建置，與 Caddy 專案無隸屬關係。使用前請在測試環境驗證。",
      "misc.copy": "複製",
      "misc.copied": "已複製",
      "misc.copyFailed": "複製失敗"
    },

    "en": {
      "meta.title": "EasyCaddy — Caddy with plugins, signed APT repository",
      "meta.desc": "EasyCaddy is an unofficial Caddy build with DNS, rate limiting, security portal, layer 4 proxying, WebDAV, caching and GeoIP2 modules, published through a GPG-signed APT repository.",
      "nav.skip": "Skip to install",
      "nav.install": "Install",
      "nav.plugins": "Plugins",
      "nav.arch": "Platforms",
      "nav.security": "Signed",
      "nav.faq": "FAQ",
      "nav.main": "Main navigation",
      "nav.theme": "Toggle color theme",
      "nav.menu": "Open navigation menu",
      "nav.closeMenu": "Close navigation menu",
      "nav.lang": "Change language",
      "nav.langLabel": "Language",
      "nav.releases": "GitHub Releases",
      "hero.eyebrow": "GPG-signed APT repository · tracks upstream",
      "hero.title1": "Caddy,",
      "hero.title2": "ready to go.",
      "hero.lede": "Built from the latest upstream source with DNS, rate limiting, a security portal, layer 4 proxying, WebDAV, caching and GeoIP2. A signed APT repository, installed with one command.",
      "hero.cta": "Install now",
      "hero.gh": "View on GitHub",
      "hero.version": "Current version",
      "hero.modules": "modules",
      "hero.archs": "architectures",
      "hero.updated": "Updated",
      "float.title": "APT repository priority",
      "float.detail": "1001 · EasyCaddy preferred",
      "stats.modules": "Third-party modules",
      "stats.archs": "Linux builds",
      "stats.apt": "Architectures in APT",
      "stats.signed": "Signed index",
      "install.title": "A more complete Caddy in three minutes.",
      "install.sub": "The installer imports the signing key, configures the APT source and pin, and handles replacing an official package with the same version. It is safe to re-run and is also used for upgrades.",
      "tabs.one": "One command",
      "tabs.manual": "Manual setup",
      "tabs.upgrade": "Upgrade / downgrade",
      "install.one.desc": "It installs dependencies, imports the key, writes the APT source and pin, installs <code>caddy</code>, then enables and starts the systemd service.",
      "install.one.note": "The package version matches upstream. The script uses <code>--reinstall</code> and an APT pin to select this plugin build instead of skipping the install.",
      "install.manual.note": "Do not enable the official Caddy APT source at the same time. Both use the same package name and version, so only the pin can distinguish them; <code>install.sh</code> renames the official source to <code>.disabled-by-easycaddy</code>.",
      "install.upgrade.desc": "The site keeps the three most recent releases; older versions remain on GitHub Releases. To pin a version, install it explicitly with <code>apt</code>.",
      "install.uninstallLabel": "Uninstall or restore the official source:",
      "install.diagnoseLabel": "Read-only diagnosis:",
      "install.upgrade.note": "Do not run <code>caddy upgrade</code>: it downloads the official binary and overwrites this build, removing every added module.",
      "mini.verify": "Verify the install",
      "mini.source": "Check source and pin",
      "plugins.title": "Eleven modules for the most common production needs.",
      "plugins.sub": "Every module is compiled into the same binary as upstream Caddy, with no extra process. Plugin versions are resolved at build time and are not pinned.",
      "plugins.note": "Plugin versions are not pinned; each build resolves the default branch of every repository. For reproducible builds, add <code>@v1.2.3</code> or <code>@commit</code> in the <code>PLUGINS</code> block of <code>.github/workflows/build.yml</code>.",
      "plugin.cloudflare": "Cloudflare DNS-01 issuance, with API tokens and wildcard domains.",
      "plugin.alidns": "Alibaba Cloud DNS-01 for automated certificates on Chinese domains and internal services.",
      "plugin.tencentcloud": "Tencent Cloud DNSPod DNS-01, including domestic and international resolution lines.",
      "plugin.ratelimit": "<code>rate_limit</code> limits request rates by key, event count and time window.",
      "plugin.security": "Authentication, authorization, MFA and an OAuth / OIDC portal for single sign-on to internal services.",
      "plugin.l4": "Layer 4 TCP/UDP proxying with TLS splitting, SNI routing and PROXY protocol.",
      "plugin.dynamicdns": "Dynamic DNS updates that sync the machine's public IP to Cloudflare and other providers.",
      "plugin.webdav": "WebDAV file serving for private drives, mounts and synchronized folders.",
      "plugin.cache": "HTTP response caching to reduce backend load and speed up repeat requests.",
      "plugin.geoip2": "GeoIP2 matchers for access control or routing by country, city or ASN.",
      "plugin.cloudflareip": "Restores the real client IP from Cloudflare headers for logs and matchers.",
      "arch.title": "From x86 VPS to ARM routers.",
      "arch.sub": "Every release builds eight Linux architectures. The APT index covers seven; ARMv6 packages live only in Releases because of a Debian architecture naming collision.",
      "arch.tag": "RELEASE ONLY",
      "arch.note": "Upstream labels both ARMv6 and ARMv7 as <code>armhf</code>; two packages with the same name, version and architecture cannot share one APT index. The ARMv6 <code>.deb</code> and <code>.tar.gz</code> are available from GitHub Releases.",
      "security.title": "Every byte is signed.",
      "security.desc": "The APT index is signed with a dedicated GPG key. Before installing, apt verifies the SHA-256 of <code>InRelease</code> and <code>Packages</code>. Builds run entirely in GitHub Actions.",
      "security.check1": "Dual signatures: InRelease + Release.gpg",
      "security.check2": "SHA-256 / SHA-1 / MD5 index verification",
      "security.check3": "lintian 2.122.0: 0 errors / 0 warnings",
      "security.check4": "Upstream .deb template + Debian Policy fixes",
      "security.copyFp": "Copy fingerprint",
      "security.viewKey": "View public key",
      "faq.title": "Common questions.",
      "faq.subPrefix": "More details in the",
      "faq.subSuffix": "README and CONTRIBUTING.",
      "faq.q1": "Why is the package version identical to upstream?",
      "faq.a1": "Releases mirror upstream tags and the package version is the same number. Because apt does not replace an installed package of the same version, the installer uses <code>--reinstall</code> and writes an APT pin.",
      "faq.q2": "Should I remove the official Caddy source?",
      "faq.a2": "Yes, remove or disable it. Both sources use the same package name and version, so only the pin can distinguish them. <code>install.sh</code> renames <code>caddy-stable.list</code> to <code>.disabled-by-easycaddy</code> and writes a pin with priority 1001.",
      "faq.q3": "Why is armv6 missing from the APT index?",
      "faq.a3": "Upstream labels both ARMv6 and ARMv7 packages as Debian architecture <code>armhf</code>. Two packages with the same name, version and architecture cannot coexist in one <code>Packages</code> index. ARMv7 is served by APT; the ARMv6 deb and tar.gz are on GitHub Releases.",
      "faq.q4": "How do I upgrade or downgrade?",
      "faq.a4": "Upgrade with <code>sudo apt update &amp;&amp; sudo apt install --only-upgrade caddy</code>. The site keeps three recent releases; download an older deb from its Release, or install a specific version with <code>apt</code>. Do not run <code>caddy upgrade</code>.",
      "faq.q5": "Are plugin versions pinned?",
      "faq.a5": "No. Each build resolves the latest default branch of every plugin repository, matching the default behaviour of <code>--with github.com/...</code>. For reproducible builds, pin a tag or commit in the workflow's <code>PLUGINS</code> list.",
      "faq.q6": "Is this an official Caddy build?",
      "faq.a6": "No. EasyCaddy is an unofficial rebuild and is not affiliated with the Caddy project. Please report issues that also occur with the standard build to <a href=\"https://github.com/caddyserver/caddy/issues\" target=\"_blank\" rel=\"noreferrer noopener\">caddyserver/caddy</a>.",
      "footer.tagline": "Unofficial Caddy builds with plugins and a signed APT repository.",
      "footer.version": "Current version",
      "footer.repo": "Repository",
      "footer.docs": "Docs",
      "footer.upstream": "Upstream",
      "footer.changelog": "Changelog",
      "footer.zhReadme": "Chinese README",
      "footer.enReadme": "English README",
      "footer.contributing": "Contributing",
      "footer.caddyDocs": "Caddy Docs",
      "footer.upstreamReleases": "Upstream releases",
      "footer.caddyfile": "Caddyfile",
      "footer.disclaimer": "Unofficial build, not affiliated with the Caddy project. Test before production use.",
      "misc.copy": "Copy",
      "misc.copied": "Copied",
      "misc.copyFailed": "Copy failed"
    },

    "ja": {
      "meta.title": "EasyCaddy — プラグイン入り Caddy の署名付き APT リポジトリ",
      "meta.desc": "EasyCaddy は、DNS、レート制限、セキュリティポータル、L4 プロキシ、WebDAV、キャッシュ、GeoIP2 などのモジュールを組み込んだ Caddy の非公式ビルドです。GPG 署名付き APT リポジトリで配布しています。",
      "nav.skip": "インストールへ移動",
      "nav.install": "インストール",
      "nav.plugins": "プラグイン",
      "nav.arch": "アーキテクチャ",
      "nav.security": "署名",
      "nav.faq": "説明",
      "nav.main": "メインナビゲーション",
      "nav.theme": "テーマを切り替え",
      "nav.menu": "ナビゲーションを開く",
      "nav.closeMenu": "ナビゲーションを閉じる",
      "nav.lang": "言語を変更",
      "nav.langLabel": "言語",
      "nav.releases": "GitHub Releases",
      "hero.eyebrow": "GPG 署名付き APT リポジトリ · 上流を自動追跡",
      "hero.title1": "Caddy、",
      "hero.title2": "すぐ使える。",
      "hero.lede": "最新の上流ソースを基に、DNS、レート制限、セキュリティポータル、L4 プロキシ、WebDAV、キャッシュ、GeoIP2 を組み込みました。署名付き APT リポジトリからコマンド 1 つでインストールできます。",
      "hero.cta": "インストール",
      "hero.gh": "GitHub で見る",
      "hero.version": "現在のバージョン",
      "hero.modules": "個のモジュール",
      "hero.archs": "個のアーキテクチャ",
      "hero.updated": "更新日",
      "float.title": "APT リポジトリの優先度",
      "float.detail": "1001 · EasyCaddy を優先",
      "stats.modules": "サードパーティモジュール",
      "stats.archs": "Linux ビルド",
      "stats.apt": "APT 対応アーキテクチャ",
      "stats.signed": "署名済みインデックス",
      "install.title": "3 分で、より完全な Caddy に。",
      "install.sub": "インストーラーは署名鍵のインポート、APT ソースと pin の設定、公式の同一バージョンパッケージの置き換えを行います。再実行可能で、アップグレードにも使えます。",
      "tabs.one": "ワンコマンド",
      "tabs.manual": "手動設定",
      "tabs.upgrade": "アップグレード / ダウングレード",
      "install.one.desc": "依存関係のインストール、鍵のインポート、APT ソースと pin の設定、<code>caddy</code> のインストール、systemd サービスの有効化と起動までを自動で行います。",
      "install.one.note": "パッケージのバージョンは上流と同一です。スクリプトは <code>--reinstall</code> と APT pin を使い、インストールをスキップせず、このプラグイン入りビルドを選択します。",
      "install.manual.note": "公式 Caddy APT ソースを同時に有効にしないでください。パッケージ名とバージョンが同じため、pin でのみ区別できます。<code>install.sh</code> は公式ソースを <code>.disabled-by-easycaddy</code> にリネームします。",
      "install.upgrade.desc": "サイトには直近 3 バージョンを保持し、それ以前は GitHub Releases から取得できます。バージョンを固定する場合は <code>apt</code> で明示的にインストールしてください。",
      "install.uninstallLabel": "アンインストールまたは公式ソースの復元:",
      "install.diagnoseLabel": "読み取り専用の診断:",
      "install.upgrade.note": "<code>caddy upgrade</code> は実行しないでください。公式バイナリをダウンロードして上書きするため、追加モジュールがすべて失われます。",
      "mini.verify": "インストール確認",
      "mini.source": "ソースと優先度を確認",
      "plugins.title": "実運用でよく使う 11 のモジュール。",
      "plugins.sub": "すべてのモジュールは上流 Caddy と同じバイナリに組み込まれ、追加プロセスは不要です。プラグインのバージョンはビルド時に解決され、固定されません。",
      "plugins.note": "プラグインのバージョンは固定されず、ビルドごとに各リポジトリのデフォルトブランチを解決します。再現性が必要な場合は <code>.github/workflows/build.yml</code> の <code>PLUGINS</code> に <code>@v1.2.3</code> または <code>@commit</code> を追加してください。",
      "plugin.cloudflare": "Cloudflare DNS-01 による証明書発行。API トークンとワイルドカードドメインに対応。",
      "plugin.alidns": "Alibaba Cloud DNS-01。中国国内ドメインや内部サービスの証明書自動化に。",
      "plugin.tencentcloud": "テンセントクラウド DNSPod DNS-01。国内外の解決ラインに対応。",
      "plugin.ratelimit": "<code>rate_limit</code> でキー、イベント数、時間枠ごとにリクエストレートを制限します。",
      "plugin.security": "認証、認可、MFA、OAuth / OIDC ポータル。内部サービスのシングルサインオンに。",
      "plugin.l4": "L4 TCP/UDP プロキシ。TLS 分割、SNI ルーティング、PROXY プロトコルに対応。",
      "plugin.dynamicdns": "ダイナミック DNS。本機のグローバル IP を Cloudflare などのプロバイダーに同期します。",
      "plugin.webdav": "WebDAV ファイルサービス。プライベートストレージ、マウント、同期フォルダーに。",
      "plugin.cache": "HTTP レスポンスキャッシュ。バックエンド負荷を下げ、繰り返しリクエストを高速化します。",
      "plugin.geoip2": "GeoIP2 マッチャー。国、都市、ASN によるアクセス制御や振り分けに。",
      "plugin.cloudflareip": "Cloudflare のヘッダーから実際のクライアント IP を復元し、ログやマッチャーで利用します。",
      "arch.title": "x86 VPS から ARM ルーターまで。",
      "arch.sub": "各リリースで Linux 8 アーキテクチャをビルドします。APT インデックスは 7 つを収録し、ARMv6 は Debian のアーキテクチャ名の衝突により Release のみで配布します。",
      "arch.tag": "Release のみ",
      "arch.note": "上流は ARMv6 と ARMv7 の両方を <code>armhf</code> として提供しており、同名・同バージョン・同アーキテクチャの 2 パッケージは 1 つの APT インデックスに共存できません。ARMv6 の <code>.deb</code> と <code>.tar.gz</code> は GitHub Releases から取得できます。",
      "security.title": "すべてのバイトに署名を。",
      "security.desc": "APT インデックスは専用の GPG 鍵で署名され、apt はインストール前に <code>InRelease</code> と <code>Packages</code> の SHA-256 を検証します。ビルドはすべて GitHub Actions で実行されます。",
      "security.check1": "InRelease + Release.gpg の二重署名",
      "security.check2": "SHA-256 / SHA-1 / MD5 インデックス検証",
      "security.check3": "lintian 2.122.0：0 error / 0 warning",
      "security.check4": "上流 deb テンプレート + Debian Policy 修正",
      "security.copyFp": "フィンガープリントをコピー",
      "security.viewKey": "公開鍵を見る",
      "faq.title": "よくある質問。",
      "faq.subPrefix": "詳細は",
      "faq.subSuffix": "の README と CONTRIBUTING をご覧ください。",
      "faq.q1": "パッケージのバージョンが上流と完全に同じなのはなぜ？",
      "faq.a1": "リリースタグを上流と一致させ、パッケージのバージョンも同じ番号にしています。同じバージョンのパッケージは apt が自動で置き換えないため、インストーラーは <code>--reinstall</code> と APT pin を使います。",
      "faq.q2": "公式 Caddy ソースは削除すべき？",
      "faq.a2": "削除または無効化してください。両方ともパッケージ名とバージョンが同じで、pin でのみ区別できます。<code>install.sh</code> は <code>caddy-stable.list</code> を <code>.disabled-by-easycaddy</code> にリネームし、優先度 1001 の pin を書き込みます。",
      "faq.q3": "armv6 が APT インデックスにないのはなぜ？",
      "faq.a3": "上流は ARMv6 と ARMv7 の deb をどちらも Debian アーキテクチャ <code>armhf</code> として提供しています。同名・同バージョン・同アーキテクチャの 2 パッケージは 1 つの <code>Packages</code> インデックスに共存できません。ARMv7 は APT、ARMv6 は GitHub Releases で配布します。",
      "faq.q4": "アップグレードとダウングレードの方法は？",
      "faq.a4": "アップグレードは <code>sudo apt update &amp;&amp; sudo apt install --only-upgrade caddy</code> です。サイトには直近 3 バージョンを保持しています。古い deb は該当する Release から取得するか、<code>apt</code> で特定バージョンをインストールしてください。<code>caddy upgrade</code> は実行しないでください。",
      "faq.q5": "プラグインのバージョンは固定されていますか？",
      "faq.a5": "いいえ。ビルドごとに各プラグインリポジトリのデフォルトブランチを解決します（<code>--with github.com/...</code> の既定動作と同じ）。再現性が必要な場合は workflow の <code>PLUGINS</code> に tag や commit を指定してください。",
      "faq.q6": "これは Caddy 公式ビルドですか？",
      "faq.a6": "いいえ。EasyCaddy は非公式の再ビルドであり、Caddy プロジェクトとは関係ありません。標準ビルドでも再現する問題は <a href=\"https://github.com/caddyserver/caddy/issues\" target=\"_blank\" rel=\"noreferrer noopener\">caddyserver/caddy</a> へ報告してください。",
      "footer.tagline": "プラグイン入り Caddy の非公式ビルドと署名付き APT リポジトリ。",
      "footer.version": "現在のバージョン",
      "footer.repo": "リポジトリ",
      "footer.docs": "ドキュメント",
      "footer.upstream": "上流",
      "footer.changelog": "変更履歴",
      "footer.zhReadme": "中国語 README",
      "footer.enReadme": "English README",
      "footer.contributing": "コントリビューション",
      "footer.caddyDocs": "Caddy ドキュメント",
      "footer.upstreamReleases": "上流リリース",
      "footer.caddyfile": "Caddyfile",
      "footer.disclaimer": "非公式ビルドであり、Caddy プロジェクトとは無関係です。本番前にテストしてください。",
      "misc.copy": "コピー",
      "misc.copied": "コピーしました",
      "misc.copyFailed": "コピー失敗"
    },

    "ko": {
      "meta.title": "EasyCaddy — 플러그인이 포함된 Caddy 서명 APT 저장소",
      "meta.desc": "EasyCaddy는 DNS, 요청 제한, 보안 포털, L4 프록시, WebDAV, 캐시, GeoIP2 모듈을 포함한 비공식 Caddy 빌드이며, GPG 서명된 APT 저장소로 배포됩니다.",
      "nav.skip": "설치로 건너뛰기",
      "nav.install": "설치",
      "nav.plugins": "플러그인",
      "nav.arch": "아키텍처",
      "nav.security": "서명",
      "nav.faq": "안내",
      "nav.main": "기본 탐색",
      "nav.theme": "테마 전환",
      "nav.menu": "탐색 메뉴 열기",
      "nav.closeMenu": "탐색 메뉴 닫기",
      "nav.lang": "언어 변경",
      "nav.langLabel": "언어",
      "nav.releases": "GitHub Releases",
      "hero.eyebrow": "GPG 서명 APT 저장소 · 업스트림 자동 추적",
      "hero.title1": "Caddy,",
      "hero.title2": "바로 사용.",
      "hero.lede": "최신 업스트림 소스를 기반으로 DNS, 요청 제한, 보안 포털, L4 프록시, WebDAV, 캐시, GeoIP2를 포함합니다. 서명된 APT 저장소에서 한 줄로 설치하세요.",
      "hero.cta": "설치하기",
      "hero.gh": "GitHub에서 보기",
      "hero.version": "현재 버전",
      "hero.modules": "개 모듈",
      "hero.archs": "개 아키텍처",
      "hero.updated": "업데이트",
      "float.title": "APT 저장소 우선순위",
      "float.detail": "1001 · EasyCaddy 우선",
      "stats.modules": "서드파티 모듈",
      "stats.archs": "Linux 빌드",
      "stats.apt": "APT 지원 아키텍처",
      "stats.signed": "서명된 인덱스",
      "install.title": "3분이면 더 완전한 Caddy로.",
      "install.sub": "설치 스크립트는 서명 키를 가져오고 APT 소스와 pin을 설정하며, 같은 버전의 공식 패키지를 교체합니다. 다시 실행해도 안전하고 업그레이드에도 사용합니다.",
      "tabs.one": "한 줄 설치",
      "tabs.manual": "수동 설정",
      "tabs.upgrade": "업그레이드 / 다운그레이드",
      "install.one.desc": "의존성 설치, 키 가져오기, APT 소스와 pin 작성, <code>caddy</code> 설치, systemd 서비스 활성화 및 시작을 자동으로 수행합니다.",
      "install.one.note": "패키지 버전은 업스트림과 같습니다. 스크립트는 <code>--reinstall</code>과 APT pin을 사용해 설치를 건너뛰지 않고 이 플러그인 빌드를 선택합니다.",
      "install.manual.note": "공식 Caddy APT 소스를 동시에 활성화하지 마세요. 패키지 이름과 버전이 같아 pin으로만 구분할 수 있습니다. <code>install.sh</code>는 공식 소스를 <code>.disabled-by-easycaddy</code>로 변경합니다.",
      "install.upgrade.desc": "사이트에는 최근 3개 버전이 유지되며, 더 오래된 버전은 GitHub Releases에서 받을 수 있습니다. 버전을 고정하려면 <code>apt</code>로 명시적으로 설치하세요.",
      "install.uninstallLabel": "제거 또는 공식 소스 복원:",
      "install.diagnoseLabel": "읽기 전용 진단:",
      "install.upgrade.note": "<code>caddy upgrade</code>를 실행하지 마세요. 공식 바이너리를 내려받아 덮어쓰므로 추가 모듈이 모두 사라집니다.",
      "mini.verify": "설치 확인",
      "mini.source": "소스와 우선순위 확인",
      "plugins.title": "가장 흔한 운영 환경을 위한 11개 모듈.",
      "plugins.sub": "모든 모듈은 업스트림 Caddy와 같은 바이너리에 컴파일되며 별도 프로세스가 필요 없습니다. 플러그인 버전은 빌드 시 확인되며 고정되지 않습니다.",
      "plugins.note": "플러그인 버전은 고정되지 않으며 각 빌드에서 저장소의 기본 브랜치를 확인합니다. 재현 가능한 빌드가 필요하면 <code>.github/workflows/build.yml</code>의 <code>PLUGINS</code>에 <code>@v1.2.3</code> 또는 <code>@commit</code>을 추가하세요.",
      "plugin.cloudflare": "Cloudflare DNS-01 인증서 발급. API 토큰과 와일드카드 도메인을 지원합니다.",
      "plugin.alidns": "알리바바 클라우드 DNS-01. 중국 도메인과 내부 서비스의 인증서 자동화에 적합합니다.",
      "plugin.tencentcloud": "텐센트 클라우드 DNSPod DNS-01. 국내외 해석 라인을 지원합니다.",
      "plugin.ratelimit": "<code>rate_limit</code>으로 키, 이벤트 수, 시간 창별 요청 속도를 제한합니다.",
      "plugin.security": "인증, 권한 부여, MFA, OAuth / OIDC 포털. 내부 서비스 통합 로그인에 적합합니다.",
      "plugin.l4": "L4 TCP/UDP 프록시. TLS 분할, SNI 라우팅, PROXY 프로토콜을 지원합니다.",
      "plugin.dynamicdns": "동적 DNS. 이 머신의 공인 IP를 Cloudflare 등 공급자에 동기화합니다.",
      "plugin.webdav": "WebDAV 파일 서비스. 개인 드라이브, 마운트, 동기화 폴더에 사용할 수 있습니다.",
      "plugin.cache": "HTTP 응답 캐시. 백엔드 부하를 줄이고 반복 요청을 빠르게 합니다.",
      "plugin.geoip2": "GeoIP2 매처. 국가, 도시, ASN별 접근 제어나 라우팅에 사용합니다.",
      "plugin.cloudflareip": "Cloudflare 헤더에서 실제 클라이언트 IP를 복원해 로그와 매처에 사용합니다.",
      "arch.title": "x86 VPS부터 ARM 라우터까지.",
      "arch.sub": "각 릴리스는 Linux 8개 아키텍처를 빌드합니다. APT 인덱스는 7개를 포함하며, ARMv6 패키지는 Debian 아키텍처 이름 충돌로 Release에서만 제공합니다.",
      "arch.tag": "Release 전용",
      "arch.note": "업스트림은 ARMv6과 ARMv7을 모두 <code>armhf</code>로 표기하며, 이름, 버전, 아키텍처가 같은 두 패키지는 하나의 APT 인덱스에 공존할 수 없습니다. ARMv6 <code>.deb</code>와 <code>.tar.gz</code>는 GitHub Releases에서 받을 수 있습니다.",
      "security.title": "모든 바이트에 서명합니다.",
      "security.desc": "APT 인덱스는 전용 GPG 키로 서명되며, apt는 설치 전에 <code>InRelease</code>와 <code>Packages</code>의 SHA-256을 검증합니다. 빌드는 모두 GitHub Actions에서 실행됩니다.",
      "security.check1": "InRelease + Release.gpg 이중 서명",
      "security.check2": "SHA-256 / SHA-1 / MD5 인덱스 검증",
      "security.check3": "lintian 2.122.0: 0 error / 0 warning",
      "security.check4": "업스트림 deb 템플릿 + Debian Policy 수정",
      "security.copyFp": "지문 복사",
      "security.viewKey": "공개 키 보기",
      "faq.title": "자주 묻는 질문.",
      "faq.subPrefix": "자세한 내용은",
      "faq.subSuffix": "의 README와 CONTRIBUTING을 참고하세요.",
      "faq.q1": "패키지 버전이 업스트림과 완전히 같은 이유는?",
      "faq.a1": "릴리스 태그를 업스트림과 맞추고 패키지 버전도 같은 번호를 사용합니다. 같은 버전의 패키지는 apt가 자동으로 교체하지 않으므로 설치 스크립트가 <code>--reinstall</code>과 APT pin을 사용합니다.",
      "faq.q2": "공식 Caddy 소스를 삭제해야 하나요?",
      "faq.a2": "삭제하거나 비활성화하세요. 두 소스 모두 패키지 이름과 버전이 같아 pin으로만 구분할 수 있습니다. <code>install.sh</code>는 <code>caddy-stable.list</code>를 <code>.disabled-by-easycaddy</code>로 변경하고 우선순위 1001의 pin을 기록합니다.",
      "faq.q3": "armv6이 APT 인덱스에 없는 이유는?",
      "faq.a3": "업스트림은 ARMv6과 ARMv7 deb를 모두 Debian 아키텍처 <code>armhf</code>로 표기합니다. 이름, 버전, 아키텍처가 같은 두 패키지는 하나의 <code>Packages</code> 인덱스에 공존할 수 없습니다. ARMv7은 APT, ARMv6은 GitHub Releases에서 제공합니다.",
      "faq.q4": "업그레이드와 다운그레이드는 어떻게 하나요?",
      "faq.a4": "업그레이드는 <code>sudo apt update &amp;&amp; sudo apt install --only-upgrade caddy</code>입니다. 사이트에는 최근 3개 버전이 유지되며, 이전 deb는 해당 Release에서 받거나 <code>apt</code>로 특정 버전을 설치하세요. <code>caddy upgrade</code>는 실행하지 마세요.",
      "faq.q5": "플러그인 버전이 고정되어 있나요?",
      "faq.a5": "아니요. 각 빌드에서 플러그인 저장소의 기본 브랜치 최신 버전을 확인합니다(<code>--with github.com/...</code>의 기본 동작과 같습니다). 재현 가능한 빌드가 필요하면 workflow의 <code>PLUGINS</code>에 tag나 commit을 고정하세요.",
      "faq.q6": "공식 Caddy 빌드인가요?",
      "faq.a6": "아니요. EasyCaddy는 비공식 재빌드이며 Caddy 프로젝트와 무관합니다. 표준 빌드에서도 재현되는 문제는 <a href=\"https://github.com/caddyserver/caddy/issues\" target=\"_blank\" rel=\"noreferrer noopener\">caddyserver/caddy</a>에 보고하세요.",
      "footer.tagline": "플러그인이 포함된 비공식 Caddy 빌드와 서명된 APT 저장소.",
      "footer.version": "현재 버전",
      "footer.repo": "저장소",
      "footer.docs": "문서",
      "footer.upstream": "업스트림",
      "footer.changelog": "변경 기록",
      "footer.zhReadme": "중국어 README",
      "footer.enReadme": "English README",
      "footer.contributing": "기여 가이드",
      "footer.caddyDocs": "Caddy 문서",
      "footer.upstreamReleases": "업스트림 릴리스",
      "footer.caddyfile": "Caddyfile",
      "footer.disclaimer": "비공식 빌드이며 Caddy 프로젝트와 무관합니다. 프로덕션 전에 테스트하세요.",
      "misc.copy": "복사",
      "misc.copied": "복사됨",
      "misc.copyFailed": "복사 실패"
    }
  };

  var DEFAULT_LANG = "zh-CN";
  var STORAGE_KEY = "easycaddy.lang";
  var SUPPORTED = Object.keys(I18N);
  var current = DEFAULT_LANG;
  var langButton = document.getElementById("lang-btn");
  var langList = document.getElementById("lang-list");

  function normalize(value) {
    var raw = String(value || "").toLowerCase();
    if (raw.indexOf("zh") === 0) {
      if (raw.indexOf("tw") !== -1 || raw.indexOf("hk") !== -1 || raw.indexOf("hant") !== -1 || raw.indexOf("mo") !== -1) return "zh-TW";
      return "zh-CN";
    }
    if (raw.indexOf("ja") === 0) return "ja";
    if (raw.indexOf("ko") === 0) return "ko";
    if (raw.indexOf("en") === 0) return "en";
    return DEFAULT_LANG;
  }

  function t(key, lang) {
    var target = lang || current;
    var dict = I18N[target] || I18N[DEFAULT_LANG];
    if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
    return I18N[DEFAULT_LANG][key] || "";
  }

  function apply(lang) {
    current = SUPPORTED.indexOf(lang) !== -1 ? lang : DEFAULT_LANG;
    var html = document.documentElement;
    html.lang = current === "zh-CN" ? "zh-CN" : current === "zh-TW" ? "zh-Hant" : current;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var value = t(el.getAttribute("data-i18n"));
      if (value) el.textContent = value;
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var value = t(el.getAttribute("data-i18n-html"));
      if (value) el.innerHTML = value;
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      var value = t(el.getAttribute("data-i18n-aria-label"));
      if (value) el.setAttribute("aria-label", value);
    });

    document.title = t("meta.title");
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("meta.desc"));
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", t("meta.title"));
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", t("meta.desc"));

    document.querySelectorAll("[data-lang]").forEach(function (button) {
      button.setAttribute("aria-selected", button.getAttribute("data-lang") === current ? "true" : "false");
    });

    try {
      var url = new URL(window.location.href);
      if (url.searchParams.has("lang")) {
        url.searchParams.set("lang", current);
        window.history.replaceState(null, "", url);
      }
    } catch (e) {}

    try { localStorage.setItem(STORAGE_KEY, current); } catch (e) {}
  }

  function initialLanguage() {
    try {
      var requested = new URLSearchParams(window.location.search).get("lang");
      if (requested) {
        var normalized = normalize(requested);
        if (SUPPORTED.indexOf(normalized) !== -1) return normalized;
      }
    } catch (e) {}
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
    var prefs = navigator.languages || [navigator.language || ""];
    for (var i = 0; i < prefs.length; i += 1) {
      var candidate = normalize(prefs[i]);
      if (SUPPORTED.indexOf(candidate) !== -1) return candidate;
    }
    return DEFAULT_LANG;
  }

  if (langButton && langList) {
    langButton.addEventListener("click", function () {
      var open = langList.hasAttribute("hidden");
      if (open) langList.removeAttribute("hidden"); else langList.setAttribute("hidden", "");
      langButton.setAttribute("aria-expanded", open ? "true" : "false");
    });
    langList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-lang]");
      if (!button) return;
      apply(button.getAttribute("data-lang"));
      langList.setAttribute("hidden", "");
      langButton.setAttribute("aria-expanded", "false");
      langButton.focus();
    });
    document.addEventListener("click", function (event) {
      if (langList.hasAttribute("hidden")) return;
      if (!event.target.closest(".lang")) {
        langList.setAttribute("hidden", "");
        langButton.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !langList.hasAttribute("hidden")) {
        langList.setAttribute("hidden", "");
        langButton.setAttribute("aria-expanded", "false");
        langButton.focus();
      }
    });
  }

  apply(initialLanguage());

  window.EasyCaddyI18n = {
    t: function (key) { return t(key); },
    apply: apply,
    get lang() { return current; },
    languages: SUPPORTED.slice()
  };
})();
