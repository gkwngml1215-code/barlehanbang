/**
 * 공통 동작: 헤더 스크롤 상태, 전체메뉴, TOP, 현재 메뉴 표시, 탭, 칼럼 필터, 등장 애니메이션
 * (헤더·푸터는 JS 로 불러오지 않고 각 HTML 에 정적으로 들어 있습니다 — tools/include.js)
 */
(function () {
  var body = document.body;
  var header = document.getElementById("header");
  var isSub = body.classList.contains("page-sub");

  // 헤더: 메인은 투명 → 80px 스크롤 후 배경, 서브는 항상 배경
  function onScroll() {
    if (!header) return;
    if (isSub || window.scrollY > 80) header.classList.add("is-solid");
    else header.classList.remove("is-solid");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // 공지 띠가 있으면 헤더 높이만큼 본문을 내림
  function setHeaderHeight() {
    if (!header) return;
    var notice = header.querySelector(".notice-bar");
    if (isSub) body.style.paddingTop = header.offsetHeight + "px";
    else if (notice) body.style.setProperty("--notice-h", notice.offsetHeight + "px");
  }
  setHeaderHeight();
  window.addEventListener("resize", setHeaderHeight);

  // 전체메뉴
  var btn = document.querySelector(".btn-allmenu");
  var menu = document.getElementById("allmenu");
  function toggleMenu(force) {
    var open = typeof force === "boolean" ? force : !body.classList.contains("is-menu-open");
    body.classList.toggle("is-menu-open", open);
    if (btn) { btn.setAttribute("aria-expanded", String(open)); btn.setAttribute("aria-label", open ? "전체메뉴 닫기" : "전체메뉴 열기"); }
    if (menu) menu.setAttribute("aria-hidden", String(!open));
  }
  if (btn && menu) {
    btn.addEventListener("click", function () { toggleMenu(); });
    var close = menu.querySelector(".allmenu-close");
    if (close) close.addEventListener("click", function () { toggleMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && body.classList.contains("is-menu-open")) toggleMenu(false); });
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { toggleMenu(false); }); });
  }

  // TOP
  document.querySelectorAll(".q-top").forEach(function (b) {
    b.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  });

  // 현재 메뉴 표시 (GNB 1depth 는 폴더 기준, 전체메뉴·LNB 는 정확히 같은 주소)
  var cur = location.pathname.replace(/\/index\.html$/, "/");
  if (cur === "") cur = "/";
  document.querySelectorAll(".gnb li > a").forEach(function (a) {
    var h = a.getAttribute("href") || "";
    if (h !== "/" && cur.indexOf(h) === 0) a.parentElement.classList.add("active");
  });
  document.querySelectorAll(".allmenu-col li > a, .sub-tabs li > a").forEach(function (a) {
    var h = (a.getAttribute("href") || "").replace(/\/index\.html$/, "/");
    if (h && h === cur) a.parentElement.classList.add("active");
  });

  // 탭 (핵심치료 등): [data-tabs] 안의 [role=tab] / [role=tabpanel]
  document.querySelectorAll("[data-tabs]").forEach(function (wrap) {
    var tabs = Array.prototype.slice.call(wrap.querySelectorAll("[role=tab]"));
    var panels = Array.prototype.slice.call(wrap.querySelectorAll("[role=tabpanel]"));
    function activate(i) {
      tabs.forEach(function (t, j) { t.classList.toggle("is-active", i === j); t.setAttribute("aria-selected", String(i === j)); t.tabIndex = i === j ? 0 : -1; });
      panels.forEach(function (p, j) { p.classList.toggle("is-active", i === j); p.hidden = i !== j; });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { activate(i); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); var n = (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length; activate(n); tabs[n].focus(); }
      });
    });
    activate(Math.max(0, tabs.findIndex(function (t) { return t.classList.contains("is-active"); })));
  });

  // 칼럼 카테고리 필터 (메인·목록): .post-filter[data-filter="#목록 selector"] 안의 button[data-cat]
  document.querySelectorAll(".post-filter[data-filter]").forEach(function (f) {
    var list = document.querySelector(f.getAttribute("data-filter"));
    if (!list) return;
    f.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        f.querySelectorAll("button").forEach(function (x) { x.classList.toggle("active", x === b); });
        var c = b.getAttribute("data-cat") || "";
        var n = 0;
        list.querySelectorAll(".post-card").forEach(function (card) {
          var show = !c || card.getAttribute("data-category") === c;
          card.hidden = !show;
          if (show) n++;
        });
        var empty = list.querySelector(".filter-empty");
        if (empty) empty.remove();
        if (!n) { var p = document.createElement("p"); p.className = "muted filter-empty"; p.textContent = "이 분류의 칼럼은 준비 중입니다."; list.appendChild(p); }
      });
    });
  });

  // 등장 애니메이션
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }
})();
