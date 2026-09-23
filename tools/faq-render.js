/**
 * FAQ 페이지 생성기 — facial-palsy/faq/_data/*.json → 해당 페이지의 마커 사이에 HTML 삽입
 *
 *  데이터 : facial-palsy/faq/_data/gwanwasa.json
 *           { title, updated, categories:[{id,name}], items:[{id, cat, q, a:[문단 | {list:[...]}]}] }
 *  대상   : facial-palsy/faq/index.html
 *           <!-- faq-cats:start --> … <!-- faq-cats:end -->   분류 버튼 (개수 포함)
 *           <!-- faq:start -->      … <!-- faq:end -->        분류별 질문 목록 (details.faq-item → seo-inject 가 FAQPage 로 추출)
 *           data-faq-count="…" 속성                          전체 개수
 *
 *  질문·답변을 고치려면 JSON 만 수정하고 `node tools/build.js` (또는 어드민 저장) 를 실행하면 됩니다.
 *  index.html 의 마커 안쪽은 자동 생성이므로 직접 수정하지 마세요.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PAGES = [
  { data: "facial-palsy/faq/_data/gwanwasa.json", page: "facial-palsy/faq/index.html" }
];

const esc = (s) => String(s).replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, "&amp;").replace(/<(?!\/?(a|strong|em|br)\b)/g, "&lt;");

function renderAnswer(a) {
  return a
    .map((p) => {
      if (typeof p === "string") return `<p>${esc(p)}</p>`;
      if (p && p.list) return `<ul>${p.list.map((li) => `<li>${esc(li)}</li>`).join("")}</ul>`;
      return "";
    })
    .join("");
}

function renderItem(it) {
  return (
    `<details class="faq-item" id="q${it.id}" data-cat="${it.cat}">` +
    `<summary><span class="q-no">Q${it.id}</span><span class="q-text">${esc(it.q)}</span></summary>` +
    `<div class="a">${renderAnswer(it.a)}` +
    `<p class="faq-tools"><a href="#q${it.id}" class="faq-link" data-copy="q${it.id}">이 질문 링크 복사</a></p>` +
    `</div></details>`
  );
}

function render(data) {
  const byCat = new Map(data.categories.map((c) => [c.id, []]));
  for (const it of data.items) (byCat.get(it.cat) || byCat.set(it.cat, []).get(it.cat)).push(it);

  const cats =
    `<button type="button" class="active" data-cat="">전체 <span class="cnt">${data.items.length}</span></button>` +
    data.categories.map((c) => `<button type="button" data-cat="${c.id}">${esc(c.name)} <span class="cnt">${(byCat.get(c.id) || []).length}</span></button>`).join("");

  const groups = data.categories
    .map((c) => {
      const items = byCat.get(c.id) || [];
      if (!items.length) return "";
      return (
        `<section class="faq-group" data-cat="${c.id}" aria-labelledby="faq-cat-${c.id}">` +
        `<h2 class="faq-group-title" id="faq-cat-${c.id}"><span class="bar"></span>${esc(c.name)} <span class="cnt">${items.length}</span></h2>` +
        `<div class="faq">${items.map(renderItem).join("\n")}</div>` +
        `</section>`
      );
    })
    .join("\n");

  return { cats, groups, count: data.items.length, updated: data.updated || "" };
}

function renderAll() {
  let changed = 0;
  for (const P of PAGES) {
    const dataFile = path.join(ROOT, P.data);
    const pageFile = path.join(ROOT, P.page);
    if (!fs.existsSync(dataFile) || !fs.existsSync(pageFile)) continue;
    const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    const r = render(data);
    const before = fs.readFileSync(pageFile, "utf8");
    let html = before
      .replace(/<!-- faq-cats:start -->[\s\S]*?<!-- faq-cats:end -->/, () => `<!-- faq-cats:start -->\n${r.cats}\n<!-- faq-cats:end -->`)
      .replace(/<!-- faq:start -->[\s\S]*?<!-- faq:end -->/, () => `<!-- faq:start -->\n${r.groups}\n<!-- faq:end -->`)
      .replace(/data-faq-count="[^"]*"/g, `data-faq-count="${r.count}"`)
      .replace(/(<span data-faq-count="[^"]*">)[^<]*(<\/span>)/g, `$1${r.count}$2`)
      .replace(/(<time class="faq-updated"[^>]*datetime=")[^"]*("[^>]*>)[^<]*(<\/time>)/, `$1${r.updated}$2${r.updated}$3`);
    if (html !== before) { fs.writeFileSync(pageFile, html, "utf8"); changed++; }
  }
  return changed;
}

module.exports = { renderAll, render };

if (require.main === module) {
  const n = renderAll();
  console.log(`FAQ 페이지 생성: 바뀐 파일 ${n}개`);
}
