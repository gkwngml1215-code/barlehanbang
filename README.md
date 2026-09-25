# 바를정한방병원 안면마비·재활센터 홈페이지 - 작업 안내

울산 정한의원(junghani) · 수원 바를정한의원(sw-bareul) 과 같은 구조(정적 HTML + Node 빌드 + GitHub/Cloudflare Pages + 어드민)입니다.
디자인은 oahclinic.com 의 레이아웃·무드를 참고하고, 색과 CI 는 바를정한방병원 공식 CI(네이비 #1D3752 · 블루 #214D72 · 스틸블루 #63839C)를 씁니다.
콘텐츠 원칙과 SEO/GEO 설계는 `구현가이드.md` 를 따릅니다.

## 1. 여는 방법

- **가장 쉬운 방법: `서버-켜기.bat` 더블클릭** (상위 폴더의 `홈페이지-서버-켜기.bat` 도 같은 역할). 검은 창이 뜨고 2초 뒤 브라우저에 어드민이 열립니다. 창을 닫으면 서버가 꺼집니다.
  - `index.html` 을 더블클릭해서 여는 방식(`file://`)은 절대경로 때문에 스타일이 깨지고 어드민도 동작하지 않습니다. 반드시 서버로 여세요.
  - "포트 8080 이 이미 사용 중" 이 뜨면 이전 창이 아직 열려 있는 것입니다. 그 창을 닫고 다시 실행하세요.
  - 함께 있는 `전체-다시-생성.bat` 은 빌드, `GitHub에-올리기.bat` 은 커밋·푸시·어드민 동기화를 한 번에 합니다.
- 방법 A (명령어): 사이트 폴더에서 `node tools/admin-server.js` 실행 → 홈페이지 `http://localhost:8080/`, 어드민 `http://localhost:8080/admin/`
- 방법 B: VS Code 확장 **Live Server** 로 `index.html` 열기 (홈페이지만 볼 때. 어드민은 동작 안 함)
- 헤더·푸터는 JS 로 불러오지 않고 각 HTML 에 **정적으로 삽입**되어 있어 `file://` 로 열어도 메뉴가 보입니다. 다만 절대경로(`/assets/…`)를 쓰므로 스타일은 로컬 서버로 열어야 제대로 보입니다.
- 처음 받았거나 메뉴(`components/`)·설정(`site.json`)·칼럼을 손으로 고쳤다면 한 번 `node tools/build.js` 를 실행해 전체 페이지를 갱신하세요.

## 1-1. 어드민 (원장칼럼 관리)

- 주소: `http://localhost:8080/admin/` · 비밀번호: `tools/admin-config.json` 의 `password` (처음 값 `bareul1075`)
- 할 수 있는 것: 칼럼 목록, 새 글 쓰기(제목·작성자·카테고리·**관련 진료 페이지**·description·keywords·**유튜브 영상**·schema·내용 편집기(정답 박스·체크리스트·표)·썸네일·alt + 핵심 요약·FAQ·참고 자료), 수정, 삭제, 임시저장, 예약 발행, 미리보기, 전체 다시 생성, **홈페이지 설정**(전화·주소·진료시간·채널·SEO·공지 띠)
- 저장하면 칼럼 페이지 생성 → 목록(12개씩 페이지네이션) · 메인 칼럼 6개 · 진료 페이지 하단 "관련 원장칼럼 3개" 갱신 → SEO 데이터·sitemap·RSS·llms.txt 갱신까지 자동
- 자세한 사용법: `column/칼럼 작성 가이드.md`
- **인터넷 어드민(배포 후):** `https://barlehanbang-admin.pages.dev` (Cloudflare Pages, `admin` 브랜치, `_worker.js` 아이디·비밀번호 잠금) 에서 GitHub 접속 키로 로그인하면 어느 컴퓨터에서나 칼럼을 쓸 수 있습니다. 글은 GitHub `main` 의 `column/_data/` 에 저장되고, Cloudflare Pages 가 `node tools/build.js` 로 홈페이지를 자동 생성합니다. 설치 순서는 `배포가이드.md`.

## 2. 폴더 구조

```
index.html                  메인 (히어로 · 4대 프로그램 · 골든타임 · 원장칼럼(중앙) · 대표원장 · 핵심치료 탭 · 재활 · 특장점 · FAQ · 오시는 길)
404.html                    없는 주소
privacy/                    개인정보처리방침
site.json                   전화·주소·진료시간·채널·SEO·공지 (어드민 "홈페이지 설정"이 저장)
sitemap.xml, robots.txt, llms.txt, column/rss.xml   검색엔진 · AI 검색용 (tools/seo-inject.js 가 자동 생성)
_headers                    Cloudflare Pages 응답 헤더
components/
  header.html               공통 헤더(GNB 5개: 소개 / 안면마비 / 원장칼럼(중앙) / 재활클리닉 / 입원·보험안내) + 전체메뉴 — 메뉴 수정은 이 파일 하나만 고치고 node tools/include.js
  footer.html               공통 푸터 + 플로팅 퀵메뉴(카카오 / 전화 / TOP)
assets/
  css/tokens.css            CI 컬러 변수 · 폰트 · 레이아웃 토큰
  css/reset.css, common.css 기본 · 헤더 · 전체메뉴 · 퀵메뉴 · 푸터 · 버튼 · 섹션 타이틀
  css/main.css              메인 전용 섹션
  css/sub.css               서브 비주얼 · LNB · 본문 요소 · FAQ · CTA · 칼럼 목록/상세
  js/common.js              헤더 스크롤, 전체메뉴, TOP, 현재 메뉴, 탭, 칼럼 필터, 등장 애니메이션
  images/logo/              symbol.svg · symbol-white.svg · logo-h.svg · logo-h-white.svg · logo-v.svg · symbol.png (실제 CI 심볼)
  images/…                  hero/ programs/ doctors/ facility/ rehab/ features/ column/ sub/ location/ icons/  (※ 사진은 자리표시 SVG — 실제 사진으로 교체 필요)
about/                      병원 소개 index / doctors / facility / location
facial-palsy/               안면마비 허브 index / bells-palsy / ramsay-hunt / sequelae / treatment / trigeminal / asymmetry
rehab/                      재활클리닉 index / traffic-accident / post-surgery / spine
admission/                  입원·보험 index / guide / insurance / non-covered
column/                     원장칼럼: index(목록, 빌드가 갱신) · _data/(글 원본 JSON) · <slug>/index.html(빌드 생성) · page/N/(빌드 생성) · _template.html · 칼럼 작성 가이드.md
admin/                      어드민 화면 (index.html · config.json · _worker.js · logo/)
tools/
  admin-server.js           로컬 서버 + 어드민 API (node tools/admin-server.js)
  build.js                  전체 빌드 (include → site-apply → 칼럼 → seo-inject → dist/)
  include.js                components/ 헤더·푸터를 모든 페이지에 정적 삽입
  site-apply.js             site.json 값을 data-site 자리에 반영
  column-render.js          칼럼 JSON → 페이지 · 목록 · 메인 · 관련칼럼 생성기
  seo-inject.js             SEO/GEO/AEO 자동 주입 (canonical · OG · JSON-LD · sitemap · robots · llms.txt · rss)
  sync-admin.js             admin/ 폴더를 admin 브랜치로 푸시
  preview-drafts.js         임시저장·예약 글을 내 PC 에서 미리보기
  scheduler-worker/         예약 발행 Cloudflare Worker
  admin-config.json         로컬 어드민 비밀번호 (git 제외)
```

## 3. 병원 기본 정보 (구현가이드 기준 — NAP 는 본 사이트·네이버 플레이스와 글자 하나까지 동일해야 함)

| 항목 | 내용 |
|---|---|
| 상호 | 바를정한방병원 (안면마비·재활센터) |
| 대표 | 정인호 대표원장 — 대한안면학회 회장 · 구안와사연구회 회장 · 우석대 한의학과 외래교수 |
| 사업자등록번호 | 205-43-45967 |
| 주소 | 서울특별시 관악구 남부순환로 1485 삼남빌딩 1층·8층·9층 |
| 전화 | 02-3281-1075 |
| 카카오톡 채널 | https://pf.kakao.com/_kxjdkxb |
| 유튜브 | https://www.youtube.com/@Bareuljung_Korea |
| 본 사이트 | https://barrrjung-hospital.co.kr/ |
| 진료시간 | 평일 09:00~20:00 (점심 13:00~14:00) / 주말·공휴일 09:00~15:00 (점심 없음) |
| 입원 | 65병상 · 한·양방 협진 의료진 7인 |

전화·주소·진료시간·링크는 어드민 **홈페이지 설정**(`site.json`)에서 고치면 전 페이지와 구조화 데이터에 반영됩니다.

## 4. 원장칼럼 올리는 방법

어드민에서 씁니다. `column/칼럼 작성 가이드.md` 참고. 초기 칼럼 6편(`column/_data/`)이 들어 있습니다. 구현가이드 7-3 의 나머지 10편 주제를 주 1편씩 발행하세요.

## 4-1. 구안와사 FAQ (110문답) 고치는 방법

페이지: `/facial-palsy/faq/` (안면마비 메뉴 > 구안와사 FAQ). 검색창·분류 버튼·모두 펼치기가 있고 답변은 기본으로 접혀 있습니다.

- 질문·답변 원본은 `facial-palsy/faq/_data/gwanwasa.json` 하나뿐입니다. 여기만 고치고 `전체-다시-생성.bat` 을 실행하면 페이지·구조화 데이터(FAQPage)·사이트맵이 함께 갱신됩니다.
- 항목 형식: `{ "id": 12, "cat": "basic", "q": "질문", "a": ["문단", "문단", { "list": ["항목", "항목"] }] }`. `cat` 은 `categories` 에 있는 id(basic·symptom·cause·treatment·recovery·care·sequelae)만 씁니다.
- `facial-palsy/faq/index.html` 의 `<!-- faq:start -->`~`<!-- faq:end -->` 안쪽은 자동 생성이므로 직접 고치지 마세요.
- 특정 질문으로 바로 가는 주소: `/facial-palsy/faq/#q12`, 검색어를 미리 넣는 주소: `/facial-palsy/faq/?q=재발`.
- 원본 텍스트(`바를정질문.txt`)에 있던 "보증·100%·10배 빠름·치료 경험담·비급여 금액" 표현은 의료광고 기준에 맞춰 손봤고, 회복률 수치는 Peitersen(2002) 관찰 연구를 출처로 달았습니다. 새 답변을 넣을 때도 같은 기준을 지켜 주세요.

## 5. SEO · GEO · AEO 구조

- 모든 페이지 `<head>` 에 `<!-- seo:start -->` ~ `<!-- seo:end -->` 블록이 자동 생성됩니다: canonical, robots, keywords, 소유확인 코드, Open Graph, Twitter Card, 지역 메타, JSON-LD.
- JSON-LD: Hospital+MedicalClinic(주소·진료시간·65병상·sameAs), Physician(정인호 — alumniOf·memberOf·knowsAbout), WebSite, MedicalWebPage(질환 페이지는 about=MedicalCondition), BreadcrumbList, FAQPage(`details.faq-item` 에서 자동 추출), Article(칼럼), VideoObject(영상 임베드 칼럼).
- GEO/AEO: 질문형 H2 + 첫 문장 결론(`.key-answer`), 표는 `<table>`, 칼럼마다 핵심 요약·FAQ·참고 자료·감수 표기, `speakable` 지정, `llms.txt`, AI 크롤러 허용 `robots.txt`, `column/rss.xml`(네이버 서치어드바이저 RSS 제출용).
- **사이트 주소(SITE_URL)** 는 `admin/config.json` 의 `siteUrl` 에서 읽습니다. 빌드 환경변수 `URL`/`SITE_URL` 이 있으면 우선. 도메인 확정 후 반드시 바꾸세요.

## 6. 남은 확인 사항 (병원에서 받아야 할 것)

- **도메인**: `https://sr-bareul.co.kr` (2026-09-25 확정, www 는 이 주소로 리다이렉트). 바꿀 일이 생기면 `admin/config.json` siteUrl · `tools/scheduler-worker/wrangler.toml` SITE_URL 수정 후 빌드.
- **로고 원본(AI/SVG)**: 현재 `assets/images/logo/` 의 심볼은 CI 색으로 그린 SVG, 워드마크는 폰트 텍스트입니다. 원본을 받으면 `logo-h.svg` · `logo-h-white.svg` · `logo-v.svg` 를 교체하세요 (크기·클래스명 유지).
- **정사각 PNG 로고** `assets/images/logo/logo-v-512.png` (JSON-LD `logo` 용, 512×512) 와 **OG 이미지** `assets/images/og/og-default.jpg` (1200×630) — 현재 파일이 없어 링크만 걸려 있습니다. 로고 원본으로 만들어 넣으세요.
- **사진**: `assets/images/` 의 hero · programs · doctors · facility · rehab · features · sub · column 은 모두 자리표시 SVG 입니다. 실제 사진(WebP, 히어로 200KB 이하)으로 교체하고 alt 를 확인하세요. 파일명을 그대로 쓰되 확장자만 바꾸면 각 HTML 의 `src` 를 함께 고쳐야 합니다.
- **의료진 프로필**: 개별 사진과 세부 약력 (`about/doctors/`).
- **비급여 금액**: `admission/non-covered/` 의 "원내 게시 참조" 를 실제 금액으로. 본 사이트 비급여 페이지와 동일하게.
- **증명서 수수료**: `admission/insurance/` 의 금액을 병원 확정값으로.
- **위도·경도**: 어드민 홈페이지 설정에 넣으면 geo 구조화 데이터 생성.
- **네이버 플레이스 · 블로그 · 인스타 URL**: 어드민 홈페이지 설정 → `sameAs` 에 자동 포함.
- **네이버 서치어드바이저 · 구글 서치콘솔 소유확인 코드**: 어드민 홈페이지 설정.
- 치료 전후 사진·환자 후기·연예인 사진은 의료광고법에 따라 이 사이트에 넣지 않습니다.

## 7. 원본 자료 위치

`../바를정_안면마비재활_홈페이지_구현가이드(원본).md` — 처음 받은 구현 가이드. 이 저장소의 `구현가이드.md` 는 실제 구현에 맞춰 정리한 버전입니다.
