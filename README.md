# 바를정한방병원 안면마비·재활센터 어드민

- 이 폴더(`main` 브랜치의 `admin/`)가 어드민의 원본입니다. 고친 뒤 사이트 폴더에서 `node tools/sync-admin.js` 를 실행하면 `admin` 브랜치로 복사되고, Cloudflare Pages 프로젝트 `barlehanbang-admin` 이 1~2분 뒤 자동 배포합니다.
- `admin` 브랜치를 직접 고치지 마세요 (다음 동기화 때 덮어씁니다).
- `_worker.js` 는 아이디·비밀번호 잠금입니다. 지우거나 이름을 바꾸면 잠금이 풀립니다. 아이디·비밀번호는 Cloudflare 대시보드 Variables and Secrets 의 `ADMIN_USER` / `ADMIN_PASS` 입니다.
- `config.json` 에 저장소(owner/repo/branch), 홈페이지 주소(siteUrl), 칼럼 카테고리, 관련 진료 페이지 목록이 있습니다. **도메인이 확정되면 `siteUrl` 을 바꾸세요.**
- 로컬에서는 `node tools/admin-server.js` 로 `http://localhost:8080/admin/` 에서 같은 화면을 비밀번호로 씁니다.

## 지키는 원칙 (울산 정한의원 어드민과 동일)

1. 글 한 편 = JSON 파일 하나(`column/_data/<slug>.json`). 저장은 그 파일만 추가·수정하며 다른 글은 건드리지 않습니다 (덮어쓰기 금지, 병합만).
2. 글 목록의 진짜 원본은 GitHub 저장소(배포된 사이트)입니다. 브라우저 저장공간 기준으로 목록을 만들지 않습니다.
3. 새 글의 주소(slug)가 저장소에 이미 있으면 저장을 멈춥니다.
4. 삭제는 [삭제] 버튼 → 확인창을 눌렀을 때만 됩니다.
5. 저장 전 확인창에서 새 글/수정, 상태, 주소, 관련 페이지, 올라가는 사진 수를 보여줍니다.
6. 소스는 GitHub 에 커밋하고 Cloudflare Pages 는 Git 연결로 배포합니다 (Direct Upload 금지).
