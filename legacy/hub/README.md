# legacy/hub — 옛 허브 화면 중 이 사이트가 직접 갖고 있는 판

`scripts/sync-hub.mjs` 는 여기 파일이 있으면 science-teacher-hub main 대신 이것을 씁니다(주소만 바꿔 `public/<화면>/` 으로).

| 파일 | 기준 | 손본 것 |
|-|-|-|
| `class/index.html` | science-teacher-hub `security/share-backend` 브랜치 a9f6345 (교사 열쇠 sessionStorage) | 열쇠 안내 문구, 공유 주소가 비었을 때 안내 문구 |
| `records/index.html` | 같은 브랜치 a9f6345 (PIN 정하기 창, 관리 열쇠, innerHTML 정리) | **옛 뒷단·새 뒷단 겸용**: accRoster 응답에 `pinOpen` 이 있을 때만 'PIN 정하기 열기'·관리 열쇠 칸을 보이고 관리 열쇠를 요구. 없으면(옛 뒷단) 숨기고 관리 열쇠 없이 PIN 초기화 |

브랜치가 main 에 합쳐지고 새 뒷단이 배포되면 이 폴더를 지워 main 판을 읽게 합니다(겸용 손질이 main 에 없다면 records 만 남겨 둡니다).
