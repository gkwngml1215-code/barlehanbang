/**
 * 홈페이지 기본 정보 반영 — site.json 의 값을 HTML 곳곳에 써 넣습니다.
 * ------------------------------------------------------------
 * 어드민 "홈페이지 설정" 에서 저장한 site.json(진료시간·전화·주소·채널 링크·SEO 문구·공지 띠)을
 * 페이지 안의 표시 자리(data-site="키", data-site-href="키", <!-- site:notice -->)에 채웁니다.
 *
 * 실행:  사이트 폴더에서  node tools/site-apply.js      (build.js 와 로컬 어드민 저장 시 자동 실행)
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE_FILE = path.join(ROOT, "site.json");

function loadSite() {
  return JSON.parse(fs.readFileSync(SITE_FILE, "utf8"));
}
function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
const h24 = (t) => String(t || "").trim();

// site.json → 화면에 쓰는 문자열들
function derive(site) {
  const c = site.clinic || {}, h = site.hours || {}, ch = site.channels || {}, seo = site.seo || {}, n = site.notice || {};
  const address = [c.region, c.city, c.street].filter(Boolean).join(" ");
  const phoneHref = "tel:" + String(c.phone || "").replace(/[^\d+]/g, "");
  const v = {
    name: esc(c.name),
    centerName: esc(c.centerName),
    fullName: `${esc(c.name)} ${esc(c.centerName)}`.trim(),
    doctor: esc(c.doctor),
    phone: esc(c.phone),
    email: esc(c.email),
    bizNo: esc(c.bizNo),
    beds: esc(c.beds),
    staffCount: esc(c.staffCount),
    address: esc(address),
    addressShort: esc(c.addressShort || address),
    landmark: esc(c.landmark),
    parking: esc(c.parking),
    nameDoctor: `${esc(c.name)} &nbsp;|&nbsp; 대표원장 ${esc(c.doctor)}`,
    addressLandmark: `${esc(address)}${c.landmark ? ` (${esc(c.landmark)})` : ""}`,
    bizLine: `사업자등록번호 ${esc(c.bizNo)}${c.email ? ` &nbsp;|&nbsp; 이메일 ${esc(c.email)}` : ""}`,
    landmarkParking: [esc(c.landmark), esc(c.parking)].filter(Boolean).join(" · "),
    hoursSummary: `평일 ${h24(h.weekdayOpen)} ~ ${h24(h.weekdayClose)}`,
    hoursSummarySub: `주말·공휴일 ${h24(h.weekendOpen)} ~ ${h24(h.weekendClose)}${h.weekendNote ? ` (${esc(h.weekendNote)})` : ""} · 점심 ${h24(h.lunchStart)} ~ ${h24(h.lunchEnd)}`,
    hoursTable:
      `\n          <tr><th>평일 (월~금)</th><td>${h24(h.weekdayOpen)} ~ ${h24(h.weekdayClose)}</td></tr>` +
      `\n          <tr><th>점심시간 (평일)</th><td>${h24(h.lunchStart)} ~ ${h24(h.lunchEnd)}</td></tr>` +
      `\n          <tr><th>토 · 일 · 공휴일</th><td>${h24(h.weekendOpen)} ~ ${h24(h.weekendClose)}${h.weekendNote ? ` <span class="muted small">(${esc(h.weekendNote)})</span>` : ""}</td></tr>` +
      (h.closedText ? `\n          <tr><th>휴진</th><td>${esc(h.closedText)}</td></tr>` : "") +
      `\n        `,
    hoursFooter:
      `\n        <p>평일 &nbsp;${h24(h.weekdayOpen)} ~ ${h24(h.weekdayClose)} (점심 ${h24(h.lunchStart)} ~ ${h24(h.lunchEnd)})</p>` +
      `\n        <p>토·일·공휴일 &nbsp;${h24(h.weekendOpen)} ~ ${h24(h.weekendClose)}${h.weekendNote ? ` (${esc(h.weekendNote)})` : ""}</p>` +
      (h.closedText ? `\n        <p>${esc(h.closedText)}</p>` : "") +
      `\n      `,
    hoursNote: String(h.note || ""),
    notice: n.enabled && n.text
      ? `\n  <div class="notice-bar">${n.link ? `<a href="${esc(n.link)}">` : "<span>"}${esc(n.text)}${n.link ? "</a>" : "</span>"}</div>`
      : ""
  };
  const hrefs = {
    tel: phoneHref,
    kakao: ch.kakao || "",
    youtube: ch.youtube || "",
    mainSite: ch.mainSite || "",
    naverMap: ch.naverMap || "",
    blog: ch.blog || "",
    instagram: ch.instagram || ""
  };
  return { v, hrefs, seo, address, phoneHref };
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return ["node_modules", "tools", "admin", "dist", ".git", "_data", "_preview", "assets"].includes(e.name) ? [] : walk(p);
    return e.name.endsWith(".html") && !e.name.startsWith("_") && !/구현가이드/.test(e.name) ? [p] : [];
  });
}

function applyToHtml(html, d, file) {
  let out = html;
  // 1) <tag data-site="key">…</tag> 안쪽 내용 교체
  out = out.replace(/<([a-zA-Z0-9]+)(\s[^>]*\bdata-site="([a-zA-Z0-9_]+)"[^>]*)>([\s\S]*?)<\/\1>/g, (m, tag, attrs, key, inner) => {
    if (!(key in d.v)) return m;
    return `<${tag}${attrs}>${d.v[key]}</${tag}>`;
  });
  // 2) data-site-href="key" 가 있는 태그의 href 교체
  out = out.replace(/<a\b([^>]*\bdata-site-href="([a-zA-Z0-9_]+)"[^>]*)>/g, (m, attrs, key) => {
    if (!(key in d.hrefs) || !d.hrefs[key]) return m;
    const na = attrs.replace(/\bhref="[^"]*"/, `href="${esc(d.hrefs[key])}"`);
    return `<a${/\bhref=/.test(attrs) ? na : ` href="${esc(d.hrefs[key])}"` + attrs}>`;
  });
  // 3) 공지 띠 (헤더)
  out = out.replace(/<!-- site:notice -->[\s\S]*?<!-- \/site:notice -->/, `<!-- site:notice -->${d.v.notice}<!-- /site:notice -->`);
  // 4) 메인 페이지 제목·설명
  if (file && path.basename(file) === "index.html" && path.dirname(file) === ROOT) {
    if (d.seo.homeTitle) out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(d.seo.homeTitle)}</title>`);
    if (d.seo.homeDescription) out = out.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(d.seo.homeDescription)}">`);
  }
  return out;
}

function applyAll() {
  const site = loadSite();
  const d = derive(site);
  let changed = 0;
  for (const f of walk(ROOT)) {
    const html = fs.readFileSync(f, "utf8");
    const out = applyToHtml(html, d, f);
    if (out !== html) { fs.writeFileSync(f, out); changed++; }
  }
  return { changed, site };
}

module.exports = { loadSite, derive, applyToHtml, applyAll, SITE_FILE, ROOT };

if (require.main === module) {
  const r = applyAll();
  console.log(`site.json 반영: 바뀐 파일 ${r.changed}개`);
}
