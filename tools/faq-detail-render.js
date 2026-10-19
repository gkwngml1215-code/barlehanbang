/**
 * 구안와사 FAQ 개별 질문 페이지 생성기
 * ------------------------------------------------------------
 *  원본  : facial-palsy/faq/_data/details/<slug>.html
 *          맨 위 <!--meta { … } --> 주석(JSON) + 그 아래 본문 HTML 조각
 *  결과  : facial-palsy/faq/<slug>/index.html   (주소: /facial-palsy/faq/<slug>/)
 *
 *  meta 항목
 *    title        H1 · 질문형 제목 (필수)
 *    titleTag     <title> (생략하면 "제목 | 바를정한방병원 안면마비센터")
 *    description  meta description 80~120자 (필수)
 *    keywords     네이버용 키워드
 *    category     분류 표시 (예: 생활 관리 / 치료 결정 / 회복·불안 / 후유증)
 *    eyebrow      서브 비주얼 영문 소제목 (예: FAQ · Care)
 *    crumb        빵부스러기 마지막 항목 (짧게)
 *    sources      허브 FAQ 의 원 질문 번호 배열 (예: [79, 80]) — 문서용
 *    updated      최종 수정일 YYYY-MM-DD
 *    related      "같이 많이 묻는 질문" [{ href, title, sub }]
 *    columns      하단 "관련 원장칼럼" 에 우선 노출할 칼럼 slug 배열 (tools/column-render.js 가 채움)
 *    cta          { h3, p } 하단 상담 배너 문구
 *
 *  본문 작성 규칙: 첫 요소는 <div class="key-answer"> (핵심 답변 2~3문장), 이후 <h2> 2~4개.
 *  원장 확인이 필요한 새 문장 앞에는 <!-- [원장 확인 필요] --> 주석을 둡니다 (화면에는 보이지 않음).
 *
 *  실행: node tools/build.js (faq-render.js 가 호출) 또는 node tools/faq-detail-render.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const INC = require("./include");
const SA = require("./site-apply");

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "facial-palsy", "faq", "_data", "details");
const OUT_DIR = path.join(ROOT, "facial-palsy", "faq");
const HUB = "/facial-palsy/faq/";
const SITE_SUFFIX = " | 바를정한방병원 안면마비센터";

const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function fmtDate(iso) {
  const [y, m, d] = String(iso || "").split("-").map(Number);
  return y ? `${y}년 ${m}월 ${d}일` : "";
}

function parse(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^\s*<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`${path.basename(file)}: <!--meta { … } --> 블록이 없습니다`);
  let meta;
  try { meta = JSON.parse(m[1]); } catch (e) { throw new Error(`${path.basename(file)}: meta JSON 오류 — ${e.message}`); }
  meta.slug = meta.slug || path.basename(file, ".html");
  const body = raw.slice(m[0].length).trim();
  for (const k of ["title", "description"]) if (!meta[k]) throw new Error(`${meta.slug}: meta.${k} 가 비어 있습니다`);
  return { meta, body };
}

function relatedHtml(list) {
  if (!list || !list.length) return "";
  return `      <div class="faq-related">
        <h2>같이 많이 묻는 질문</h2>
        <ul>
${list.map((r) => `          <li><a href="${esc(r.href)}">${esc(r.title)}${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</a></li>`).join("\n")}
        </ul>
      </div>
`;
}

function render({ meta, body }) {
  const url = `${HUB}${meta.slug}/`;
  const titleTag = meta.titleTag || meta.title + SITE_SUFFIX;
  const updated = meta.updated || new Date().toISOString().slice(0, 10);
  const cta = meta.cta || {};
  const columns = (meta.columns || []).join(",");
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titleTag)}</title>
<meta name="description" content="${esc(meta.description)}">
${meta.keywords ? `<meta name="keywords" content="${esc(meta.keywords)}">\n` : ""}<meta name="page-image" content="/assets/images/programs/facial-palsy.jpg">
<meta name="faq-detail" content="${esc(url)}">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/assets/images/logo/favicon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="/assets/images/logo/symbol.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/images/logo/apple-touch-icon.png" sizes="180x180">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#1D3752">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/common.css">
<link rel="stylesheet" href="/assets/css/sub.css">
</head>
<body class="page-sub">
<!-- include:header --><!-- /include:header -->

<main data-page-type="condition" class="faq-detail">
  <section class="sub-visual">
    <img src="/assets/images/sub/facial-palsy.jpg" alt="" width="1920" height="700" fetchpriority="high">
    <div class="circle" aria-hidden="true"></div>
    <div class="inner">
      <span class="en">${esc(meta.eyebrow || "FAQ")}</span>
      <h1>${esc(meta.title)}</h1>
      <nav class="breadcrumb" aria-label="현재 위치"><a href="/">홈</a> &gt; <a href="/facial-palsy/">안면마비</a> &gt; <a href="${HUB}">자주 묻는 질문</a> &gt; <span>${esc(meta.crumb || meta.title)}</span></nav>
    </div>
  </section>

  <nav class="sub-tabs" aria-label="안면마비 하위 메뉴">
    <div class="inner"><ul>
      <li><a href="/facial-palsy/">안면마비 안내</a></li>
      <li><a href="/facial-palsy/bells-palsy/">구안와사·벨마비</a></li>
      <li class="active"><a href="${HUB}">구안와사 FAQ</a></li>
      <li><a href="/facial-palsy/ramsay-hunt/">람세이헌트증후군</a></li>
      <li><a href="/facial-palsy/sequelae/">안면마비 후유증</a></li>
      <li><a href="/facial-palsy/treatment/">바를정 핵심치료</a></li>
      <li><a href="/facial-palsy/trigeminal/">삼차신경통</a></li>
      <li><a href="/facial-palsy/asymmetry/">안면비대칭</a></li>
    </ul></div>
  </nav>

  <section class="content-section">
    <div class="inner narrow">
      <p class="faq-meta">${meta.category ? `<span>분류 · ${esc(meta.category)}</span>` : ""}<span>답변 <a href="/about/doctors/">정인호 대표원장</a> (한의사)</span><span>최종 수정 <time datetime="${esc(updated)}">${fmtDate(updated)}</time></span></p>

      <div class="faq-detail-body">
${body}
      </div>

      <div class="author-box">
        <img src="/assets/images/doctors/jung-inho.jpg" alt="정인호 대표원장" width="96" height="96" loading="lazy">
        <div>
          <h3>답변 · 정인호 대표원장 (한의사)</h3>
          <p>바를정한방병원 대표원장 · 대한안면학회 회장 · 구안와사연구회 회장. 이 답변은 정인호 대표원장이 작성·감수했으며, 마지막 검토일은 ${fmtDate(updated)}입니다. <a href="/about/doctors/">의료진 소개 보기</a></p>
        </div>
      </div>

${relatedHtml(meta.related)}
      <div class="btns">
        <a href="${HUB}" class="btn btn-outline">자주 묻는 질문 110가지 전체 보기</a>
        <a href="/admission/guide/" class="btn btn-navy">입원 안내 보기</a>
      </div>

      <p class="faq-note">이 답변은 구안와사(말초성 안면신경마비)에 대한 일반적인 의학 정보이며 진단이나 치료를 대신하지 않습니다. 치료 효과와 회복 기간은 개인의 상태에 따라 다릅니다.</p>
    </div>
  </section>

  <div class="inner">
    <div class="page-cta">
      <h3>${esc(cta.h3 || "여기 없는 궁금증은 카카오톡으로 물어보세요")}</h3>
      <p>${esc(cta.p || "발병일과 증상을 남겨 주시면 당일 진료 가능 여부와 함께 답해 드립니다.")}</p>
      <div class="btns">
        <a href="https://pf.kakao.com/_kxjdkxb" data-site-href="kakao" target="_blank" rel="noopener" class="btn btn-kakao">카카오톡 상담</a>
        <a href="tel:0232811075" data-site-href="tel" class="btn btn-outline"><span data-site="phone">02-3281-1075</span> 전화 상담</a>
      </div>
    </div>
  </div>

  <section class="related-posts">
    <div class="inner">
      <h2 class="sec-title"><span class="bar"></span>관련 원장칼럼</h2>
      <div class="post-list cols-3" data-prefer-columns="${esc(columns)}">
      <!-- related-columns:start -->
      <p class="muted">칼럼을 불러오는 중입니다. <a href="/column/">원장칼럼 보기</a></p>
      <!-- related-columns:end -->
      </div>
    </div>
  </section>
</main>

<!-- include:footer --><!-- /include:footer -->
<script src="/assets/js/common.js" defer></script>
</body>
</html>
`;
}

function listSources() {
  if (!fs.existsSync(SRC_DIR)) return [];
  return fs.readdirSync(SRC_DIR).filter((f) => f.endsWith(".html") && !f.startsWith("_")).sort().map((f) => path.join(SRC_DIR, f));
}

/** 모든 개별 질문 페이지 생성. 이미 있는 페이지의 "관련 원장칼럼" 블록은 보존합니다. 바뀐 파일 수를 돌려줍니다. */
function renderAll() {
  const p = INC.partials();
  const d = SA.derive(SA.loadSite());
  let changed = 0;
  for (const src of listSources()) {
    const page = parse(src);
    const outFile = path.join(OUT_DIR, page.meta.slug, "index.html");
    let html = SA.applyToHtml(INC.wrap(render(page), p), d, outFile);
    const before = fs.existsSync(outFile) ? fs.readFileSync(outFile, "utf8") : "";
    const keep = before.match(/<!-- related-columns:start -->[\s\S]*?<!-- related-columns:end -->/);
    if (keep) html = html.replace(/<!-- related-columns:start -->[\s\S]*?<!-- related-columns:end -->/, () => keep[0]);
    const seo = before.match(/<!-- seo:start[\s\S]*?<!-- seo:end -->\n?/);
    if (seo) html = html.replace(/<\/head>/, seo[0] + "</head>");
    if (html !== before) {
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, html, "utf8");
      changed++;
    }
  }
  return changed;
}

function list() {
  return listSources().map((src) => { const { meta } = parse(src); return { slug: meta.slug, title: meta.title, url: `${HUB}${meta.slug}/`, sources: meta.sources || [] }; });
}

module.exports = { renderAll, render, parse, list, SRC_DIR, OUT_DIR };

if (require.main === module) {
  console.log(`FAQ 개별 질문 페이지 생성: 바뀐 파일 ${renderAll()}개`);
}
