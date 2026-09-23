/**
 * 바를정한방병원 안면마비·재활센터 홈페이지 로컬 서버 + 원장칼럼 어드민
 * ------------------------------------------------------------
 * 실행:  사이트 폴더에서  node tools/admin-server.js
 *   → 홈페이지  http://localhost:8080/
 *   → 어드민    http://localhost:8080/admin/
 *
 * - 비밀번호는 tools/admin-config.json 의 "password" (처음 실행 시 자동 생성)
 * - 칼럼 저장 시: column/_data/<slug>.json 저장 → 칼럼 페이지 생성 → 목록·메인·관련칼럼 갱신 → 설정 반영 → SEO 주입 → sitemap 갱신
 * - 외부 의존성 없음 (Node 내장 모듈만 사용)
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const INC = require("./include");
const R = require("./column-render");
const FAQ = require("./faq-render");
const SA = require("./site-apply");

const ROOT = R.ROOT;
const PORT = Number(process.env.PORT) || 8080;
const CONFIG_FILE = path.join(__dirname, "admin-config.json");
const UPLOAD_DIR = path.join(ROOT, "assets", "images", "column");

// ---------- 설정 / 비밀번호 ----------
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ password: "bareul1075" }, null, 2));
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
}
const tokens = new Set();
function authed(req) {
  const t = req.headers["x-admin-token"];
  return t && tokens.has(t);
}

// ---------- 유틸 ----------
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp", ".ico": "image/x-icon", ".md": "text/plain; charset=utf-8", ".woff2": "font/woff2", ".woff": "font/woff"
};
function send(res, code, body, type) {
  res.writeHead(code, { "Content-Type": type || "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => { size += c.length; if (size > 40 * 1024 * 1024) { reject(new Error("too large")); req.destroy(); } chunks.push(c); });
    req.on("end", () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}
function runSeo() {
  try { execFileSync(process.execPath, [path.join(__dirname, "seo-inject.js")], { cwd: ROOT, stdio: "ignore" }); return true; }
  catch (e) { console.error("seo-inject 실패:", e.message); return false; }
}
// 저장 후 전체 갱신: 헤더/푸터 → 설정 → 칼럼 → SEO
function regenerate() {
  INC.includeAll();
  try { FAQ.renderAll(); } catch (e) { console.error("faq-render 실패:", e.message); }
  SA.applyAll();
  const count = R.rebuildAll();
  const seo = runSeo();
  return { count, seo };
}
function safeSlug(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
function saveUpload(name, dataUrl, prefix) {
  const m = /^data:(image\/(png|jpeg|jpg|gif|webp));base64,(.+)$/.exec(dataUrl || "");
  if (!m) throw new Error("이미지 형식(png/jpg/gif/webp)만 업로드할 수 있습니다");
  const ext = m[2] === "jpeg" ? "jpg" : m[2];
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const base = safeSlug(path.basename(name || "image", path.extname(name || ""))) || "image";
  const file = `${prefix ? prefix + "-" : ""}${base}-${Date.now().toString(36)}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, file), Buffer.from(m[3], "base64"));
  return "/assets/images/column/" + file;
}

// ---------- API ----------
async function api(req, res, url) {
  const p = url.pathname;
  const method = req.method;

  if (p === "/api/login" && method === "POST") {
    const body = await readBody(req);
    if (body.password && body.password === loadConfig().password) {
      const t = crypto.randomBytes(24).toString("hex");
      tokens.add(t);
      return send(res, 200, { token: t });
    }
    return send(res, 401, { error: "비밀번호가 맞지 않습니다" });
  }
  if (!authed(req)) return send(res, 401, { error: "로그인이 필요합니다" });

  // 홈페이지 설정 (site.json) 읽기 / 저장 → 페이지 반영 → SEO 갱신
  if (p === "/api/site" && method === "GET") {
    return send(res, 200, SA.loadSite());
  }
  if (p === "/api/site" && method === "POST") {
    const b = await readBody(req);
    if (!b || !b.clinic || !b.hours) return send(res, 400, { error: "설정 형식이 올바르지 않습니다" });
    fs.writeFileSync(SA.SITE_FILE, JSON.stringify(b, null, 2) + "\n");
    const r = SA.applyAll();
    const g = regenerate();
    return send(res, 200, { ok: true, changed: r.changed, seo: g.seo });
  }
  if (p === "/api/meta" && method === "GET") {
    return send(res, 200, { categories: R.CATEGORIES, relatedPages: R.RELATED_PAGES, author: R.DEFAULT_AUTHOR, siteUrl: "http://localhost:" + PORT });
  }
  if (p === "/api/columns" && method === "GET") {
    const list = R.listPosts().map(({ content, ...rest }) => ({ ...rest, chars: content ? content.replace(/<[^>]+>/g, "").replace(/\s/g, "").length : 0 }));
    return send(res, 200, list);
  }
  const one = p.match(/^\/api\/columns\/([a-z0-9-]+)$/);
  if (one && method === "GET") {
    const post = R.readPost(one[1]);
    return post ? send(res, 200, post) : send(res, 404, { error: "없는 글입니다" });
  }
  if (p === "/api/columns" && method === "POST") {
    const b = await readBody(req);
    const errors = [];
    if (!b.title || !b.title.trim()) errors.push("제목을 입력하세요");
    if (!b.category) errors.push("카테고리를 선택하세요");
    if (!b.description || !b.description.trim()) errors.push("description(검색 설명)을 입력하세요");
    if (!b.content || !b.content.replace(/<[^>]+>/g, "").trim()) errors.push("내용을 입력하세요");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.published || "")) errors.push("발행일 형식은 YYYY-MM-DD 입니다");
    if (b.schema && b.schema.trim()) { try { JSON.parse(b.schema); } catch (e) { errors.push("schema 는 올바른 JSON 이어야 합니다: " + e.message); } }
    if (errors.length) return send(res, 400, { error: errors.join("\n") });

    let slug = safeSlug(b.slug) || `${b.published}-column-${Date.now().toString(36).slice(-4)}`;
    const existing = b.originalSlug ? R.readPost(b.originalSlug) : null;
    // 새 주소(slug)가 이미 있는 다른 글과 겹치면 멈춤 (다른 글을 덮어쓰지 않도록)
    if ((!existing || existing.slug !== slug) && R.readPost(slug)) return send(res, 400, { error: `같은 주소의 글이 이미 있습니다: ${slug}\n발행 설정에서 글 주소(슬러그)를 바꿔 주세요.` });
    if (existing && existing.slug !== slug) R.deletePost(existing.slug); // 슬러그 변경 시 옛 파일 제거

    let thumbnail = b.thumbnail || (existing && existing.thumbnail) || "";
    if (b.thumbnailData) thumbnail = saveUpload(b.thumbnailName, b.thumbnailData, slug);

    const post = {
      slug,
      title: b.title.trim(),
      shortTitle: (b.shortTitle || "").trim(),
      author: (b.author || R.DEFAULT_AUTHOR).trim(),
      category: b.category,
      related: (b.related || "").trim(),
      description: b.description.trim(),
      keywords: (b.keywords || "").trim(),
      schema: (b.schema || "").trim(),
      video: (b.video || "").trim(),
      content: b.content,
      thumbnail,
      thumbnailAlt: (b.thumbnailAlt || "").trim(),
      published: b.published,
      modified: b.modified && /^\d{4}-\d{2}-\d{2}$/.test(b.modified) ? b.modified : new Date().toISOString().slice(0, 10),
      summary: (b.summary || []).map((s) => String(s).trim()).filter(Boolean),
      faqs: (b.faqs || []).map((f) => ({ q: String(f.q || "").trim(), a: String(f.a || "").trim() })).filter((f) => f.q && f.a),
      references: (b.references || []).map((s) => String(s).trim()).filter(Boolean),
      status: b.status === "draft" ? "draft" : "published",
      readingMinutes: R.readingMinutes(b.content),
      createdAt: (existing && existing.createdAt) || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    R.writePost(post);
    const g = regenerate();
    return send(res, 200, { ok: true, slug, url: R.isLive(post) ? `/column/${slug}/` : null, published: g.count, seo: g.seo });
  }
  if (one && method === "DELETE") {
    const post = R.readPost(one[1]);
    if (!post) return send(res, 404, { error: "없는 글입니다" });
    R.deletePost(one[1]);
    if (post.thumbnail && post.thumbnail.startsWith("/assets/images/column/")) { const f = path.join(ROOT, post.thumbnail); if (fs.existsSync(f)) fs.unlinkSync(f); }
    regenerate();
    return send(res, 200, { ok: true });
  }
  if (p === "/api/upload" && method === "POST") {
    const b = await readBody(req);
    const url = saveUpload(b.name, b.data, "img");
    return send(res, 200, { path: url });
  }
  if (p === "/api/rebuild" && method === "POST") {
    const g = regenerate();
    return send(res, 200, { ok: true, imported: 0, published: g.count, seo: g.seo });
  }
  return send(res, 404, { error: "not found" });
}

// ---------- 정적 파일 ----------
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p.includes("..")) return send(res, 400, "bad path", "text/plain");
  if (p.endsWith("/")) p += "index.html";
  if (p.startsWith("/tools/") || p.startsWith("/column/_data/") || p.startsWith("/facial-palsy/faq/_data/") || p.startsWith("/components/")) return send(res, 403, "forbidden", "text/plain");
  const file = path.join(ROOT, p);
  const stream = (f) => {
    res.writeHead(200, { "Content-Type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(f).pipe(res);
  };
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      if (!err && st.isDirectory()) { res.writeHead(302, { Location: p + "/" }); return res.end(); }
      // 확장자 없는 주소는 .html 파일로 (Cloudflare Pages 와 같은 동작)
      if (!path.extname(file) && fs.existsSync(file + ".html")) return stream(file + ".html");
      const nf = path.join(ROOT, "404.html");
      if (fs.existsSync(nf)) { res.writeHead(404, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }); return fs.createReadStream(nf).pipe(res); }
      return send(res, 404, "<h1>404</h1><p>" + p + "</p>", "text/html; charset=utf-8");
    }
    stream(file);
  });
}

// ---------- 시작 ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname.startsWith("/api/")) return await api(req, res, url);
    return serveStatic(req, res, url);
  } catch (e) {
    console.error(e);
    return send(res, 500, { error: e.message });
  }
});

server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.error(`\n포트 ${PORT} 이 이미 사용 중입니다. 다른 서버(Live Server 등)를 끄거나  PORT=8081 node tools/admin-server.js  로 실행하세요.\n`);
    process.exit(1);
  }
  throw e;
});

server.listen(PORT, () => {
  const cfg = loadConfig();
  console.log(`\n바를정한방병원 안면마비·재활센터 홈페이지 서버 실행 중`);
  console.log(`  홈페이지  http://localhost:${PORT}/`);
  console.log(`  어드민    http://localhost:${PORT}/admin/   (비밀번호: ${cfg.password})`);
  console.log(`  종료: Ctrl + C\n`);
});
