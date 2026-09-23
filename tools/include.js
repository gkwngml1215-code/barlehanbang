/**
 * 공통 헤더 · 푸터 정적 삽입
 * ------------------------------------------------------------
 * components/header.html · footer.html 을 모든 페이지의
 *   <!-- include:header --> … <!-- /include:header -->
 *   <!-- include:footer --> … <!-- /include:footer -->
 * 사이에 직접 써 넣습니다. (JS fetch 로 넣지 않는 이유: 크롤러·AI 봇이 메뉴 링크를 못 읽는 경우가 있음)
 *
 * 실행:  사이트 폴더에서  node tools/include.js     (build.js 와 로컬 어드민이 자동 실행)
 * 메뉴를 고칠 때는 components/ 의 파일 하나만 고친 뒤 이 스크립트를 다시 실행하면 전 페이지에 반영됩니다.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const COMP = path.join(ROOT, "components");

function partials() {
  const read = (n) => fs.readFileSync(path.join(COMP, n), "utf8").trim();
  return { header: read("header.html"), footer: read("footer.html") };
}
function wrap(html, p) {
  p = p || partials();
  return html
    .replace(/<!-- include:header -->[\s\S]*?<!-- \/include:header -->/, () => `<!-- include:header -->\n${p.header}\n<!-- /include:header -->`)
    .replace(/<!-- include:footer -->[\s\S]*?<!-- \/include:footer -->/, () => `<!-- include:footer -->\n${p.footer}\n<!-- /include:footer -->`);
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return ["node_modules", "tools", "admin", "dist", ".git", "_data", "_preview", "assets", "components"].includes(e.name) ? [] : walk(p);
    return e.name.endsWith(".html") && !e.name.startsWith("_") && !/구현가이드/.test(e.name) ? [p] : [];
  });
}
function includeAll() {
  const p = partials();
  let changed = 0;
  for (const f of walk(ROOT)) {
    const html = fs.readFileSync(f, "utf8");
    const out = wrap(html, p);
    if (out !== html) { fs.writeFileSync(f, out); changed++; }
  }
  return changed;
}

module.exports = { partials, wrap, includeAll, ROOT };

if (require.main === module) {
  console.log(`헤더·푸터 삽입: 바뀐 파일 ${includeAll()}개`);
}
