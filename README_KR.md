<p align="center">
  <a href="https://caddyserver.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="assets/caddy-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="assets/caddy-light.svg">
      <img src="assets/caddy-light.svg" alt="Caddy" width="550">
    </picture>
  </a>
  <br>
  <h3 align="center">EasyCaddy — 플러그인이 포함된 Caddy 비공식 빌드</h3>
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
  <a href="#설치">설치</a> ·
  <a href="#플러그인">플러그인</a> ·
  <a href="#아키텍처">아키텍처</a> ·
  <a href="#품질-검사">품질 검사</a> ·
  <a href="#기여">기여</a>
</p>

> **비공식 빌드.** EasyCaddy는 Caddy 프로젝트와 제휴하거나 승인받지 않았습니다. Caddy 이름과 로고는 Stack Holdings GmbH의 상표입니다.

<hr>

[Caddy](https://github.com/caddyserver/caddy) 공식 소스에 엄선한 서드파티 모듈을 추가해
빌드한 비공식 패키지입니다. `.deb` 패키지로 제공하며, 서명된 APT 저장소에서 배포합니다.

**https://caddy.tatalvpai.vip**

- 업스트림 최신 릴리스를 자동으로 추적합니다 (매주 월요일 03:00 UTC, 수동 실행 가능)
- 릴리스 태그는 업스트림과 동일합니다 (예: `v2.11.9`)
- Linux 8개 아키텍처를 빌드하며, APT 인덱스는 7개 아키텍처를 포함합니다
- 패키지 이름과 버전이 업스트림과 동일합니다 (`caddy 2.11.9`). APT pin과 `--reinstall`로
  이 저장소의 빌드를 선택합니다
- APT 인덱스는 전용 GPG 키로 서명됩니다

## 설치

한 줄 명령:

```bash
curl -fsSL https://caddy.tatalvpai.vip/install.sh | sudo bash
```

저장소를 직접 설정하려면:

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

버전이 업스트림과 같기 때문에, 같은 버전의 공식 패키지가 이미 설치되어 있으면 일반
`apt install caddy`는 아무 작업도 하지 않습니다. `--reinstall`을 사용해야 이 저장소의
패키지로 실제 교체됩니다. APT pin은 공식 Caddy 저장소를 다시 활성화하더라도 이 저장소의
패키지를 우선하도록 합니다.

확인:

```bash
caddy version
caddy list-modules | grep -E 'dns.providers|rate_limit|security|layer4|dynamic_dns|webdav|cache|geoip2|cloudflare'
```

> **공식 Caddy APT 저장소를 동시에 활성화하지 마세요.** 두 저장소 모두 이름과 버전이 같은
> `caddy` 패키지를 제공합니다. `install.sh`는
> `/etc/apt/sources.list.d/caddy-stable.list`를 `.disabled-by-easycaddy`로 이름을 바꾸고
> 위의 pin을 기록합니다. 수동으로 설정하는 경우에도 pin을 추가하세요.
>
> `caddy upgrade`를 실행하지 마세요. 공식 바이너리를 내려받아 덮어쓰므로 추가 모듈이
> 사라집니다. 업그레이드는 `sudo apt install --only-upgrade caddy`를 사용하세요.

### 업그레이드와 다운그레이드

```bash
sudo apt update
sudo apt install --only-upgrade caddy
apt-cache policy caddy
```

Pages 사이트에는 최근 3개 버전이 유지됩니다. 더 오래된 `.deb`는 해당 GitHub Release에서
내려받을 수 있습니다.

### 제거 및 복원

```bash
curl -fsSL https://caddy.tatalvpai.vip/uninstall.sh | sudo bash
```

기본 동작은 패키지 제거(설정 purge 없음), EasyCaddy 소스/pin/keyring 제거, 설치 스크립트가
백업한 파일 복원입니다. `/etc/caddy`, `/var/lib/caddy`, 인증서, 로그, 사이트 데이터는
보존됩니다. `--dry-run`으로 미리 확인할 수 있습니다. 설정 삭제에는 `--purge`와 `--yes`가
모두 필요합니다.

## 플러그인

| 모듈 | 용도 |
| --- | --- |
| `github.com/caddy-dns/cloudflare` | Cloudflare DNS-01 |
| `github.com/caddy-dns/alidns` | Alibaba Cloud DNS-01 |
| `github.com/caddy-dns/tencentcloud` | Tencent Cloud DNSPod DNS-01 |
| `github.com/mholt/caddy-ratelimit` | `rate_limit` 요청 제한 |
| `github.com/greenpau/caddy-security` | 인증, 권한 부여, MFA, OAuth 포털 |
| `github.com/mholt/caddy-l4` | 레이어 4 TCP/UDP 프록시 |
| `github.com/mholt/caddy-dynamicdns` | 동적 DNS |
| `github.com/mholt/caddy-webdav` | WebDAV 파일 제공 |
| `github.com/caddyserver/cache-handler` | HTTP 캐시 |
| `github.com/zhangjiayin/caddy-geoip2` | GeoIP2 매처 |
| `github.com/WeidiDeng/caddy-cloudflare-ip` | Cloudflare 뒤의 실제 클라이언트 IP 복원 |

플러그인 버전은 [`config/plugins.lock.json`](config/plugins.lock.json)에 고정되어 있으며,
CI가 Caddy `v2.11.9`와의 조합을 검증합니다. 잠금 파일에는 용도, 업스트림, 라이선스,
유지 관리 상태, 스모크 테스트 모듈도 기록됩니다. 변경 시 잠금 파일을 수정하고
`force`로 다시 빌드하세요.

## 아키텍처

빌드 및 Release 자산: `amd64`, `arm64`, `armv7`, `armv6`, `armv5`, `ppc64le`, `riscv64`,
`s390x`.

APT 인덱스는 `armv6`를 제외한 모든 아키텍처를 포함합니다. 업스트림은 ARMv6과 ARMv7을 모두
Debian 아키텍처 `armhf`로 표기하며, 이름, 버전, 아키텍처가 같은 두 패키지는 하나의 인덱스에
공존할 수 없습니다. ARMv7은 APT로 제공하고, ARMv6 `.deb`와 `.tar.gz`는 GitHub Release에서
제공합니다.

## 작동 방식

1. `.github/workflows/build.yml`이 업스트림 최신 릴리스 태그(또는 `workflow_dispatch`로
   지정한 태그)를 확인합니다.
2. `config/build-matrix.json` 매트릭스가 `config/plugins.lock.json`의 고정 버전으로
   8개 Linux 아키텍처에 대해 `xcaddy build`를 실행합니다.
3. `.github/scripts/make-deb.sh`가 공식 `.deb`와 SHA-512를 검증하고,
   `/usr/bin/caddy`를 교체하며 Debian Policy 수정, 빌드/플러그인 정보 기록, 체크섬
   재계산을 수행합니다.
4. 릴리스 작업이 `.deb`, `.tar.gz`, SHA-256, CycloneDX SBOM, 빌드 정보,
   잠금/툴체인/매트릭스 파일을 GitHub Release로 게시합니다.
5. `.github/scripts/make-apt-repo.sh`가 SemVer 기준으로 현재와 이전 버전을 유지하고,
   모든 APT 아키텍처의 패키지 존재를 검증하며, `GPG_KEY_FINGERPRINT` 키로 서명해
   GitHub Pages에 배포합니다.

## 저장소 구조

```text
.github/workflows/build.yml        빌드, 릴리스, Pages 배포
.github/scripts/make-deb.sh        공식 deb를 템플릿으로 재패키징
.github/scripts/make-apt-repo.sh   deb 수집, 인덱스 생성, 서명
.github/ISSUE_TEMPLATE/            이슈 양식
.github/CODEOWNERS                 리뷰 담당
.github/FUNDING.yml                후원 정보
.github/PULL_REQUEST_TEMPLATE.md   PR 체크리스트
.github/dependabot.yml             GitHub Actions 주간 업데이트
.github/actionlint.yaml            actionlint 설정
assets/caddy-light.svg             README 워드마크(라이트)
assets/caddy-dark.svg              README 워드마크(다크)
pages/index.html                   시맨틱 페이지 구조
pages/assets/site.css              디자인 토큰과 컴포넌트 스타일
pages/assets/site.js               테마, 탐색, 탭, 복사 상호작용
pages/assets/theme.js              첫 렌더링 전 테마 초기화
pages/assets/i18n.js               5개 언어 번역
pages/assets/mascot.png            투명 마스코트(hero 플로팅 요소 전용)
pages/assets/caddy.svg             Caddy 브랜드 아이콘 및 favicon
pages/assets/og.png                1200×630 Open Graph 공유 이미지
pages/install.sh                   사용자 설치 스크립트
pages/uninstall.sh                 안전한 제거/복원 스크립트
pages/robots.txt                   크롤러 정책
pages/sitemap.xml                  사이트맵
README.md / README_ZH.md / README_JA.md / README_KR.md
CONTRIBUTING.md                    기여 가이드
CHANGELOG.md                       릴리스 기록
```

## 저장소 유지 관리

서명 키 지문:

```text
5D07 1390 261F C2DE BE57  7C7B 129D C816 26FF 07EE
EasyCaddy Repository <easycaddy@users.noreply.github.com>
```

공개 키는 저장소에 커밋하지 않고 Actions secret `GPG_PUBLIC_KEY`에 저장하며, Pages가
`https://caddy.tatalvpai.vip/public.key`로 게시합니다. 배포 시 개인 키, 공개 키, 지문을
모두 대조합니다.

1. 개인 키를 Actions secret `GPG_PRIVATE_KEY`에 등록합니다. passphrase가 없으므로 오프라인
   백업을 보관하고 절대 저장소에 커밋하지 마세요.
2. ASCII-armored 공개 키를 Actions secret `GPG_PUBLIC_KEY`에 등록합니다.
3. 전체 지문을 repository variable `GPG_KEY_FINGERPRINT`에 등록합니다.
4. **Settings → Pages → Build and deployment**에서 **GitHub Actions**를 선택하고 사용자
   도메인을 `caddy.tatalvpai.vip`로 설정합니다.
5. Cloudflare에서 `caddy.tatalvpai.vip`가 `minimaxflora.github.io`를 가리키는 `CNAME`
   레코드를 만듭니다. GitHub가 TLS 인증서를 발급하는 동안에는 DNS 전용(회색 구름) 모드를
   사용하고, 완료 후 프록시를 켤 수 있습니다.
6. **Actions → Build Caddy with plugins → Run workflow**를 한 번 실행합니다.

수동 작업:

- **특정 버전 빌드**: `upstream_version`에 `v2.11.9` 등을 입력합니다.
- **기존 Release 강제 재빌드**: `force`를 선택합니다. Release 자산을 덮어쓰고 인덱스를
  다시 생성합니다.
- **플러그인 추가/업데이트**: `config/plugins.lock.json`을 수정한 뒤 현재 tag를 `force`로
  다시 빌드합니다. Caddy 표준 빌드에 이미 포함된 모듈은 추가하지 마세요.
- **툴체인 고정/업데이트**: `config/toolchain.json`을 수정합니다.
- **보관 버전 수 변경**: `config/build-matrix.json`의 `keep_versions`(기본 `3`)를
  수정합니다. GitHub Pages에는 1 GB 소프트 제한이 있으며, 버전당 7개 패키지는 약 140 MB입니다.
- **공개 URL 변경**: workflow의 `PAGES_BASE_URL`, `pages/install.sh`의 `BASE_URL`과 pin
  origin, Pages 사용자 도메인, 각 README의 링크를 함께 수정합니다.

### 서명 키 교체

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

`GPG_PRIVATE_KEY`와 `GPG_PUBLIC_KEY` secret, `GPG_KEY_FINGERPRINT` variable을 갱신한 뒤
workflow를 다시 실행합니다. Pages가 새 공개 키를 다시 게시합니다. 기존 설치 환경은 새 키를
내려받아 `signed-by` keyring을 갱신해야 합니다.

## 품질 검사

재패키징 단계에서는 업스트림 deb를 그대로 다시 묶지 않고 Debian Policy 수정을 적용합니다:

- systemd unit을 `/lib/systemd/system`에서 `/usr/lib/systemd/system`으로 이동
- bash completion을 폐기된 `/etc/bash_completion.d`에서
  `/usr/share/bash-completion/completions`로 이동
- `copyright`, `changelog.gz`, Extended Description 추가
- man page를 `gzip -9n`으로 다시 압축
- maintainer script의 `chown -R`을 디렉터리 전용 `chown`으로 변경
- Go 정적 바이너리 등 고유 항목은 lintian override로 처리

Debian 13 + lintian 2.122.0에서 amd64 패키지는 **0 error / 0 warning**입니다. CI에서도
amd64 빌드 후 lintian을 실행합니다(advisory, 배포를 막지 않으며 `lintian.txt`가 빌드
artifact에 포함됩니다). `actionlint`, YAML 파싱, `bash -n`은
[CONTRIBUTING.md](CONTRIBUTING.md)에 정리되어 있습니다.

## 제한 사항

- 비공식 빌드이며 어떠한 보증도 제공하지 않습니다. 프로덕션 환경에서는 먼저 테스트하세요.
- 플러그인 버전은 고정되어 있지만 Go 바이너리의 완전한 재현성은 툴체인, 타임스탬프,
  업스트림 빌드 환경에 따라 달라질 수 있습니다. 빌드 정보, 체크섬, SBOM을 제공합니다.
- `caddy-geoip2`는 사용자가 MaxMind GeoLite2/GeoIP2 데이터베이스를 제공해야 합니다.
- `greenpau/caddy-security`는 바이너리 크기와 빌드 시간을 크게 늘립니다.
- 예약 실행은 업스트림에 **새** 릴리스 태그가 있을 때만 빌드합니다. 같은 태그의 Release가
  이미 있으면 `force`를 켜지 않는 한 건너뜁니다.
- Release 태그는 이 패키징 저장소의 커밋을 가리키며, 업스트림 커밋이 아닙니다. 업스트림
  소스는 xcaddy가 태그로 가져옵니다.
- 업스트림이 특정 아키텍처의 공식 `.deb` 제공을 중단하면 해당 빌드는 명확한 오류와 함께
  실패합니다. 이 경우 자체 deb 템플릿이 필요합니다.

## 기여

버그 신고, 플러그인 요청, Pull Request를 환영합니다.
[CONTRIBUTING.md](CONTRIBUTING.md), 이슈 양식, [CHANGELOG.md](CHANGELOG.md)를 참고하세요.

- 저장소: https://github.com/MinimaxFlora/EasyCaddy
- 릴리스: https://github.com/MinimaxFlora/EasyCaddy/releases
- APT 저장소: https://caddy.tatalvpai.vip
- 업스트림 Caddy: https://github.com/caddyserver/caddy
- Caddy 문서: https://caddyserver.com/docs/
