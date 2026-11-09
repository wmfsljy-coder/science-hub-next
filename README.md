# science-hub-next (보관용)

> **정식 주소는 https://wmfsljy-coder.github.io/science-teacher-hub-qtrqwc/ 입니다.**
> 새 허브 화면의 소스는 science-teacher-hub 저장소의 `site/` 폴더로 옮겼고, 빌드·매일 새벽 점검·배포도 그쪽 `.github/workflows/pages.yml` 이 합니다.
> 단원 수업 화면은 각 과목 저장소 주소(`https://wmfsljy-coder.github.io/<저장소>/<단원>/`)가 정식입니다.

이 저장소의 Pages(`/science-hub-next/`)는 이제 **넘겨주기 페이지**만 올립니다(`scripts/make-archive.mjs`, 목록 `archive/units.json`).

| 예전 주소 | 넘어가는 곳 |
|-|-|
| `/science-hub-next/` | `/science-teacher-hub/` |
| `/science-hub-next/c/<저장소>/` | `/science-teacher-hub/c/<저장소>/` |
| `/science-hub-next/u/<저장소>/<단원>/` | `/<저장소>/<단원>/` (정식 단원 주소, `?sec=`·`?open=`·`#` 그대로) |
| `/science-hub-next/u/<저장소>/<단원>/plan/` | `/science-teacher-hub/u/<저장소>/<단원>/plan/` |
| `/science-hub-next/resources/`·`qr/`·`maps/`·`class/`·`records/`·`phet/` | `/science-teacher-hub/` 의 같은 화면 |

아래 코드(app/, scripts/ 등)는 옮기기 전 시점의 기록으로 남겨 둔 것입니다. 고치지 말고 science-teacher-hub/site/ 에서 고치세요.

---
# 과학 수업 허브 (science-hub-next)

고등학교 과학 **12과목 44단원**의 인터랙티브 수업을 한곳에서 찾고, 지도안을 읽고, 학생에게 QR로 바로 여는 사이트입니다. 44단원 수업 화면도 이 사이트 안에서 돌아갑니다.

- 바로 열기: https://wmfsljy-coder.github.io/science-hub-next-ywarpe/
- 예전 허브: https://wmfsljy-coder.github.io/science-teacher-hub-qtrqwc/

## 무엇이 있나요

| 화면 | 주소 | 하는 일 |
|---|---|---|
| 홈 | `/` | 과목 카드 12개(단원 수 표시), 단원 이름·주제어·성취기준 코드 즉시 검색, 학년·과목군 큰 버튼 거르기 |
| 과목 | `/c/<저장소>/` | 단원 카드(대표 그림·제목·요약·구성 숫자), 큰 **수업 열기** 버튼 |
| 단원 수업 | `/u/<저장소>/<단원>/` | 실제 수업 화면(들어가기·이야기·수준별 문제·응용 실험실·실제 자료·정리하기·우리 반). `?sec=02`, `?open=1`(교사 모두 열기) 그대로 |
| 자료실 | `/resources/` | 단원에 붙인 '진짜 보기' 자료 543곳 — 입력 즉시 찾기, 과목·종류 큰 버튼, 40개씩 보기(`#PhET` 처럼 종류 이름을 붙이면 그 종류만). `/phet/` 은 여기 PhET 칸으로 |
| 학생 입장 QR 모음 | `/qr/` | 과목 전체(`?all=1`)·단원·소단원 QR, 크게 띄우기, A4 한 장에 6개 인쇄. `?s=과목이름`·`?u=저장소/단원` |
| 교사 화면 | `/class/` | 반별 활동·수업 효과·모둠 편성(옛 허브 화면을 주소만 바꿔 그대로, 교사 열쇠는 탭을 닫으면 잊음) |
| 학생 기록 | `/records/` | 로그인 학생 기록·명단·PIN 초기화·PIN 정하기 창(새 뒷단일 때만 보임), `?mock=1` 연습 |
| 판 구조 지도 | `/maps/` | plates.kml 내려받기, 구글 내 지도 열기·다시 올리는 법 |
| 지도안·QR | `/u/<저장소>/<단원>/plan/` | 지도안(LESSON.md) 전문, 수업 흐름 단계, 차시 한눈에, 성취기준, **학생 입장 QR**(크게 띄우기), 수업 열기·교사 미리 보기 |

### 단원 수업 화면은 어떻게 돌아가나요

