/* 구안와사 FAQ — 검색 · 분류 필터 · 전체 펼치기/접기 · 링크 복사 (의존성 없음) */
(function () {
  "use strict";
  var root = document.querySelector("[data-faq]");
  if (!root) return;
  var input = root.querySelector("[data-faq-search]");
  var clearBtn = root.querySelector("[data-faq-clear]");
  var chips = root.querySelectorAll("[data-faq-cats] button");
  var groups = Array.prototype.slice.call(root.querySelectorAll(".faq-group"));
  var items = Array.prototype.slice.call(root.querySelectorAll("details.faq-item"));
  var status = root.querySelector("[data-faq-status]");
  var empty = root.querySelector("[data-faq-empty]");
  var expandBtn = root.querySelector("[data-faq-expand]");
  var collapseBtn = root.querySelector("[data-faq-collapse]");
  var total = items.length;
  var cat = "";
  var timer = null;

  var norm = function (s) { return String(s || "").toLowerCase().replace(/\s+/g, ""); };

  // 검색용 텍스트 미리 계산 (질문 + 답변)
  items.forEach(function (d) {
    var q = d.querySelector(".q-text");
    var a = d.querySelector(".a");
    d._q = q ? q.textContent : "";
    d._text = norm(d._q + " " + (a ? a.textContent : ""));
    d._qText = q ? q.textContent : "";
  });

  function highlight(d, term) {
    var q = d.querySelector(".q-text");
    if (!q) return;
    if (!term) { q.textContent = d._qText; return; }
    // 공백 무시 검색이므로 하이라이트는 질문 원문에서 공백 제거 위치를 대응시켜 찾음
    var src = d._qText, plain = "", map = [];
    for (var i = 0; i < src.length; i++) { if (!/\s/.test(src[i])) { plain += src[i].toLowerCase(); map.push(i); } }
    var idx = plain.indexOf(term);
    if (idx < 0) { q.textContent = d._qText; return; }
    var s = map[idx], e = map[idx + term.length - 1] + 1;
    q.textContent = "";
    q.appendChild(document.createTextNode(src.slice(0, s)));
    var m = document.createElement("mark"); m.textContent = src.slice(s, e); q.appendChild(m);
    q.appendChild(document.createTextNode(src.slice(e)));
  }

  function apply() {
    var term = norm(input ? input.value : "");
    var searching = term.length >= 1;
    var n = 0;
    items.forEach(function (d) {
      var okCat = !cat || d.getAttribute("data-cat") === cat;
      var okTerm = !searching || d._text.indexOf(term) >= 0;
      var show = okCat && okTerm;
      d.hidden = !show;
      if (show) n++;
      highlight(d, searching && show ? term : "");
      if (searching && show && term.length >= 2) d.open = true;
    });
    groups.forEach(function (g) {
      var visible = g.querySelectorAll("details.faq-item:not([hidden])").length;
      g.hidden = visible === 0;
    });
    if (status) {
      if (!searching && !cat) status.textContent = "전체 " + total + "개 질문";
      else status.textContent = n + "개 질문" + (searching ? " (‘" + input.value.trim() + "’ 검색)" : "");
    }
    if (empty) empty.hidden = n !== 0;
    if (clearBtn) clearBtn.hidden = !(input && input.value);
    root.classList.toggle("is-searching", searching);
  }

  if (input) {
    input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(apply, 120); });
    input.addEventListener("keydown", function (e) { if (e.key === "Escape") { input.value = ""; apply(); } });
  }
  if (clearBtn) clearBtn.addEventListener("click", function () { input.value = ""; apply(); input.focus(); });

  chips.forEach(function (b) {
    b.addEventListener("click", function () {
      cat = b.getAttribute("data-cat") || "";
      chips.forEach(function (x) { x.classList.toggle("active", x === b); });
      apply();
      var top = root.querySelector("[data-faq-list]");
      if (top && window.scrollY > top.getBoundingClientRect().top + window.scrollY - 140) {
        window.scrollTo({ top: top.getBoundingClientRect().top + window.scrollY - 130, behavior: "smooth" });
      }
    });
  });

  if (expandBtn) expandBtn.addEventListener("click", function () { items.forEach(function (d) { if (!d.hidden) d.open = true; }); });
  if (collapseBtn) collapseBtn.addEventListener("click", function () { items.forEach(function (d) { d.open = false; }); });

  // 링크 복사 (#q12)
  root.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest(".faq-link");
    if (!a) return;
    e.preventDefault();
    var url = location.origin + location.pathname + "#" + a.getAttribute("data-copy");
    var done = function () { var t = a.textContent; a.textContent = "복사됨"; setTimeout(function () { a.textContent = t; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { location.hash = a.getAttribute("data-copy"); });
    else location.hash = a.getAttribute("data-copy");
  });

  // 주소의 ?q=검색어 · #q12 처리
  try {
    var params = new URLSearchParams(location.search);
    var q = params.get("q");
    if (q && input) input.value = q;
  } catch (_) {}
  apply();
  function openHash() {
    var id = (location.hash || "").replace("#", "");
    if (!/^q\d+$/.test(id)) return;
    var d = document.getElementById(id);
    if (!d) return;
    if (input && input.value) { input.value = ""; }
    cat = ""; chips.forEach(function (x) { x.classList.toggle("active", !x.getAttribute("data-cat")); });
    apply();
    d.open = true;
    setTimeout(function () { window.scrollTo({ top: d.getBoundingClientRect().top + window.scrollY - 130, behavior: "smooth" }); }, 50);
  }
  window.addEventListener("hashchange", openHash);
  openHash();
})();
