/**
 * 원장칼럼 생성기 — JSON(어드민 입력값) → 칼럼 페이지 / 목록 / 메인 칼럼 섹션 / 진료 페이지의 관련 칼럼
 * admin-server.js · build.js 가 사용합니다. 직접 실행하지 않습니다.
 *
 *  글 원본   column/_data/<slug>.json
 *  글 페이지 column/<slug>/index.html            (주소: /column/<slug>/)
 *  목록      column/index.html  (<!-- posts:start --> ~ <!-- posts:end -->, 12개씩)  + column/page/2/ …
 *  메인      index.html         (<!-- home-posts:start --> ~ <!-- home-posts:end -->, 최신 6개)
 *  진료 페이지 <!-- related-columns:start --> ~ <!-- related-columns:end --> (글의 "관련 진료 페이지" 기준 3개)
 */
const fs = require("fs");
const path = require("path");
const INC = require("./include");
const SA = require("./site-apply");

const ROOT = path.resolve(__dirname, "..");
const COLUMNS_DIR = path.join(ROOT, "column");
const DATA_DIR = path.join(COLUMNS_DIR, "_data");
const PAGES_DIR = path.join(COLUMNS_DIR, "page");
const INDEX_FILE = path.join(COLUMNS_DIR, "index.html");
const HOME_FILE = path.join(ROOT, "index.html");
const PAGE_SIZE = 12;
const GENERATED = '<meta name="generator" content="bareuljung-column">';

// 카테고리·기본 작성자·관련 페이지 목록은 admin/config.json 에서 읽음 (어드민과 같은 값을 쓰기 위해)
let ADMIN_CFG = {};
try { ADMIN_CFG = JSON.parse(fs.readFileSync(path.join(ROOT, "admin", "config.json"), "utf8")); } catch (e) {}
const CATEGORIES = ADMIN_CFG.categories || ["안면마비", "후유증·재발", "재활·통증", "생활관리", "병원소식"];
const RELATED_PAGES = ADMIN_CFG.relatedPages || {};
const DEFAULT_AUTHOR = ADMIN_CFG.author || "정인호 대표원장";
const DEFAULT_THUMB = "/assets/images/column/default-thumb.svg";
const DOCTOR_IMG = "/assets/images/doctors/jung-inho.jpg";

