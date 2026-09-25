/**
 * SEO / GEO / AEO 자동 주입 스크립트
 * ------------------------------------------------------------
 * 실행:  사이트 폴더에서  node tools/seo-inject.js      (build.js 와 로컬 어드민이 자동 실행)
 *
 * 하는 일 (모든 .html 에 대해, _ 로 시작하는 파일·구현가이드·404 제외)
 *  1. <head> 안의 <!-- seo:start --> ~ <!-- seo:end --> 블록을 새로 만든다
 *     - canonical, robots, keywords, 소유확인 코드, Open Graph, Twitter Card, 지역 메타
 *     - JSON-LD 구조화 데이터: Hospital+MedicalClinic(병원), Physician(대표원장), WebSite,
 *       MedicalWebPage(질환 페이지는 about=MedicalCondition), BreadcrumbList(.breadcrumb 에서 추출),
 *       FAQPage(details.faq-item 에서 추출), Article(원장칼럼 article.post), VideoObject(영상 임베드 칼럼)
 *  2. sitemap.xml, robots.txt, llms.txt, column/rss.xml 을 다시 만든다
 *
 * 사이트 주소(SITE_URL) 는 admin/config.json 의 siteUrl. 빌드 환경변수 URL / SITE_URL 이 있으면 그 값이 우선.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const TODAY = new Date().toISOString().slice(0, 10);

let CFG = {};
try { CFG = JSON.parse(fs.readFileSync(path.join(ROOT, "admin", "config.json"), "utf8")); } catch (e) {}
const SITE_URL = (process.env.URL || process.env.SITE_URL || CFG.siteUrl || "https://sr-bareul.co.kr").replace(/\/+$/, "");

// 병원 기본 정보는 site.json (어드민 "홈페이지 설정") 에서 읽음
let SITE = {};
try { SITE = JSON.parse(fs.readFileSync(path.join(ROOT, "site.json"), "utf8")); } catch (e) {}
const SC = SITE.clinic || {}, SH = SITE.hours || {}, SCH = SITE.channels || {}, SSEO = SITE.seo || {};
const PHONE = SC.phone || "02-3281-1075";
if (SSEO.naverVerify) CFG.naverVerify = SSEO.naverVerify;
if (SSEO.googleVerify) CFG.googleVerify = SSEO.googleVerify;

const CLINIC = {
  name: SC.name || "바를정한방병원",
  alternateName: `${SC.name || "바를정한방병원"} ${SC.centerName || "안면마비·재활센터"}`,
  telephone: "+82-" + PHONE.replace(/^0/, ""),
  email: SC.email || "",
  streetAddress: SC.street || "남부순환로 1485 삼남빌딩 1층·8층·9층",
  addressLocality: SC.city || "관악구",
  addressRegion: SC.region || "서울특별시",
  lat: SC.lat ? Number(SC.lat) : null,
  lng: SC.lng ? Number(SC.lng) : null,
  founder: SC.doctor || "정인호",
  beds: Number(SC.beds) || 65,
  logo: "/assets/images/logo/logo-v-512.png",
  image: "/assets/images/og/og-default.jpg",
  hasMap: SCH.naverMap || "",
  sameAs: [SCH.mainSite, SCH.youtube, SCH.kakao, SCH.naverMap, SCH.blog, SCH.instagram].filter(Boolean),
  openingHours: [
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: SH.weekdayOpen || "09:00", closes: SH.weekdayClose || "20:00" },
    { days: ["Saturday", "Sunday", "PublicHolidays"], opens: SH.weekendOpen || "09:00", closes: SH.weekendClose || "15:00" }
  ],
  services: ["안면마비 한방치료", "구안와사·벨마비 치료", "람세이헌트증후군 치료", "안면마비 후유증(연합운동·안면경련) 치료", "삼차신경통 치료", "안면비대칭 교정", "교통사고 후유증 재활치료", "수술 후 재활치료", "척추질환 치료", "한·양방 협진 입원치료"]
};

const DOCTOR = {
  name: SC.doctor || "정인호",
  jobTitle: "한의사 · 대표원장",
  url: "/about/doctors/",
  image: "/assets/images/doctors/jung-inho.jpg",
  alumniOf: ["성균관대학교 동양철학과", "우석대학교 한의학과"],
  memberOf: ["대한안면학회 (회장)", "구안와사연구회 (회장)"],
  affiliation: "우석대학교 한의학과 외래교수",
  knowsAbout: ["안면마비", "구안와사", "벨마비", "람세이헌트증후군", "안면마비 후유증", "연합운동", "안면경련", "삼차신경통", "정안침", "INNO 매선", "정안탕"]
};

// 페이지별 keywords (네이버용). 칼럼은 어드민 입력값을 씀
const KEYWORDS = {
  "/index.html": "안면마비, 구안와사, 벨마비, 람세이헌트증후군, 안면마비 후유증, 신림 한방병원, 관악구 한방병원, 안면마비 입원, 바를정한방병원",
  "/about/index.html": "바를정한방병원, 관악구 한방병원, 신림 한방병원, 안면마비 전문 한방병원, 한양방 협진 병원",
  "/about/doctors/index.html": "정인호 원장, 대한안면학회 회장, 구안와사연구회, 안면마비 전문 한의사, 바를정한방병원 의료진",
  "/about/facility/index.html": "한방병원 입원실, 관악구 입원 한방병원, 바를정한방병원 시설, 65병상 한방병원",
  "/about/location/index.html": "바를정한방병원 위치, 남부순환로 1485, 신림역 한방병원, 관악구 한방병원 오시는 길, 주차 안내",
  "/facial-palsy/index.html": "안면마비, 안면마비 한방치료, 구안와사 치료, 안면신경마비, 안면마비 골든타임, 안면마비 입원",
  "/facial-palsy/bells-palsy/index.html": "구안와사, 벨마비, 특발성 안면마비, 구안와사 초기증상, 구안와사 한방치료, 벨마비 치료",
  "/facial-palsy/ramsay-hunt/index.html": "람세이헌트증후군, 대상포진 안면마비, 귀 수포 안면마비, 람세이헌트 치료",
  "/facial-palsy/sequelae/index.html": "안면마비 후유증, 연합운동, 안면경련, 구안와사 재발, 오래된 구안와사, 안면마비 후유증 치료",
  "/facial-palsy/treatment/index.html": "안면마비 한방치료, 정안침, 매선치료, 약침, INNO 매선, 정안탕, 신경전기도수치료",
  "/facial-palsy/trigeminal/index.html": "삼차신경통, 얼굴 전기 통증, 삼차신경통 한방치료, 얼굴 통증 한의원",
  "/facial-palsy/asymmetry/index.html": "안면비대칭, 비수술 안면비대칭 교정, 안면마비 후 비대칭, 얼굴 비대칭 한방",
  "/column/index.html": "안면마비 칼럼, 구안와사 칼럼, 정인호 원장 칼럼, 안면마비 정보, 한방병원 칼럼",
  "/rehab/index.html": "재활클리닉, 한방 재활치료, 교통사고 후유증, 수술 후 재활, 관악구 재활 한방병원",
  "/rehab/traffic-accident/index.html": "교통사고 후유증, 교통사고 한방병원, 교통사고 입원, 자동차보험 한방치료, 교통사고 골든타임",
  "/rehab/post-surgery/index.html": "수술 후 재활, 수술 후 한방재활, 재활 입원, 수술 후 통증 관리, 재활 한방병원",
  "/rehab/spine/index.html": "척추질환, 목디스크, 허리디스크, 척추관협착증, 관악구 척추 한방병원",
  "/admission/index.html": "한방병원 입원, 안면마비 입원, 입원 안내, 실손보험 한방, 자동차보험 입원",
  "/admission/guide/index.html": "입원 절차, 퇴원 절차, 입원 준비물, 한방병원 입원 안내, 면회 시간",
  "/admission/insurance/index.html": "실손보험 한방병원, 진단서 발급, 진료비 세부내역서, 자동차보험 한방 입원, 서류 발급",
  "/admission/non-covered/index.html": "한방병원 비급여, 비급여 진료비, 약침 비용, 매선 비용, 비급여 항목 고지"
};

// 질환 페이지·칼럼의 about (검색엔진·AI 가 "무엇에 관한 의학 페이지인가" 를 개체로 이해하도록)
const MEDICAL_TOPICS = [
  { re: /람세이\s*헌트|대상포진/, node: { "@type": "MedicalCondition", name: "람세이헌트증후군", alternateName: ["Ramsay Hunt syndrome", "대상포진 안면마비"] } },
  { re: /벨\s*마비|구안와사|특발성/, node: { "@type": "MedicalCondition", name: "벨마비", alternateName: ["구안와사", "특발성 안면신경마비", "Bell's palsy"] } },
  { re: /연합\s*운동|안면\s*경련|후유증|재발/, node: { "@type": "MedicalCondition", name: "안면마비 후유증", alternateName: ["연합운동", "안면경련", "Synkinesis"] } },
  { re: /삼차\s*신경통/, node: { "@type": "MedicalCondition", name: "삼차신경통", alternateName: "Trigeminal neuralgia" } },
  { re: /안면\s*비대칭|얼굴\s*비대칭/, node: { "@type": "MedicalCondition", name: "안면비대칭", alternateName: "Facial asymmetry" } },
  { re: /교통사고/, node: { "@type": "MedicalCondition", name: "교통사고 후유증", alternateName: "편타성 손상" } },
  { re: /디스크|협착증|척추/, node: { "@type": "MedicalCondition", name: "척추질환", alternateName: ["목디스크", "허리디스크", "척추관협착증"] } },
  { re: /수술\s*후/, node: { "@type": "MedicalTherapy", name: "수술 후 재활치료" } },
  { re: /안면\s*마비|안면\s*신경/, node: { "@type": "MedicalCondition", name: "안면마비", alternateName: ["안면신경마비", "Facial palsy"] } },
  { re: /정안침|매선|정안탕|약침/, node: { "@type": "MedicalTherapy", name: "안면마비 한방치료 (정안침·INNO 매선·정안탕)" } }
];
function medicalTopics(text) {
  return MEDICAL_TOPICS.filter((t) => t.re.test(text)).map((t) => t.node);
}

// ---------- 유틸 ----------
function lastModOf(file) {
  try {
    const d = execFileSync("git", ["log", "-1", "--format=%cs", "--", path.relative(ROOT, file)], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  } catch (e) {}
  return TODAY;
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return ["node_modules", "tools", "components", "admin", "_data", "_preview", "dist", ".git", "assets"].includes(e.name) ? [] : walk(p);
    return [p];
  });
}
function decode(s) {
  return s.replace(/&nbsp;/g, " ").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}
function text(html) {
  return decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}
function attr(tag, name) {
  const m = tag.match(new RegExp(name + '\\s*=\\s*"([^"]*)"')) || tag.match(new RegExp(name + "\\s*=\\s*'([^']*)'"));
  return m ? decode(m[1]) : "";
}
function cleanPath(p) {
  return p.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
}
function abs(p) {
  if (!p) return "";
  if (/^https?:/.test(p)) return p;
  return SITE_URL + (/\.(html)$/.test(p) ? cleanPath(p) : p);
}
function urlFor(file) {
  const rel = "/" + path.relative(ROOT, file).split(path.sep).join("/");
  return SITE_URL + cleanPath(rel);
}
function pick(html, re) {
  const m = html.match(re);
  return m ? m[1] : "";
}
function youtubeId(url) {
  const m = String(url || "").match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : "";
}

// ---------- 추출 ----------
function extract(html) {
  const title = text(pick(html, /<title>([\s\S]*?)<\/title>/i));
  const description = attr(pick(html, /(<meta\s+name="description"[^>]*>)/i) || "", "content");
  const h1 = text(pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i));

  // breadcrumb: <nav class="breadcrumb"> 홈 > 안면마비 > 구안와사
  const bcHtml = pick(html, /<nav class="breadcrumb"[^>]*>([\s\S]*?)<\/nav>/i) || pick(html, /<div class="breadcrumb"[^>]*>([\s\S]*?)<\/div>/i);
  const crumbs = [];
  if (bcHtml) {
    bcHtml.split(/&gt;/).forEach((p) => {
      const a = p.match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
      if (a) crumbs.push({ name: text(a[2]), url: abs(a[1]) });
      else if (text(p)) crumbs.push({ name: text(p), url: "" });
    });
  }

  // FAQ: <details class="faq-item"><summary>질문</summary> 답 </details>
  const faqs = [];
  const re = /<details class="faq-item"[^>]*>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi;
  let m;
  while ((m = re.exec(html))) {
    // FAQ 페이지의 번호(Q12)·링크 복사 버튼은 구조화 데이터에서 제외
    const qHtml = m[1].replace(/<span class="q-no">[\s\S]*?<\/span>/g, "");
    const aHtml = m[2].replace(/<p class="faq-tools">[\s\S]*?<\/p>/g, "");
    faqs.push({ q: text(qHtml), a: text(aHtml) });
  }

  // 칼럼
  const artTag = pick(html, /(<article class="post"[^>]*>)/i);
  const article = artTag
    ? {
        category: attr(artTag, "data-category"),
        published: attr(artTag, "data-published"),
        modified: attr(artTag, "data-modified") || attr(artTag, "data-published"),
        image: attr(artTag, "data-image"),
        video: attr(artTag, "data-video"),
        summary: (() => {
          const s = pick(html, /<section class="summary-box"[\s\S]*?<ul>([\s\S]*?)<\/ul>/i);
          return s ? s.split(/<\/li>/).map(text).filter(Boolean) : [];
        })(),
        body: text(pick(html, /<div class="post-body">([\s\S]*?)<p class="review-note">/i))
      }
    : null;

  // 대표 이미지: 페이지가 지정한 data-og-image → 칼럼 썸네일 → 기본
  let image = attr(pick(html, /(<meta\s+name="page-image"[^>]*>)/i) || "", "content");
  if (!image && article) image = article.image;
  if (!image) image = CLINIC.image;

  // 질환 페이지 표시: <main data-page-type="condition"> 등
  const mainTag = pick(html, /(<main[^>]*>)/i);
  const pageType = attr(mainTag, "data-page-type");

  return { title, description, h1, crumbs, faqs, article, image: abs(image), pageType };
}

// ---------- JSON-LD ----------
function clinicNode() {
  const n = {
    "@type": ["Hospital", "MedicalClinic", "LocalBusiness"],
    "@id": SITE_URL + "/#hospital",
    name: CLINIC.name,
    alternateName: CLINIC.alternateName,
    url: SITE_URL + "/",
    telephone: CLINIC.telephone,
    image: abs(CLINIC.image),
    logo: abs(CLINIC.logo),
    founder: { "@id": SITE_URL + "/#doctor" },
    medicalSpecialty: ["Neurologic", "PhysicalTherapy", "한의학"],
    availableService: CLINIC.services.map((s) => ({ "@type": "MedicalTherapy", name: s })),
    address: { "@type": "PostalAddress", streetAddress: CLINIC.streetAddress, addressLocality: CLINIC.addressLocality, addressRegion: CLINIC.addressRegion, addressCountry: "KR" },
    numberOfBeds: CLINIC.beds,
    openingHoursSpecification: CLINIC.openingHours.map((o) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: o.days, opens: o.opens, closes: o.closes })),
    sameAs: CLINIC.sameAs,
    areaServed: ["서울특별시", "관악구", "신림동", "봉천동", "동작구", "금천구", "구로구"],
    currenciesAccepted: "KRW",
    paymentAccepted: "현금, 신용카드, 건강보험, 자동차보험, 실손보험(서류발급)",
    isAcceptingNewPatients: true
  };
  if (CLINIC.email) n.email = CLINIC.email;
  if (CLINIC.hasMap) n.hasMap = CLINIC.hasMap;
  if (CLINIC.lat && CLINIC.lng) n.geo = { "@type": "GeoCoordinates", latitude: CLINIC.lat, longitude: CLINIC.lng };
  return n;
}
function doctorNode(full) {
  const n = {
    "@type": ["Physician", "Person"],
    "@id": SITE_URL + "/#doctor",
    name: DOCTOR.name,
    jobTitle: DOCTOR.jobTitle,
    url: abs(DOCTOR.url),
    image: abs(DOCTOR.image),
    worksFor: { "@id": SITE_URL + "/#hospital" },
    medicalSpecialty: "한의학",
    memberOf: DOCTOR.memberOf.map((o) => ({ "@type": "Organization", name: o })),
    knowsAbout: DOCTOR.knowsAbout
  };
  if (full) {
    n.alumniOf = DOCTOR.alumniOf.map((o) => ({ "@type": "CollegeOrUniversity", name: o }));
    n.affiliation = { "@type": "Organization", name: DOCTOR.affiliation };
    n.description = "바를정한방병원 대표원장. 대한안면학회 회장, 구안와사연구회 회장. 20년간 안면마비(구안와사·벨마비·람세이헌트증후군)와 그 후유증을 진료해 왔습니다.";
  }
  return n;
}

function buildJsonLd(info, file, url) {
  const rel = "/" + path.relative(ROOT, file).split(path.sep).join("/");
  const isHome = rel === "/index.html";
  const isDoctor = rel === "/about/doctors/index.html";
  const graph = [clinicNode(), doctorNode(isDoctor)];

  if (isHome) {
    graph.push({ "@type": "WebSite", "@id": SITE_URL + "/#website", url: SITE_URL + "/", name: CLINIC.alternateName, publisher: { "@id": SITE_URL + "/#hospital" }, inLanguage: "ko-KR" });
  }

  const topicText = [info.h1, info.title, info.description].join(" ");
  const topics = info.article || info.pageType === "condition" ? medicalTopics(topicText) : [];
  const page = {
    "@type": "MedicalWebPage",
    "@id": url + "#webpage",
    url,
    name: info.title,
    description: info.description,
    inLanguage: "ko-KR",
    isPartOf: { "@id": SITE_URL + "/#website" },
    about: topics.length ? topics : { "@id": SITE_URL + "/#hospital" },
    primaryImageOfPage: info.image,
    dateModified: info.article ? info.article.modified : lastModOf(file),
    audience: { "@type": "MedicalAudience", audienceType: "Patient" },
    reviewedBy: { "@id": SITE_URL + "/#doctor" },
    lastReviewed: info.article ? info.article.modified : TODAY,
    speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", ".lead", ".key-answer", ".summary-box"] }
  };
  if (info.crumbs.length) page.breadcrumb = { "@id": url + "#breadcrumb" };
  graph.push(page);

  if (info.crumbs.length) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": url + "#breadcrumb",
      itemListElement: info.crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url || url }))
    });
  }

  if (info.faqs.length) {
    graph.push({ "@type": "FAQPage", "@id": url + "#faq", mainEntity: info.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
  }

  if (info.article) {
    const a = info.article;
    graph.push({
      "@type": "Article",
      "@id": url + "#article",
      headline: info.h1 || info.title,
      description: info.description,
      abstract: a.summary.join(" "),
      articleSection: a.category,
      ...(topics.length ? { about: topics } : {}),
      image: info.image,
      datePublished: a.published,
      dateModified: a.modified,
      author: { "@id": SITE_URL + "/#doctor" },
      publisher: { "@id": SITE_URL + "/#hospital" },
      mainEntityOfPage: { "@id": url + "#webpage" },
      inLanguage: "ko-KR",
      wordCount: a.body.replace(/\s+/g, "").length,
      isAccessibleForFree: true,
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".summary-box", ".key-answer"] }
    });
    const vid = youtubeId(a.video);
    if (vid) {
      graph.push({
        "@type": "VideoObject",
        "@id": url + "#video",
        name: info.h1 || info.title,
        description: info.description,
        thumbnailUrl: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        uploadDate: a.published,
        embedUrl: `https://www.youtube.com/embed/${vid}`,
        contentUrl: a.video,
        publisher: { "@id": SITE_URL + "/#hospital" }
      });
    }
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

// ---------- 주입 ----------
function inject(file) {
  let html = fs.readFileSync(file, "utf8");
  const url = urlFor(file);
  const rel = "/" + path.relative(ROOT, file).split(path.sep).join("/");
  const stripped = html.replace(/<!-- seo:start[\s\S]*?<!-- seo:end -->\n?/i, "");
  const info = extract(stripped);
  const isArticle = !!info.article;
  const modified = isArticle ? info.article.modified : lastModOf(file);
  const keywords = attr(pick(stripped, /(<meta\s+name="keywords"[^>]*>)/i) || "", "content") || KEYWORDS[rel] || "";
  const q = (s) => String(s || "").replace(/"/g, "&quot;");

  const block = [
    "<!-- seo:start (tools/seo-inject.js 가 자동 생성, 직접 수정하지 마세요) -->",
    `<link rel="canonical" href="${url}">`,
    `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">`,
    keywords && !/name="keywords"/i.test(stripped) ? `<meta name="keywords" content="${q(keywords)}">` : "",
    CFG.naverVerify ? `<meta name="naver-site-verification" content="${CFG.naverVerify}">` : "",
    CFG.googleVerify ? `<meta name="google-site-verification" content="${CFG.googleVerify}">` : "",
    `<meta name="author" content="${DOCTOR.name} 대표원장 · ${CLINIC.name}">`,
    `<meta name="geo.region" content="KR-11">`,
    `<meta name="geo.placename" content="${CLINIC.addressRegion} ${CLINIC.addressLocality}">`,
    CLINIC.lat && CLINIC.lng ? `<meta name="geo.position" content="${CLINIC.lat};${CLINIC.lng}">` : "",
    `<meta property="og:type" content="${isArticle ? "article" : "website"}">`,
    `<meta property="og:site_name" content="${CLINIC.alternateName}">`,
    `<meta property="og:locale" content="ko_KR">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${q(info.title)}">`,
    `<meta property="og:description" content="${q(info.description)}">`,
    `<meta property="og:image" content="${info.image}">`,
    isArticle ? `<meta property="article:published_time" content="${info.article.published}">` : "",
    isArticle ? `<meta property="article:modified_time" content="${info.article.modified}">` : "",
    isArticle ? `<meta property="article:author" content="${DOCTOR.name}">` : "",
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${q(info.title)}">`,
    `<meta name="twitter:description" content="${q(info.description)}">`,
    `<meta name="twitter:image" content="${info.image}">`,
    `<script type="application/ld+json">${JSON.stringify(buildJsonLd(info, file, url))}</script>`,
    "<!-- seo:end -->"
  ].filter(Boolean).join("\n");

  html = stripped.replace(/<\/head>/i, block + "\n</head>");
  fs.writeFileSync(file, html);
  return { url, rel, title: info.title, description: info.description, faqs: info.faqs.length, crumbs: info.crumbs.length, article: isArticle, modified, published: isArticle ? info.article.published : modified };
}

// ---------- 실행 ----------
const files = walk(ROOT).filter((f) => f.endsWith(".html") && !path.basename(f).startsWith("_") && !/구현가이드/.test(f) && path.basename(f) !== "404.html");
const entries = [];
for (const f of files) {
  const r = inject(f);
  entries.push(r);
  console.log(`${r.url}  faq:${r.faqs} crumb:${r.crumbs}${r.article ? " article" : ""}`);
}

// sitemap.xml
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  entries
    .map((e) => {
      const pri = e.url === SITE_URL + "/" ? "1.0" : e.article ? "0.7" : /\/column\/page\//.test(e.url) ? "0.3" : "0.8";
      return `  <url><loc>${e.url}</loc><lastmod>${e.modified}</lastmod><changefreq>${e.article ? "monthly" : "weekly"}</changefreq><priority>${pri}</priority></url>`;
    })
    .join("\n") +
  `\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap);

// robots.txt — 검색엔진 + AI 검색 크롤러 허용 (GEO), 데이터 수집용 Bytespider 는 차단
const AI_BOTS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "Google-Extended", "PerplexityBot", "ClaudeBot", "anthropic-ai", "Applebot-Extended", "CCBot", "Yeti", "NaverBot"];
fs.writeFileSync(
  path.join(ROOT, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /column/_data/\nDisallow: /column/_template.html\nDisallow: /components/\n\nSitemap: ${SITE_URL}/sitemap.xml\n\n` +
    AI_BOTS.map((b) => `User-agent: ${b}\nAllow: /\n`).join("\n") +
    `\nUser-agent: Bytespider\nDisallow: /\n`
);

// column/rss.xml — 네이버 서치어드바이저 RSS 제출용 (칼럼 수집 속도)
const columns = entries.filter((e) => e.article).sort((a, b) => b.published.localeCompare(a.published));
const rssDate = (d) => new Date(d + "T09:00:00+09:00").toUTCString();
const cdata = (s) => `<![CDATA[${String(s || "")}]]>`;
fs.writeFileSync(
  path.join(ROOT, "column", "rss.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n<title>${cdata(CLINIC.alternateName + " 원장칼럼")}</title>\n<link>${SITE_URL}/column/</link>\n<atom:link href="${SITE_URL}/column/rss.xml" rel="self" type="application/rss+xml"/>\n<description>${cdata("정인호 대표원장이 직접 쓰는 안면마비·구안와사·재활 이야기")}</description>\n<language>ko</language>\n<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n` +
    columns.slice(0, 50).map((e) => `<item>\n<title>${cdata(e.title.split("|")[0].trim())}</title>\n<link>${e.url}</link>\n<guid isPermaLink="true">${e.url}</guid>\n<description>${cdata(e.description)}</description>\n<pubDate>${rssDate(e.published)}</pubDate>\n<author>${cdata(DOCTOR.name + " 대표원장")}</author>\n</item>`).join("\n") +
    `\n</channel>\n</rss>\n`
);

// llms.txt — 생성형 AI 가 사이트를 요약해 인용할 때 읽는 파일
const pageOf = (rel) => entries.find((e) => e.rel === rel);
const line = (rel, label) => { const p = pageOf(rel); return p ? `- [${label || p.title.split("|")[0].trim()}](${p.url}): ${p.description}` : ""; };
const mainPages = [
  ["/facial-palsy/index.html", "안면마비 한방치료"], ["/facial-palsy/bells-palsy/index.html", "구안와사·벨마비"], ["/facial-palsy/ramsay-hunt/index.html", "람세이헌트증후군"], ["/facial-palsy/sequelae/index.html", "안면마비 후유증"], ["/facial-palsy/treatment/index.html", "바를정 퍼스널 핵심치료"], ["/facial-palsy/trigeminal/index.html", "삼차신경통"], ["/facial-palsy/asymmetry/index.html", "안면비대칭"],
  ["/rehab/index.html", "재활클리닉"], ["/rehab/traffic-accident/index.html", "교통사고 후유증"], ["/rehab/post-surgery/index.html", "수술 후 재활"], ["/rehab/spine/index.html", "척추질환"],
  ["/admission/index.html", "입원·보험안내"], ["/admission/guide/index.html", "입퇴원 안내"], ["/admission/insurance/index.html", "보험·서류발급"], ["/admission/non-covered/index.html", "비급여 항목"],
  ["/about/index.html", "바를정한방병원 소개"], ["/about/doctors/index.html", "의료진"], ["/about/facility/index.html", "병원 둘러보기"], ["/about/location/index.html", "오시는 길"]
];
const hoursText = `평일 ${CLINIC.openingHours[0].opens}-${CLINIC.openingHours[0].closes} (점심 ${SH.lunchStart || "13:00"}-${SH.lunchEnd || "14:00"}), 주말·공휴일 ${CLINIC.openingHours[1].opens}-${CLINIC.openingHours[1].closes} (점심시간 없음)`;
fs.writeFileSync(
  path.join(ROOT, "llms.txt"),
  `# ${CLINIC.alternateName}\n\n> 서울 관악구 신림 소재 ${CLINIC.beds}병상 한방병원. 20년 안면마비(구안와사·벨마비·람세이헌트증후군) 임상, 한·양방 협진 ${SC.staffCount || 7}인 의료진, 교통사고·수술 후 재활 입원치료. 대표원장 ${DOCTOR.name} (대한안면학회 회장, 구안와사연구회 회장).\n\n` +
    `## 핵심 정보\n- 대표원장: ${DOCTOR.name} (${DOCTOR.memberOf.join(", ")}, ${DOCTOR.affiliation})\n- 주소: ${CLINIC.addressRegion} ${CLINIC.addressLocality} ${CLINIC.streetAddress}\n- 전화: ${PHONE} / 카카오톡 상담: ${SCH.kakao || "https://pf.kakao.com/_kxjdkxb"}\n- 진료: ${hoursText}\n- 입원병동: ${CLINIC.beds}병상 / 한·양방 협진\n- 사업자등록번호: ${SC.bizNo || "205-43-45967"}\n- 본 사이트(공식 홈페이지): ${SCH.mainSite || "https://barrrjung-hospital.co.kr/"}\n${SCH.youtube ? `- 유튜브: ${SCH.youtube}\n` : ""}\n` +
    `## 주요 페이지\n${mainPages.map(([r, l]) => line(r, l)).filter(Boolean).join("\n")}\n\n` +
    `## 원장칼럼\n- [원장칼럼 목록](${SITE_URL}/column/)\n${columns.map((e) => `- [${e.title.split("|")[0].trim()}](${e.url}): ${e.description}`).join("\n")}\n\n` +
    `## 안내\n- 사이트맵: ${SITE_URL}/sitemap.xml\n- RSS: ${SITE_URL}/column/rss.xml\n- 이 사이트의 의학 정보는 일반적인 안내이며 진단·치료를 대신하지 않습니다. 개인별 치료 결과는 다를 수 있습니다.\n`
);
console.log(`\n${entries.length} pages updated · sitemap.xml · robots.txt · llms.txt · column/rss.xml  (SITE_URL = ${SITE_URL})`);
