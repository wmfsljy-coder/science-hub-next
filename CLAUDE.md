# CLAUDE.md — 과학 수업 허브(science-hub-next) 작업 규칙

@AGENTS.md

## 이 프로젝트는

과목 저장소 12개(44단원)의 내용을 **빌드할 때 읽어서** 목차·지도안·QR 을 보여 주고, **44단원 수업 화면 자체도 이 사이트 안(`/u/<저장소>/<단원>/`)에서 돌리는** 정적 사이트입니다.
Next.js 16 App Router + TypeScript + Tailwind CSS v4, `output: 'export'`, basePath `/science-hub-next`, GitHub Pages(Actions) 배포.

## 꼭 지킬 것

1. **시작 전에 `git pull --rebase`.**
2. 고친 뒤에는 `npm run lint` 와 `npm run build` 가 통과하는지 보고, **커밋하고 푸시**합니다(푸시하면 자동 배포).
3. 작업이 끝나면 `문서/작업일지.md` 맨 아래에 **한 세션당 한 문단**(날짜, 한 일, 확인한 것, 남은 일)을 적습니다.
4. **과목 저장소(integrated-science-1 등 12개)와 science-teacher-hub, Apps Script, 구글 시트는 여기서 고치지 않습니다.** 읽기만 합니다. 단원 내용이 틀렸으면 그 저장소에서 따로 고칩니다.
5. 단원 화면은 **빌드할 때만** `scripts/sync-units.mjs` 가 과목 저장소에서 복사해 옵니다(`public/u/`, `public/engine/`, `public/hub-assets/` 는 git 에 안 올림). 단원 내용·엔진을 고치려면 과목 저장소에서 고치고, 여기서는 복사 규칙(주소 바꾸기·저장소별 파일)만 고칩니다. 단원 화면은 Next 페이지가 아니므로 링크는 `next/link` 가 아니라 일반 `<a href={unit.play}>` 로 겁니다.
6. 학생 진도는 localStorage `sth-<단원ID>`(episodes.js 의 `sthUnit()` 값)라 주소와 상관없이 옛 주소와 이어집니다. 단원 ID 를 바꾸지 마세요.
7. 옛 저장소 로컬 clone 에 다른 작업자의 커밋 안 한 고침이 있을 수 있으니, 검사용 빌드는 `$env:CONTENT_DIR=".content"; node scripts/fetch-content.mjs --clone` 으로 원격 기준 사본을 씁니다(배포와 같음). 내 컴퓨터 검사는 `node scripts/serve-out.mjs 4173 --no-share --tools ..\science-teacher-hub\_tools` 로(공유 주소를 빈칸으로 보냄). 복사한 share-config.js 에서는 localhost 도 뺐습니다. 점검 도구는 `localStorage.clear()` 를 부르므로 실제 사이트에서 돌리지 않습니다.

## 화면 원칙(선생님 취향)

- 화면은 간단하게. 고르는 것은 **탭하는 큰 버튼**(최소 높이 48px 이상), 드롭다운·숨은 메뉴는 쓰지 않습니다.
- 결과는 바로 눈에 보이게(검색은 입력하는 즉시).
- 모든 글은 한국어. 모바일 먼저, 밝게/어둡게 둘 다 확인.
- 무료 호스팅만(GitHub Pages).

## 어디에 무엇이

- `lib/courses.json` — 과목 목록(이름·구분·학년·색). 과목을 더하려면 여기에 한 줄.
- `scripts/fetch-content.mjs` — 과목 저장소 읽기 → `content/generated.json`, `public/thumbs/` (둘 다 git 에 안 올림)
- `lib/content.ts` — 페이지가 쓰는 읽기 함수와 타입
- `app/page.tsx`(홈), `app/c/[repo]/page.tsx`(과목), `app/u/[repo]/[unit]/plan/page.tsx`(지도안·QR)
- `scripts/sync-units.mjs` — 단원 화면 옮겨 담기(엔진 한 벌, 저장소별 share-config·people-data, 허브 자료, 단원 index.html 주소 바꾸기, 빠진 파일 검사)
- `legacy/hub-next.js` — 단원 화면에 끼우는 연결 파일(기준 주소 전역, 교사 기기에만 지도안 링크)
- `scripts/sync-hub.mjs` — 허브 화면 옮겨 담기(class/·records/ 정적 복사, 허브 share-config, plates.kml, phet/ 넘겨주기, 자료실 목록 content/resources.json)
- `legacy/hub/` — class/·records/ 의 이 사이트 판(보안 브랜치 기준 + 옛·새 뒷단 겸용). README 참고
- `app/resources/`(자료실), `app/qr/`(QR 모음·인쇄), `app/maps/`(판 구조 지도), `components/Progress.tsx`(진도 막대), `components/DeviceMode.tsx`(?all=1 학생 모드·교사 기기 표시)
- `scripts/check-units.mjs` — 배포 전 Playwright 점검(Actions 에서 자동)
- `scripts/phase3/make-redirects.mjs` — 3단계 넘겨주기 스크립트(준비만, 돌리지 않음). 설계: `문서/3단계-넘겨주기-설계.md`
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
