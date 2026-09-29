# Isopod

일곱 개의 독립 공급자가 내보내는 여덟 컴포넌트를 **정적 Astro 페이지의 같은 DOM**에 모으는 실증입니다. 스타일은 전부 호스트 CSS에 있으며 iframe, Shadow DOM, 도메인 JSON API를 사용하지 않습니다. 각 공급자가 자신의 런타임·상태·통신을 소유합니다.

```sh
docker compose up --build -d
# http://localhost:4321
```

처음에는 Node/.NET/Elixir 이미지와 패키지를 받습니다. 이후 `docker compose ps`와 `docker compose logs phoenix` 등으로 상태를 확인할 수 있습니다. 종료는 `docker compose down`입니다. 포트는 로컬 머신에만 바인딩합니다.

## GitHub Pages + 원격 공급자

GitHub Pages에는 정적 Astro 호스트만 올리고, 공급자 컨테이너는 브라우저가 접근할 수 있는 별도 주소에서 실행할 수 있습니다. 저장소의 Actions Variables에 다음 값을 완전한 URL로 등록하면 됩니다.

```text
PUBLIC_PROVIDER_REACT_URL=https://react.example.com
PUBLIC_PROVIDER_SVELTE_URL=https://svelte.example.com
PUBLIC_PROVIDER_RSC_URL=https://next.example.com
PUBLIC_PROVIDER_SVELTE_SSR_URL=https://svelte-ssr.example.com
PUBLIC_PROVIDER_HONO_URL=https://hono.example.com
PUBLIC_PROVIDER_NEXT_URL=https://next.example.com
PUBLIC_PROVIDER_BLAZOR_URL=https://blazor.example.com
PUBLIC_PROVIDER_PHOENIX_URL=https://phoenix.example.com
```

`.github/workflows/pages.yml`가 `main` push 때 `host/dist`만 GitHub Pages에 배포합니다. 저장소 Settings → Pages → Source는 `GitHub Actions`로 선택합니다. 각 URL은 반드시 Pages를 방문하는 브라우저에서 직접 열 수 있어야 하며, HTTPS Pages에서 HTTP 공급자로 연결하면 혼합 콘텐츠 정책에 막힙니다. 로컬 공급자를 그대로 쓰려면 GitHub Pages가 그 컴퓨터의 `localhost`를 볼 수 없으므로 Cloudflare Tunnel·`gosuda/portal-tunnel`·Tailscale Funnel·역방향 프록시 같은 공개 HTTPS 주소가 필요합니다.

### Cloudflare Tunnel로 바로 연결하기

가장 단순한 실증은 공급자마다 Cloudflare Quick Tunnel을 하나씩 열고, 출력된 HTTPS 주소를 Actions Variables에 넣는 방식입니다. `cloudflared` 설치는 [Cloudflare 다운로드 문서](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)를 따릅니다.

```sh
# 공급자마다 별도 터미널에서 실행하고, 출력된 https://*.trycloudflare.com 주소를 복사합니다.
cloudflared tunnel --url http://localhost:5101 # React
cloudflared tunnel --url http://localhost:5102 # Svelte
cloudflared tunnel --url http://localhost:5103 # Hono
cloudflared tunnel --url http://localhost:5104 # Svelte SSR
cloudflared tunnel --url http://localhost:5105 # Next / RSC
cloudflared tunnel --url http://localhost:5106 # Blazor
cloudflared tunnel --url http://localhost:5107 # Phoenix
```

각 주소를 `PUBLIC_PROVIDER_*_URL`에 넣고 GitHub Pages workflow를 다시 실행하면 됩니다. Quick Tunnel URL은 재시작할 때 바뀌므로 장기 데모에는 Cloudflare named tunnel이나 `gosuda/portal-tunnel` 같은 고정 주소 계층을 사용하세요. 둘은 이 프로젝트의 공급자 URL 계약을 만족하는 서로 다른 터널 선택지입니다.