- 빌드할 때 `scripts/sync-units.mjs` 가 과목 저장소의 단원 폴더(자료 js·data·img)와 `index.html` 을 `public/u/<저장소>/<단원>/` 으로 복사합니다. `index.html` 은 엔진 주소만 바꾸고 나머지는 원본 그대로라, 옛 엔진이 원래 순서대로 불립니다.
- 공용 엔진(theme·scope·kit·story·quiz·lab·share·account·review·peer·qboard·link·precheck·inquiry·measure·debate·aicheck·life-kit·climate-life·qrcode, CSS)은 **한 벌**만 `public/engine/` 에 둡니다(12벌 사본을 비교해 가장 최근 것을 고름, 주소 뒤 `?v=해시`). 엔진 속 `/science-teacher-hub/assets/` 절대 주소는 복사본에서만 `/science-hub-next/hub-assets/` 로 바꿉니다.
- 저장소마다 다른 `share-config.js`(반 목록·공유 주소)와 `people-data.js`(인물 카드)는 `public/u/<저장소>/assets/` 에 둬서 단원 페이지의 `../assets/` 가 그대로 가리킵니다.
- 같은 주소 바탕(`wmfsljy-coder.github.io`)이라 학생 진도(localStorage `sth-<단원ID>`)가 옛 주소와 이어집니다.
- 단원 하나가 페이지 하나라(전체 새로 고침) 단원끼리 같은 전역 이름(예: `REAL_CO2`)이 부딪히지 않습니다.
- 옛 과목 저장소 주소도 그대로 살아 있습니다(넘겨주기는 3단계, 설계: `문서/3단계-넘겨주기-설계.md`).
- 첫 화면의 진도 막대는 이 기기의 localStorage 진도를 옛 허브와 같은 방식으로 셉니다. 과목 전체 QR(`/c/<저장소>/?all=1`)로 들어온 학생 기기는 교사 단추가 숨겨지고, 단원 안에서도 그 과목 밖으로 나가지 않습니다.
- `class/`·`records/` 는 science-teacher-hub main 의 화면을 주소만 바꿔 씁니다(교사 열쇠는 탭을 닫으면 잊음, PIN 정하기 창·관리 열쇠, 서버 값 이스케이프).

### 배포 전 자동 점검
`scripts/check-units.mjs` 가 out/ 을 공유 끈 로컬 서버로 띄우고 Playwright 로 옛 점검 도구(allcheck·quizrun·labrun·tabcheck)를 새 경로로 돌립니다. 단원마다 콘솔 오류·실패 파일·안 보이는 탭도 봅니다. 푸시는 표본(15단원), 매일 새벽·손으로 돌릴 때는 44단원 전부. 하나라도 실패하면 배포하지 않습니다(결과는 Actions 의 check-report).
```powershell
$env:PW_CHANNEL = "msedge"   # 내 컴퓨터에서는 설치된 엣지로
node scripts/check-units.mjs        # 표본
node scripts/check-units.mjs --all  # 전부
```

## 내용은 어떻게 가져오나요

1. `lib/courses.json` 에 과목 12개(저장소 이름·과목명·구분·학년·색)가 적혀 있습니다.
2. `scripts/fetch-content.mjs` 가 빌드 전에 돌면서 각 과목 저장소에서 읽습니다.
   - 과목 `index.html` → 과목 소개, 단원 카드(대단원·번호·제목·요약·주제어)
   - 단원 `index.html` → 탭 순서(수업 흐름), 첫 대표 그림
   - 단원 `LESSON.md` → 성취기준, 차시, 구성 숫자(이야기·문제·실험실·실제 자료), 지도안 본문
   - 단원 `precheck-items.js` → 사전 점검 문항 수
   - 대표 그림은 `sharp` 로 480px 작은 그림으로 줄여 `public/thumbs/` 에 둡니다.
3. 결과는 `content/generated.json` 에 저장되고, `lib/content.ts` 가 이것을 읽어 페이지를 만듭니다.
4. 내용 폴더 위치는 환경 변수 **`CONTENT_DIR`** 로 정합니다. 없으면 이 프로젝트의 상위 폴더(`과학허브`)를 씁니다.
   GitHub Actions 에서는 `--clone` 으로 공개 과목 저장소를 `.content/` 에 얕게 받아 씁니다.

과목 저장소의 파일은 **읽기만** 합니다. 단원 내용을 고치려면 해당 과목 저장소에서 고치세요. 다음 배포(푸시하거나 매일 새벽 3시 자동)에 반영됩니다.

## 내 컴퓨터에서 실행

```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm install
npm run dev          # 개발 서버: http://localhost:3000/science-hub-next/
npm run build        # 정적 사이트를 out/ 에 만듦 (빌드 전에 내용 모으기가 자동 실행)
npm run serve        # out/ 을 http://localhost:4173/science-hub-next/ 로 보기
# 검사할 때: 공유 끄고 옛 점검 도구를 /_tools/ 로
node scripts/serve-out.mjs 4173 --no-share --tools ..\science-teacher-hub\_tools
npm run lint
```

과목 저장소가 다른 곳에 있으면 `$env:CONTENT_DIR = "D:\경로\과학허브"` 처럼 정한 뒤 실행합니다.

## 배포

- `main` 에 푸시하면 `.github/workflows/deploy.yml` 이 과목 저장소를 받아 빌드하고 GitHub Pages 에 올립니다.
- 매일 새벽 3시(한국 시간)에도 자동으로 다시 빌드해 단원 변경을 반영합니다. Actions 탭에서 **Run workflow** 로 손으로도 돌릴 수 있습니다.
- Pages 설정: Settings → Pages → Source 가 **GitHub Actions** 여야 합니다.
- 무료: GitHub Pages·Actions 무료 범위 안에서 동작합니다(공개 저장소).

## 만든 도구

Next.js 16(App Router, 정적 내보내기) · TypeScript · Tailwind CSS v4 · react-markdown + remark-gfm · qrcode(빌드 때 SVG 생성) · sharp(작은 그림)

> 보여 주기만 하는 사이트라 Astro 로 옮길지 여부는 나중에 판단합니다(지금은 Next.js 정적 내보내기로 충분히 동작).

## 라이선스

코드는 MIT, 학습 내용은 CC BY-NC-SA 4.0 (각 과목 저장소와 같음).