function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function fmtDate(iso) {
  const [y, m, d] = String(iso || "").split("-").map(Number);
  return y ? `${y}년 ${m}월 ${d}일` : "";
}
function textOf(html) {
  return String(html || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
function readingMinutes(html) {
  const chars = textOf(html).replace(/\s/g, "").length;
  return Math.max(1, Math.round(chars / 500));
}
function youtubeId(url) {
  const m = String(url || "").match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : "";
}

// ---------- 예약 발행 ----------
// 상태가 "공개" 라도 발행일이 아직 오지 않은 글은 홈페이지에 내보내지 않습니다 (한국 시간 기준).
// 그날이 되면 tools/scheduler-worker 가 Cloudflare 에 다시 빌드를 요청해서 공개됩니다.
function todayKST() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}
function isLive(post) {
  return post.status !== "draft" && String(post.published || "") <= todayKST();
}
function isScheduled(post) {
  return post.status !== "draft" && !isLive(post);
}
function nextScheduled() {
  return listPosts().filter(isScheduled).map((p) => p.published).sort()[0] || "";
}

// ---------- 데이터 파일 ----------
function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
function listPosts() {
  ensureDirs();
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8")))
    .sort((a, b) => (b.published || "").localeCompare(a.published || "") || (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}
function readPost(slug) {
  const f = path.join(DATA_DIR, slug + ".json");
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
}
function writePost(post) {
  ensureDirs();
  fs.writeFileSync(path.join(DATA_DIR, post.slug + ".json"), JSON.stringify(post, null, 2) + "\n");
}
function postDir(slug) {
  return path.join(COLUMNS_DIR, slug);
}
function deletePost(slug) {
  const j = path.join(DATA_DIR, slug + ".json");
  if (fs.existsSync(j)) fs.unlinkSync(j);
  removeGeneratedDir(postDir(slug));
}
// 우리가 만든 칼럼 폴더만 지운다 (index.html 에 generator 표시가 있는 폴더)
function removeGeneratedDir(dir) {
  const f = path.join(dir, "index.html");
  if (fs.existsSync(f) && fs.readFileSync(f, "utf8").includes(GENERATED)) fs.rmSync(dir, { recursive: true, force: true });
}

// ---------- 본문 가공: h2 에 id 부여 + 목차 ----------
// 내부 링크를 배포 주소 규칙(/폴더/ 형식)으로 통일 — 어드민에서 index.html 로 써도 자동 정리
function cleanLinks(html) {
  return String(html || "")
    .replace(/href="\/index\.html"/g, 'href="/"')
    .replace(/href="(\/[^"#?]*?)\/index\.html((?:[#?][^"]*)?)"/g, 'href="$1/$2"');
}
function processContent(html) {
  let i = 0;
  const toc = [];
  const out = cleanLinks(html).replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (m, attrs, inner) => {
    i++;
    const id = "s" + i;
    toc.push({ id, text: textOf(inner) });
    const cleaned = attrs.replace(/\s*id="[^"]*"/i, "");
    return `<h2 id="${id}"${cleaned}>${inner}</h2>`;
  });
  return { html: out, toc };
}

// ---------- 공통 조각 ----------
function head(title, description, keywords, extra) {
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${keywords ? `<meta name="keywords" content="${esc(keywords)}">\n` : ""}${GENERATED}
<link rel="icon" href="/assets/images/logo/symbol.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/images/logo/symbol.png">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/common.css">
<link rel="stylesheet" href="/assets/css/sub.css">
${extra || ""}`;
}
function ctaBlock() {
  return `      <div class="page-cta">
        <h3>칼럼을 읽고 궁금한 점이 있다면</h3>
        <p>카카오톡 채널로 편하게 질문해 주세요. 발병 시점과 증상을 알려주시면 내원 전 안내를 드립니다.</p>
        <div class="btns">
          <a href="https://pf.kakao.com/_kxjdkxb" data-site-href="kakao" target="_blank" rel="noopener" class="btn btn-kakao">카카오톡 상담</a>
          <a href="tel:0232811075" data-site-href="tel" class="btn btn-outline"><span data-site="phone">02-3281-1075</span> 전화 상담</a>
        </div>
      </div>`;
}

// ---------- HTML 렌더 ----------
function renderCard(post) {
  const thumb = post.thumbnail || DEFAULT_THUMB;
  return `      <a href="/column/${esc(post.slug)}/" class="post-card" data-category="${esc(post.category)}">
        <div class="thumb"><img src="${esc(thumb)}" alt="${esc(post.thumbnailAlt || post.title)}" loading="lazy" width="640" height="360"></div>
        <div class="body">
          <span class="cat">${esc(post.category)}</span>
          <h3>${esc(post.title)}</h3>
          <p>${esc(post.description)}</p>
          <div class="meta"><time datetime="${esc(post.published)}">${fmtDate(post.published)}</time><span>${esc(post.author || DEFAULT_AUTHOR)}</span></div>
        </div>
      </a>`;
}

function renderPost(post, neighbors, related) {
  const { html: body, toc } = processContent(post.content);
  const thumb = post.thumbnail || DEFAULT_THUMB;
  const summary = (post.summary || []).filter(Boolean);
  const faqs = (post.faqs || []).filter((f) => f.q && f.a);
  const refs = (post.references || []).filter(Boolean).map(cleanLinks);
  const minutes = post.readingMinutes || readingMinutes(post.content);
  const prev = neighbors && neighbors.prev;
  const next = neighbors && neighbors.next;
  const customSchema = (post.schema || "").trim();
  const breadcrumbShort = post.shortTitle || (post.title.length > 24 ? post.title.slice(0, 24) + "…" : post.title);
  const vid = youtubeId(post.video);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
${head(`${post.title} | 바를정한방병원 원장칼럼`, post.description, post.keywords, customSchema ? `<script type="application/ld+json" data-custom-schema>${customSchema}</script>` : "")}
</head>
<body class="page-sub page-column">
<!-- include:header --><!-- /include:header -->

<main id="content">
  <div class="inner narrow">
    <article class="post" data-category="${esc(post.category)}" data-published="${esc(post.published)}" data-modified="${esc(post.modified || post.published)}" data-image="${esc(thumb)}"${vid ? ` data-video="${esc(post.video)}"` : ""}>

      <header class="post-head">
        <nav class="breadcrumb" aria-label="현재 위치"><a href="/">홈</a> &gt; <a href="/column/">원장칼럼</a> &gt; <span>${esc(breadcrumbShort)}</span></nav>
        <span class="cat">${esc(post.category)}</span>
        <h1>${esc(post.title)}</h1>
        <div class="post-meta">
          <span class="author"><img src="${DOCTOR_IMG}" alt="${esc(post.author || DEFAULT_AUTHOR)}" width="40" height="40">${esc(post.author || DEFAULT_AUTHOR)} · 대한안면학회 회장</span>
          <span>작성 <time datetime="${esc(post.published)}">${fmtDate(post.published)}</time></span>
          ${post.modified && post.modified !== post.published ? `<span>수정 <time datetime="${esc(post.modified)}">${fmtDate(post.modified)}</time></span>` : ""}
          <span>읽는 시간 약 ${minutes}분</span>
        </div>
      </header>

      <div class="post-hero"><img src="${esc(thumb)}" alt="${esc(post.thumbnailAlt || post.title)}" width="1200" height="675" fetchpriority="high"></div>

${summary.length ? `      <section class="summary-box" aria-label="핵심 요약">
        <h2>핵심 요약</h2>
        <ul>
${summary.map((s) => `          <li>${s}</li>`).join("\n")}
        </ul>
      </section>
` : ""}
${toc.length ? `      <nav class="toc" aria-label="목차">
        <strong>목차</strong>
        <ol>
${toc.map((t) => `          <li><a href="#${t.id}">${esc(t.text)}</a></li>`).join("\n")}
${faqs.length ? `          <li><a href="#faq">자주 묻는 질문</a></li>` : ""}
        </ol>
      </nav>
` : ""}
      <div class="post-body">
${vid ? `        <div class="video-embed"><iframe src="https://www.youtube.com/embed/${vid}" title="${esc(post.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>\n` : ""}${body}
${faqs.length ? `
        <h2 id="faq">자주 묻는 질문</h2>
        <div class="faq">
${faqs.map((f) => `          <details class="faq-item"><summary>${esc(f.q)}</summary><div class="a">${esc(f.a)}</div></details>`).join("\n")}
        </div>
` : ""}
${refs.length ? `
        <section class="references">
          <h2>참고 자료</h2>
          <ol>
${refs.map((r) => `            <li>${r}</li>`).join("\n")}
          </ol>
        </section>
` : ""}
      </div>

      <p class="review-note">이 글은 <strong>${esc(post.author || DEFAULT_AUTHOR)}(한의사)</strong>이 작성·감수했습니다. 마지막 검토일 ${fmtDate(post.modified || post.published)}.</p>

      <div class="author-box">
        <img src="${DOCTOR_IMG}" alt="정인호 대표원장" width="96" height="96">
        <div>
          <h3>글쓴이 · 정인호 대표원장 (한의사)</h3>
          <p>바를정한방병원 대표원장. 대한안면학회 회장 · 구안와사연구회 회장 · 우석대학교 한의학과 외래교수. 20년간 안면마비(구안와사·벨마비·람세이헌트증후군)와 그 후유증을 진료해 왔습니다. <a href="/about/doctors/">의료진 소개 보기</a></p>
        </div>
      </div>

${ctaBlock()}

      <div class="post-nav">
        ${prev ? `<a href="/column/${esc(prev.slug)}/"><span>이전 글</span>${esc(prev.title)}</a>` : `<a href="/column/"><span>목록</span>원장칼럼 전체 보기</a>`}
        ${next ? `<a href="/column/${esc(next.slug)}/" class="next"><span>다음 글</span>${esc(next.title)}</a>` : `<a href="/column/" class="next"><span>목록</span>원장칼럼 전체 보기</a>`}
      </div>

${related && related.length ? `      <section class="related-posts" aria-label="관련 칼럼">
        <h2 class="sec-title"><span class="bar"></span>관련 칼럼</h2>
        <div class="post-list cols-3">
${related.map(renderCard).join("\n\n")}
        </div>
      </section>
` : ""}
      <p class="disclaimer">본 칼럼은 의학 정보 제공을 목적으로 하며 개별 진단이나 치료를 대체하지 않습니다. 치료 효과와 기간은 개인의 상태에 따라 다를 수 있습니다.</p>
    </article>
  </div>
</main>

<!-- include:footer --><!-- /include:footer -->
<script src="/assets/js/common.js" defer></script>
</body>
</html>
`;
}

// 헤더·푸터 삽입 + site.json 반영 (렌더한 페이지에 바로 적용)
function finalize(html, file) {
  const p = INC.partials();
  const d = SA.derive(SA.loadSite());
  return SA.applyToHtml(INC.wrap(html, p), d, file);
}

// 목록 페이지: <!-- posts:start --> ~ <!-- posts:end -->, <!-- pager:start --> ~ <!-- pager:end -->
function pagerHtml(page, total) {
  if (total <= 1) return "";
  const href = (n) => (n === 1 ? "/column/" : `/column/page/${n}/`);
  const items = [];
  if (page > 1) items.push(`<a href="${href(page - 1)}" class="pg-prev" rel="prev">이전</a>`);
  for (let n = 1; n <= total; n++) items.push(n === page ? `<span class="pg-cur" aria-current="page">${n}</span>` : `<a href="${href(n)}">${n}</a>`);
  if (page < total) items.push(`<a href="${href(page + 1)}" class="pg-next" rel="next">다음</a>`);
  return `<nav class="pager" aria-label="페이지 이동">${items.join("\n        ")}</nav>`;
}
function rebuildIndex(posts) {
  const published = posts.filter(isLive);
  const base = fs.readFileSync(INDEX_FILE, "utf8");
  const total = Math.max(1, Math.ceil(published.length / PAGE_SIZE));
  const build = (page) => {
    const slice = published.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const cards = slice.length ? slice.map(renderCard).join("\n\n") : `      <p class="muted">아직 등록된 칼럼이 없습니다.</p>`;
    let html = base
      .replace(/<!-- posts:start -->[\s\S]*?<!-- posts:end -->/, () => `<!-- posts:start -->\n${cards}\n      <!-- posts:end -->`)
      .replace(/<!-- pager:start -->[\s\S]*?<!-- pager:end -->/, () => `<!-- pager:start -->\n      ${pagerHtml(page, total)}\n      <!-- pager:end -->`);
    if (page > 1) {
      html = html.replace(/<title>([\s\S]*?)<\/title>/, (m, t) => `<title>${t.replace(/^원장칼럼/, `원장칼럼 ${page}페이지`)}</title>`);
      html = html.replace(/<!-- seo:start[\s\S]*?<!-- seo:end -->\n?/i, ""); // seo-inject 가 페이지별로 새로 만든다
      html = html.replace(/<meta name="robots"[^>]*>\n?/i, "");
    }
    return html;
  };
  fs.writeFileSync(INDEX_FILE, build(1));
  fs.rmSync(PAGES_DIR, { recursive: true, force: true });
  for (let n = 2; n <= total; n++) {
    const dir = path.join(PAGES_DIR, String(n));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), finalize(build(n), path.join(dir, "index.html")));
  }
  return total;
}

// 메인 페이지 원장칼럼 섹션 (최신 6개)
function rebuildHome(posts) {
  if (!fs.existsSync(HOME_FILE)) return;
  const published = posts.filter(isLive).slice(0, 6);
  const html = fs.readFileSync(HOME_FILE, "utf8");
  const cards = published.length ? published.map(renderCard).join("\n\n") : `      <p class="muted">첫 칼럼을 준비 중입니다.</p>`;
  const out = html.replace(/<!-- home-posts:start -->[\s\S]*?<!-- home-posts:end -->/, () => `<!-- home-posts:start -->\n${cards}\n      <!-- home-posts:end -->`);
  if (out !== html) fs.writeFileSync(HOME_FILE, out);
}

// 진료 페이지 하단 "관련 원장칼럼 3개" — 글의 related(관련 진료 페이지) 가 그 페이지인 글을 우선, 모자라면 최신 글로 채움
function rebuildRelated(posts) {
  const published = posts.filter(isLive);
  let changed = 0;
  for (const pagePath of Object.keys(RELATED_PAGES)) {
    const file = path.join(ROOT, pagePath.replace(/^\//, "").replace(/\/$/, ""), "index.html");
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, "utf8");
    if (!/<!-- related-columns:start -->/.test(html)) continue;
    const mine = published.filter((p) => p.related === pagePath);
    const fill = published.filter((p) => !mine.includes(p));
    const pick = mine.concat(fill).slice(0, 3);
    const cards = pick.length ? pick.map(renderCard).join("\n\n") : `      <p class="muted">첫 칼럼을 준비 중입니다. <a href="/column/">원장칼럼 보기</a></p>`;
    const out = html.replace(/<!-- related-columns:start -->[\s\S]*?<!-- related-columns:end -->/, () => `<!-- related-columns:start -->\n${cards}\n      <!-- related-columns:end -->`);
    if (out !== html) { fs.writeFileSync(file, out); changed++; }
  }
  return changed;
}

// 공개 글 전체 HTML 재생성 (이전/다음·관련 글 때문에 하나가 바뀌면 이웃도 갱신)
function rebuildAll() {
  const posts = listPosts();
  const published = posts.filter(isLive);
  const liveSlugs = new Set(published.map((p) => p.slug));
  published.forEach((p, i) => {
    const neighbors = { prev: published[i + 1], next: published[i - 1] }; // 목록은 최신순
    const same = published.filter((q) => q.slug !== p.slug && q.category === p.category);
    const others = published.filter((q) => q.slug !== p.slug && q.category !== p.category);
    const related = same.concat(others).slice(0, 3);
    const dir = postDir(p.slug);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "index.html");
    fs.writeFileSync(file, finalize(renderPost(p, neighbors, related), file));
  });
  // 임시저장·예약·삭제된 글의 폴더는 지움 (우리가 만든 폴더만)
  for (const e of fs.readdirSync(COLUMNS_DIR, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith("_") || e.name === "page" || liveSlugs.has(e.name)) continue;
    removeGeneratedDir(path.join(COLUMNS_DIR, e.name));
  }
  rebuildIndex(posts);
  rebuildHome(posts);
  rebuildRelated(posts);
  return published.length;
}

// 예전 사이트처럼 손으로 만든 칼럼 HTML 을 가져오는 기능은 이 사이트에 없습니다 (처음부터 어드민 JSON 으로 운영).
function importExisting() {
  return 0;
}

module.exports = { todayKST, isLive, isScheduled, nextScheduled, CATEGORIES, RELATED_PAGES, DEFAULT_AUTHOR, DEFAULT_THUMB, listPosts, readPost, writePost, deletePost, renderPost, renderCard, rebuildAll, rebuildIndex, rebuildHome, rebuildRelated, importExisting, readingMinutes, youtubeId, COLUMNS_DIR, DATA_DIR, ROOT };
