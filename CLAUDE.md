# CLAUDE.md — 과학 수업 허브(science-hub-next) 작업 규칙

@AGENTS.md

## 이 프로젝트는

과목 저장소 12개(44단원)의 내용을 **빌드할 때 읽어서** 목차·지도안·QR 을 보여 주는 교사용 정적 사이트입니다.
Next.js 16 App Router + TypeScript + Tailwind CSS v4, `output: 'export'`, basePath `/science-hub-next`, GitHub Pages(Actions) 배포.

## 꼭 지킬 것

1. **시작 전에 `git pull --rebase`.**
2. 고친 뒤에는 `npm run lint` 와 `npm run build` 가 통과하는지 보고, **커밋하고 푸시**합니다(푸시하면 자동 배포).
3. 작업이 끝나면 `문서/작업일지.md` 맨 아래에 **한 세션당 한 문단**(날짜, 한 일, 확인한 것, 남은 일)을 적습니다.
4. **과목 저장소(integrated-science-1 등 12개)와 science-teacher-hub, Apps Script, 구글 시트는 여기서 고치지 않습니다.** 읽기만 합니다. 단원 내용이 틀렸으면 그 저장소에서 따로 고칩니다.
5. 단원 화면의 인터랙티브 코드는 복사하지 않습니다. 항상 `https://wmfsljy-coder.github.io/<저장소>/<단원>/` 으로 연결합니다.

## 화면 원칙(선생님 취향)

- 화면은 간단하게. 고르는 것은 **탭하는 큰 버튼**(최소 높이 48px 이상), 드롭다운·숨은 메뉴는 쓰지 않습니다.
- 결과는 바로 눈에 보이게(검색은 입력하는 즉시).
- 모든 글은 한국어. 모바일 먼저, 밝게/어둡게 둘 다 확인.
- 무료 호스팅만(GitHub Pages).

## 어디에 무엇이

- `lib/courses.json` — 과목 목록(이름·구분·학년·색). 과목을 더하려면 여기에 한 줄.
- `scripts/fetch-content.mjs` — 과목 저장소 읽기 → `content/generated.json`, `public/thumbs/` (둘 다 git 에 안 올림)
- `lib/content.ts` — 페이지가 쓰는 읽기 함수와 타입
- `app/page.tsx`(홈), `app/c/[repo]/page.tsx`(과목), `app/u/[repo]/[unit]/page.tsx`(단원)
- `components/` — HomeBrowser(검색·거르기), QrProjector(QR 크게 띄우기), Markdown, Thumb, Counts, ThemeToggle
- `scripts/serve-out.mjs` — `out/` 을 `/science-hub-next/` 아래로 보여 주는 작은 서버
- `.github/workflows/deploy.yml` — 빌드·배포(푸시, 매일 새벽 3시, 손으로)

## 확인 순서

```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
git pull --rebase
npm run lint; npm run build
npm run serve   # http://localhost:4173/science-hub-next/ 에서 홈·과목·단원·검색 확인
```