Compose에서 같은 주소를 사용하려면 `.env.example`을 `.env`로 복사하고 값을 채운 뒤 다음처럼 시작합니다.

```sh
cp .env.example .env
# PUBLIC_PROVIDER_*_URL에는 공개 공급자 URL을 입력
# HOST_ORIGIN에는 정확한 GitHub Pages origin을 입력
docker compose up --build -d
```

`HOST_ORIGIN`은 경로를 제외한 scheme + host + port origin이어야 합니다. 프로젝트 페이지가 `https://naratteu.github.io/isopod`라면 브라우저의 `Origin` 헤더는 `https://naratteu.github.io`이므로 서버 설정도 다음처럼 지정합니다.

```text
HOST_ORIGIN=https://naratteu.github.io
```

공급자 주소에 경로 prefix를 쓰는 경우에는 URL의 경로만 공급자 reverse proxy가 처리하고 `HOST_ORIGIN`은 여전히 `https://naratteu.github.io`처럼 scheme + host + port만 지정합니다. 여러 호스트를 허용해야 하면 각 공급자 앞에 CORS-aware reverse proxy를 두는 편이 단일 `HOST_ORIGIN`보다 안전합니다.

### Docker 이미지와 버전

Compose의 직접 만든 이미지는 Docker Hub의 공식 기반 이미지를 사용합니다. Node 빌드와 정적 서버는 `node:24.4.1-bookworm-slim`, `nginx:1.29.1-alpine`, Blazor는 Microsoft의 공식 `mcr.microsoft.com/dotnet/sdk:10.0`/`aspnet:10.0`, Phoenix는 Elixir 공식 이미지 `elixir:1.18-slim`을 사용합니다. 애플리케이션 npm/Hex/NuGet 버전은 lock 파일과 manifest에 고정되어 있습니다. 베이스 이미지 태그를 바꾸면 호환성 검사를 위해 `docker compose build`와 `npm test`를 다시 실행해야 합니다.

이 저장소는 애플리케이션 공급자 이미지를 Docker Hub에 미리 올리지 않습니다. 공급자마다 Astro용 원격 JS와 서버 코드를 함께 빌드해야 하므로, GitHub Actions나 로컬 Compose가 공식 기반 이미지 위에서 재현 가능하게 빌드합니다. 이후 이미지 배포가 필요해지면 각 서비스의 `image:`를 고정 태그 또는 digest로 추가하면 됩니다.

| 카드 | 공급자 | 내부 동작 | 포트 |
| --- | --- | --- | --- |
| React | 독립 React 번들 | React root, 브라우저 상태 | 5101 |
| Svelte | 독립 Svelte 번들 | Svelte mount, 브라우저 상태 | 5102 |
| React Server Component | Next App Router | 실제 async RSC → HTML, SSE로 재렌더 알림 | 5105 |
| Svelte SSR | Svelte server compiler + Hono HTTP | `.svelte` 조각을 요청마다 서버 렌더링, SSE | 5104 |
| Hono | Hono HTML renderer | HTML form + 서버 렌더링, SSE | 5103 |
| Next.js | Next에서 사용하는 Client Component의 원격 번들 | 독립 React root; 동일 컴포넌트의 Next 페이지는 `/client` | 5105 |
| Blazor Server | ASP.NET Core | JavaScript root component, 실제 SignalR circuit | 5106 |
| Phoenix LiveView | Phoenix/Elixir | 실제 LiveView 프로세스, LiveSocket DOM diff | 5107 |

카운터의 `+1`을 누르고 Garden / Paper / Night를 바꿔 보세요. CSS만 변경하므로 상태와 연결이 유지됩니다. 각 카드의 시각은 매초 갱신됩니다. 서버 카드의 시각은 서버에서 생성합니다. `연결 해제`는 해당 컴포넌트를 dispose하고 `다시 연결`은 새 인스턴스를 만듭니다.

