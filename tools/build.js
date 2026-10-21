/**
 * 배포용 빌드 스크립트 — Cloudflare Pages 가 저장소(main)를 받을 때마다 실행합니다.
 * ------------------------------------------------------------
 *  1. components/header.html · footer.html 을 모든 페이지에 정적으로 삽입 (tools/include.js)
 *  2. site.json(진료시간·전화·주소·링크·SEO·공지) 을 페이지에 반영 (tools/site-apply.js)
 *  3. column/_data/*.json → 칼럼 페이지 · 목록(페이지네이션) · 메인 칼럼 섹션 · 진료 페이지 관련 칼럼 생성
 *  4. tools/seo-inject.js 실행 (canonical · OG · JSON-LD · sitemap · robots · llms.txt · rss)
 *  5. build-info.json 기록 (어드민이 "배포 완료" 를 확인하는 데 사용 — 예약 날짜는 넣지 않음)
 *  6. 공개할 파일만 dist/ 로 복사 (tools · admin · components · 칼럼 원고 JSON · 안내 문서는 제외)
 *  7. dist/ 의 모든 페이지 사진 alt 에 지역 키워드 보정 (tools/geo-column.js)
 *
 * Cloudflare Pages 설정:  Build command = node tools/build.js   /   Build output directory = dist
 * 로컬에서 시험:          사이트 폴더에서  node tools/build.js   → dist/ 가 생김 (git 에는 올라가지 않음)
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const INC = require("./include");
const SA = require("./site-apply");
const R = require("./column-render");
const FAQ = require("./faq-render");

const ROOT = R.ROOT;
const DIST = path.join(ROOT, "dist");

console.log(`헤더·푸터 삽입: 바뀐 파일 ${INC.includeAll()}개`);
const applied = SA.applyAll();
console.log(`홈페이지 설정 반영: 바뀐 파일 ${applied.changed}개`);

console.log(`FAQ 페이지 생성: 바뀐 파일 ${FAQ.renderAll()}개`);
const published = R.rebuildAll();
console.log(`칼럼: 공개 ${published}편`);

execFileSync(process.execPath, [path.join(__dirname, "seo-inject.js")], { cwd: ROOT, stdio: "inherit" });

const commit = process.env.CF_PAGES_COMMIT_SHA || process.env.COMMIT_REF || "";
// build-info.json 은 공개 파일이라 예약 날짜 같은 내부 정보는 넣지 않는다
fs.writeFileSync(path.join(ROOT, "build-info.json"), JSON.stringify({ commit, builtAt: new Date().toISOString(), branch: process.env.CF_PAGES_BRANCH || "" }, null, 2));

// 공개 제외 목록 (저장소 루트 기준)
const EXCLUDE = new Set(["tools", "admin", "image", "components", "dist", "node_modules", ".git", ".github", ".scheduled-publication-trigger", ".gitignore", ".node-version", "site.json", "README.md", "배포가이드.md", "구현가이드.md", "package.json", "package-lock.json", ".wrangler", ".dev.vars"]);
const EXCLUDE_PATHS = new Set(["column/_data", "facial-palsy/faq/_data", "column/_preview", "column/_template.html", "column/칼럼 작성 가이드.md"]);

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
const keep = (src) => !EXCLUDE_PATHS.has(path.relative(ROOT, src).split(path.sep).join("/"));
for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (EXCLUDE.has(e.name)) continue;
  fs.cpSync(path.join(ROOT, e.name), path.join(DIST, e.name), { recursive: true, filter: keep });
}
// 모든 공개 페이지의 사진 alt 에 지역 키워드를 넣는다 (GEO 작성원칙 — admin/config.json geo.region)
const GEOC = require("./geo-column");
console.log(`사진 alt 지역 키워드 보정: 바뀐 페이지 ${GEOC.enforceAltsInTree(DIST, GEOC.GEO.reviewer.clinic || "")}개`);
const n = (function count(d) { return fs.readdirSync(d, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? count(path.join(d, e.name)) : 1), 0); })(DIST);
console.log(`dist/ 생성 완료 · 파일 ${n}개 · commit ${commit || "(로컬)"}`);
console.log("빌드 완료");