브라우저 컴포넌트의 포트는 JavaScript 번들을 배포하는 서버 주소입니다. React·Svelte·Next 클라이언트 카드의 카운트는 브라우저에서만 처리되며 클릭 요청을 공급자 서버에 보내지 않습니다. 별도 포트는 독립 배포를 실증하기 위한 구성이고, 해당 번들을 Astro와 함께 배포하면 필요 없습니다.

## 카운트 로그

서버 카드의 `+1`마다 해당 컨테이너에 `counter.increment`, 공급자 이름, 인스턴스 식별자, 변경된 카운트를 기록합니다. 시각 갱신은 이 로그를 남기지 않습니다.

```sh
docker compose logs -f --timestamps hono svelte-ssr next blazor phoenix
# 한 공급자만 보려면:
docker compose logs -f --timestamps blazor
```

예: `counter.increment provider=blazor instance=8a12bc34 count=3`

RSC 로그는 `next` 컨테이너에서 `provider=rsc`로 표시됩니다. 브라우저에서만 상태가 바뀌는 세 카드는 서버 카운트 로그가 없습니다. 검증된 기존 화면을 열어 둔 상태에서 공급자를 재빌드했다면 페이지를 새로고침해 새 연결을 만드세요.

## 경계

```text
nginx:4321 ── Astro가 빌드한 HTML / CSS / 작은 호스트 JS
                    │ 브라우저의 직접 import()
          ┌─────────┼──────────┬───────────┐
       Node 공급자들         Blazor       Phoenix
       HTML / React / Svelte  SignalR      LiveSocket
          └─────────┴──────────┴───────────┘
                    같은 문서의 Light DOM
                    Astro의 전역 CSS
```

호스트는 URL과 아래 계약만 압니다. 업무 데이터의 구조나 HTTP/SSE/SignalR/LiveSocket은 호스트 코드에 없습니다.

```js
export async function mount(element, { signal }) {
  // element 내부 DOM은 이 공급자가 소유한다.
  // signal은 로딩 중 취소와 마운트 해제를 알린다.
  return () => { /* 컴포넌트 / 타이머 / 연결 정리 */ };
}
```

`host/src/components/RemoteIsland.astro`는 이 계약을 일반 custom element로 연결합니다. 새 컴포넌트 문법이 필요하지 않아 Astro `addRenderer()`는 만들지 않았습니다. 공급자 URL을 변경하려면 `host/src/pages/index.astro`의 목록을 수정하고 정적 호스트만 다시 빌드합니다. 공급자 서버가 없어도 호스트 빌드가 됩니다.

일반적인 호스트 개발은 `npm ci && npm run dev`로 가능합니다. Docker의 host와 포트가 겹치면 먼저 `docker compose stop host`를 실행합니다. 공급자는 계속 Compose에서 실행합니다.

## 의미와 실증 범위

- **RSC는 진짜 Next App Router Server Component입니다.** 다만 원격 Flight 트리를 Astro에서 해석하거나 Client Component 경계를 재현하는 구현은 아닙니다. 공급자 어댑터가 Next의 HTML 응답에서 자신의 `<article>`을 가져옵니다. RSC/Next 전용 라우터·Server Action이 필요한 원격 앱까지 지원한다는 뜻은 아닙니다.
- **Svelte SSR은 조각 단위로 사용할 수 있습니다.** 서버용으로 컴파일한 `Counter.svelte`를 `svelte/server.render()`로 실행합니다. 브라우저에서 Svelte를 하이드레이션하지 않으며 폼과 갱신은 공급자 어댑터가 처리합니다.
- **도메인 JSON API가 없습니다.** HTML 공급자는 form POST와 HTML 응답을 사용합니다. SSE는 재렌더 알림만 보내고 공급자 어댑터가 새 HTML을 받습니다. SignalR 협상, LiveView 프레임, Next의 내부 직렬화는 공급자 내부 구현입니다.
- **컴포넌트 마크업에 스타일이 없습니다.** 공급자가 `article`, `h3`, `p`, `output`, `button`, `footer`, `time`을 내보내면 `host/src/styles.css`가 꾸밉니다. 이런 의미론적 마크업이 디자인 계약입니다.

## 의도적인 한계

- 신뢰하는 공급자만 같은 문서에 로드합니다. 원격 JavaScript는 호스트와 같은 권한을 가지므로 이 구조는 보안 샌드박스가 아닙니다. HTML 어댑터의 간단한 검사는 범용 sanitizer가 아닙니다.
- HTML 공급자 상태는 인스턴스별 임의 ID로 구분한 프로세스 메모리에 있으며 30분간 미사용 시 정리됩니다. 재시작 시 사라지고 여러 replica 사이에 공유되지 않습니다. 로그인·업무 권한·영속 저장소는 이 카운터 실증에 포함하지 않았습니다. 쓰기 요청에는 Origin 검사가 있습니다.
- HTML 조각은 교체 방식입니다. 버튼 포커스는 복원하지만 편집 중인 입력값·선택 영역까지 보존하는 DOM morphing은 없습니다.
- Blazor는 문서에서 하나의 런타임과 공급자 circuit을 공유합니다. 카드 해제는 root와 타이머를 dispose하며 공유 circuit 자체는 남습니다. 여러 독립 Blazor 서버의 동시 연결은 별도 실증 대상입니다.
- Phoenix는 문서당 한 공급자/한 LiveView island를 실증합니다. 마운트 해제 시 view와 socket을 종료하고 재마운트 때 클라이언트를 재사용합니다. 호스트 body를 소유하지 않도록 LiveView 1.2의 내부 `joinDeadView` 훅을 비활성화했으므로 버전 갱신 시 재검증해야 합니다. 여러 Phoenix 공급자의 전역 이벤트 및 root 탐색 격리는 추가 작업이 필요합니다.
- 운영 URL·TLS·인증은 별도 구성입니다. 현재는 `localhost`의 서로 다른 포트를 직접 연결합니다. Phoenix의 기본 secret은 로컬 데모용이며 외부 배포에서는 `PHOENIX_SECRET_KEY_BASE`를 설정해야 합니다. 실제 cross-site 배포에서는 쿠키/CSRF 정책까지 맞춰야 합니다.

## 검증

Compose가 실행 중인 상태에서:

```sh
npm ci
npx playwright install chromium
npm test
```

실제 브라우저에서 여덟 카드 렌더링, 클릭, 시각 갱신, 공통 CSS, 테마 변경 후 상태 유지, 별도 브라우저 세션의 상태 독립성, 해제/재마운트, 비동기 마운트 취소, 모바일 가로 넘침을 검사합니다. Blazor/Phoenix WebSocket 연결과 서버 카드 다섯 개의 카운트 1·2가 각 컨테이너 로그에 기록되는지도 확인합니다. 스크린샷은 `test-results/`에 저장합니다.

## 참고

- [사용자의 BlazorRemoteComponentTemplate](https://github.com/naratteu/BlazorRemoteComponentTemplate) — 기존 원격 Blazor 실증의 부트스트랩/연결 방식 참고
- [CSS Zen Garden의 꿈](https://news.hada.io/topic?id=33798)
- [Astro renderer](https://docs.astro.build/en/reference/renderer-reference/)
- [Svelte server rendering](https://svelte.dev/docs/svelte/svelte-server)
- [Next Server/Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Blazor JavaScript root components](https://learn.microsoft.com/en-us/aspnet/core/blazor/components/js-spa-frameworks?view=aspnetcore-10.0)
- [Phoenix LiveView JavaScript interop](https://hexdocs.pm/phoenix_live_view/js-interop.html)
