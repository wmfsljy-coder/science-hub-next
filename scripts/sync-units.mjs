/*
 * 단원 화면 옮겨 담기 (fetch-content.mjs 가 끝에 부릅니다)
 *
 * 과목 저장소 12개의 단원 페이지를 이 사이트 안에서 그대로 돌리기 위해 빌드할 때 복사합니다.
 * 과목 저장소와 science-teacher-hub 의 파일은 읽기만 하고, 고치는 것은 복사본뿐입니다.
 *
 *   public/engine/                 공용 엔진 한 벌(12벌 사본 중 가장 최근 것, 절대 주소는 이 사이트로 바꿈)
 *   public/hub-assets/             엔진이 부르는 허브 자료(review-*.js, unit-items-all.js, precheck-all.js)
 *   public/u/<저장소>/assets/      저장소마다 다른 파일(share-config.js, people-data.js) — 단원 페이지의 ../assets/ 가 그대로 가리킴
 *   public/u/<저장소>/index.html   과목 페이지(/c/<저장소>/)로 넘겨주기(단원 안의 '../' 링크용)
 *   public/u/<저장소>/<단원>/      단원 자료(js·data·img) + 주소만 바꾼 index.html  →  /u/<저장소>/<단원>/ 에서 바로 수업
 *
 * 단원마다 페이지가 따로 열리므로(전체 새로 고침) 단원끼리 같은 전역 이름(REAL_CO2 등)이 부딪히지 않습니다.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const OWNER_HOST = "wmfsljy-coder.github.io";
/* 저장소마다 내용이 달라서 저장소별로 두는 파일 */
const PER_REPO = new Set(["share-config.js", "people-data.js"]);
/* 허브(science-teacher-hub/assets)에서 가져올 자료 */
const HUB_FILES = (name) => /^review-[\w-]+\.js$/.test(name) || name === "unit-items-all.js" || name === "precheck-all.js";
/* 단원 폴더에서 복사하지 않을 파일 */
const SKIP_UNIT = (name) => name === "index.html" || /\.md$/i.test(name) || name.startsWith(".");
/* 옛 '과목 묶음' 껍데기 저장소(목차 한 장뿐) — 링크는 그 단원의 과목 페이지로 돌린다 */
const SHELLS = new Set(["integrated-science", "earth-system", "planet-space", "science-inquiry"]);

const lf = (s) => s.replace(/\r\n/g, "\n");
const hash = (s) => crypto.createHash("md5").update(s).digest("hex").slice(0, 8);
const rmrf = (p) => fs.rmSync(p, { recursive: true, force: true });
const mkdir = (p) => fs.mkdirSync(p, { recursive: true });

function gitTime(repoDir, rel) {
  try {
    return Number(execFileSync("git", ["-C", repoDir, "log", "-1", "--format=%ct", "--", rel], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()) || 0;
  } catch {
    return 0;
  }
}

function copyTree(src, dest, skip) {
  let n = 0;
  mkdir(dest);
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip && skip(e.name)) continue;
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) n += copyTree(s, d, null);
    else {
      fs.copyFileSync(s, d);
      n++;
    }
  }
  return n;
}

/* 엔진 복사본에만 적용하는 주소 바꾸기. need=true 인데 못 찾으면 경고(엔진이 바뀐 것). */
function enginePatches(base) {
  return [
    { file: "account.js", from: '"/science-teacher-hub-qtrqwc/assets/unit-items-all.js"', to: `"${base}/hub-assets/unit-items-all.js"`, need: true },
    { file: "review.js", from: '"/science-teacher-hub-qtrqwc/assets/review-"', to: `"${base}/hub-assets/review-"`, need: true },
    /* 교사 기기의 '← 허브' 링크 → 새 사이트 첫 화면 */
    { file: "theme.js", from: 'a.href = "https://wmfsljy-coder.github.io/science-teacher-hub-qtrqwc/";', to: `a.href = "${base}/";`, need: true },
    /* 과목 첫 화면의 '과목 QR 모음·인쇄' → 새 사이트 QR 모음 */
    { file: "theme.js", from: "https://wmfsljy-coder.github.io/science-teacher-hub-qtrqwc/qr/?s=", to: `${base}/qr/?s=`, need: true },
    /* 과목 전체 QR(?all=1) 학생 울타리: 과목 = /science-hub-next-ywarpe/u/<저장소>/ */
    {
      file: "theme.js",
      from: 'var SUBJ = (/^\\/[^\\/]+\\//.exec(location.pathname) || ["/"])[0]',
      to: "var SUBJ = (/^" + base.replace(/\//g, "\\/") + String.raw`\/u\/[^\/]+\//.exec(location.pathname) || /^\/[^\/]+\//.exec(location.pathname) || ["/"])[0]`,
      need: true,
    },
  ];
}

/* 우리 Pages 주소로 가는 링크(href) → 이 사이트 안으로. 주소 뒤 ?·# 는 그대로 둔다.
   과목 저장소 → /u/<저장소>/<단원>/ 또는 /c/<저장소>/, 옛 허브 화면 → 새 화면, 껍데기 저장소 → fallback */
const HUB_PAGES = { "": "/", "resources/": "/resources/", "qr/": "/qr/", "class/": "/class/", "records/": "/records/", "maps/": "/maps/", "phet/": "/resources/#PhET" };
export function rewriteOwnLinks(html, { base, repoSet, fallback }) {
  return html.replace(/(href=")https:\/\/wmfsljy-coder\.github\.io\/([\w-]+)\/((?:[\w-]+\/)?)(?:index\.html)?(?=["?#])/g, (all, pre, r, rest) => {
    const u = rest.replace(/\/$/, "");
    if (repoSet.has(r)) return u && /^\d/.test(u) ? `${pre}${base}/u/${r}/${u}/` : `${pre}${base}/c/${r}/`;
    if (r === "science-teacher-hub" && rest in HUB_PAGES) return `${pre}${base}${HUB_PAGES[rest]}`;
    if (SHELLS.has(r) && !u) return `${pre}${fallback}`;
    return all;
  });
}

/* share-config.js 복사본: 이 사이트 호스트를 허용 목록에 두고, localhost·127.0.0.1 은 뺀다
   (내 컴퓨터에서 돌린 검사가 진짜 시트에 쓰지 않게). 공유 주소·반 목록·지도 키는 그대로. */
export function patchShareConfig(src, repo, warn) {
  const re = /window\.STH_SHARE_HOSTS\s*=\s*\[([^\]]*)\]/;
  const m = src.match(re);
  if (!m) {
    warn(`${repo}/assets/share-config.js 에 STH_SHARE_HOSTS 가 없습니다(그대로 복사).`);
    return src;
  }
  const hosts = [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]).filter((h) => h !== "localhost" && h !== "127.0.0.1");
  if (!hosts.includes(OWNER_HOST)) hosts.unshift(OWNER_HOST);
  return src.replace(re, `window.STH_SHARE_HOSTS = ${JSON.stringify(hosts)} /* science-hub-next 빌드에서 localhost 를 뺐습니다 */`);
}

export function syncUnits({ root, contentDir, courses, base }) {
  const pub = path.join(root, "public");
  const outEngine = path.join(pub, "engine");
  const outHub = path.join(pub, "hub-assets");
  const outU = path.join(pub, "u");
  for (const p of [outEngine, outHub, outU]) rmrf(p);
  for (const p of [outEngine, outHub, outU]) mkdir(p);

  const warnings = [];
  const errors = [];
  const warn = (m) => {
    warnings.push(m);
    console.warn(`  ⚠ ${m}`);
  };

  /* ---------- 1. 공용 엔진 한 벌 ---------- */
  const variants = new Map(); // 파일 이름 → Map(내용해시 → {text, repos[], time})
  for (const c of courses) {
    const adir = path.join(contentDir, c.repo, "assets");
    if (!fs.existsSync(adir)) continue;
    for (const name of fs.readdirSync(adir)) {
      if (PER_REPO.has(name) || !/\.(js|css)$/.test(name)) continue;
      const text = lf(fs.readFileSync(path.join(adir, name), "utf8"));
      const h = hash(text);
      if (!variants.has(name)) variants.set(name, new Map());
      const vm = variants.get(name);
      if (!vm.has(h)) vm.set(h, { text, repos: [], time: 0 });
      const v = vm.get(h);
      v.repos.push(c.repo);
      v.time = Math.max(v.time, gitTime(path.join(contentDir, c.repo), `assets/${name}`));
    }
  }
  const engine = {}; // 이름 → ?v= 해시
  const patches = enginePatches(base);
  for (const [name, vm] of [...variants].sort()) {
    const list = [...vm.values()].sort((a, b) => b.time - a.time || b.repos.length - a.repos.length);
    const pick = list[0];
    if (list.length > 1) {
      warn(`엔진 ${name}: 사본 ${list.length}가지 → 가장 최근 커밋(${pick.repos.join(", ")}) 사용. 다른 판: ${list.slice(1).map((v) => v.repos.join("/")).join(" | ")}`);
    }
    let text = pick.text;
    for (const p of patches.filter((x) => x.file === name)) {
      if (text.includes(p.from)) text = text.split(p.from).join(p.to);
      else if (p.need) warn(`엔진 ${name}: 바꿀 글귀를 못 찾음 → ${p.from.slice(0, 60)}`);
    }
    if (/["'`]\/science-teacher-hub\/assets\//.test(text)) errors.push(`엔진 ${name} 에 옛 허브 절대 주소(/science-teacher-hub-qtrqwc/assets/)가 남아 있습니다.`);
    fs.writeFileSync(path.join(outEngine, name), text);
    engine[name] = hash(text);
  }
  /* 새 사이트 연결용 작은 파일(우리 저장소 legacy/ 에 있음) */
  for (const name of fs.readdirSync(path.join(root, "legacy"))) {
    if (!name.endsWith(".js")) continue;
    const text = fs.readFileSync(path.join(root, "legacy", name), "utf8");
    fs.writeFileSync(path.join(outEngine, name), text);
    engine[name] = hash(text);
  }

  /* ---------- 2. 허브 자료 ---------- */
  const hubDir = path.join(contentDir, "science-teacher-hub", "assets");
  let hubCount = 0;
  if (fs.existsSync(hubDir)) {
    for (const name of fs.readdirSync(hubDir).filter(HUB_FILES)) {
      fs.copyFileSync(path.join(hubDir, name), path.join(outHub, name));
      hubCount++;
    }
  } else errors.push(`허브 자료 폴더가 없습니다: ${hubDir}`);

  /* ---------- 3. 저장소별 파일 + 단원 ---------- */
  const repoSet = new Set(courses.map((c) => c.repo));
  let unitCount = 0;
  let fileCount = 0;
  let resFix = 0;
  const report = [];
  for (const c of courses) {
    const rdir = path.join(contentDir, c.repo);
    const outR = path.join(outU, c.repo);
    mkdir(path.join(outR, "assets"));
    const repoVer = {};
    for (const name of PER_REPO) {
      const src = path.join(rdir, "assets", name);
      if (!fs.existsSync(src)) continue;
      let text = fs.readFileSync(src, "utf8");
      if (name === "share-config.js") text = patchShareConfig(text, c.repo, warn);
      fs.writeFileSync(path.join(outR, "assets", name), text);
      repoVer[name] = hash(text);
    }
    const coursePage = `${base}/c/${c.repo}/`;
    /* /u/<저장소>/ → 과목 페이지(?all=1 같은 주소 뒤 글자는 그대로 넘김) */
    fs.writeFileSync(
      path.join(outR, "index.html"),
      `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>${c.name}</title><script>location.replace(${JSON.stringify(coursePage)} + location.search + location.hash)</script><meta http-equiv="refresh" content="0; url=${coursePage}"><link rel="canonical" href="${coursePage}"></head><body><p><a href="${coursePage}">${c.name} 단원 목록으로 가기</a></p></body></html>\n`,
    );

    const slugs = fs
      .readdirSync(rdir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && /^\d/.test(d.name) && fs.existsSync(path.join(rdir, d.name, "index.html")))
      .map((d) => d.name);
    for (const slug of slugs) {
      const ud = path.join(rdir, slug);
      const outD = path.join(outR, slug);
      fileCount += copyTree(ud, outD, SKIP_UNIT);
      /* 단원 자료 js 속 옛 자료실 주소(대부분 주석) → 새 자료실 */
      for (const f of fs.readdirSync(outD).filter((n) => n.endsWith(".js"))) {
        const fp = path.join(outD, f);
        const s = fs.readFileSync(fp, "utf8");
        if (s.includes("science-teacher-hub-qtrqwc/resources/")) {
          fs.writeFileSync(fp, s.split("https://wmfsljy-coder.github.io/science-teacher-hub-qtrqwc/resources/").join(`${base}/resources/`).split("science-teacher-hub-qtrqwc/resources/").join(`${base.slice(1)}/resources/`));
          resFix++;
        }
      }
      let html = fs.readFileSync(path.join(ud, "index.html"), "utf8");
      const used = [];
      /* ../assets/<파일> → 공용 엔진 또는 저장소별 사본 */
      html = html.replace(/(<(?:script|link)\b[^>]*?\b(?:src|href)=")\.\.\/assets\/([^"?#]+)(?:\?[^"]*)?"/g, (all, pre, name) => {
        used.push(name);
        if (PER_REPO.has(name)) return `${pre}../assets/${name}?v=${repoVer[name] || "0"}"`;
        if (engine[name]) return `${pre}${base}/engine/${name}?v=${engine[name]}"`;
        errors.push(`${c.repo}/${slug}: 엔진에 없는 파일 ../assets/${name}`);
        return all;
      });
      /* 새 사이트 연결 파일을 theme.js 바로 앞에 끼움 */
      const tag = `<script src="${base}/engine/hub-next.js?v=${engine["hub-next.js"]}" data-base="${base}" data-repo="${c.repo}" data-unit="${slug}"></script>\n`;
      const at = html.search(/<script\b[^>]*\bsrc="[^"]*\/engine\/theme\.js/);
      if (at < 0) errors.push(`${c.repo}/${slug}: theme.js 를 못 찾음`);
      else html = html.slice(0, at) + tag + html.slice(at);
      /* 우리 Pages 주소로 가는 링크 → 이 사이트 안으로 */
      html = rewriteOwnLinks(html, { base, repoSet, fallback: coursePage });
      if (html.includes("science-teacher-hub-qtrqwc/")) errors.push(`${c.repo}/${slug}: index.html 에 옛 허브 주소가 남음`);
      fs.writeFileSync(path.join(outD, "index.html"), html);

      /* 바꾼 페이지가 가리키는 우리 사이트 파일이 다 있는지 확인 */
      for (const m of html.matchAll(/<(?:script|link|img)\b[^>]*?\b(?:src|href)="([^"]+)"/g)) {
        const ref = m[1].replace(/[?#].*$/, "");
        if (/^(https?:|data:|mailto:|#)/.test(ref) || !ref) continue;
        const file = ref.startsWith(base + "/") ? path.join(pub, ref.slice(base.length)) : path.join(outD, ref);
        if (!fs.existsSync(file)) errors.push(`${c.repo}/${slug}: 파일 없음 ${m[1]}`);
      }
      report.push(`${c.repo}/${slug}(${used.length})`);
      unitCount++;
    }
  }

  const engineList = Object.keys(engine).sort();
  console.log(`단원 화면: ${unitCount}개 단원, 단원 파일 ${fileCount}개 → public/u/ · 엔진 ${engineList.length}개 → public/engine/ · 허브 자료 ${hubCount}개 → public/hub-assets/ · 옛 자료실 주소 바꾼 js ${resFix}개`);
  if (warnings.length) console.log(`  경고 ${warnings.length}건(위 ⚠ 참고)`);
  if (errors.length) {
    for (const e of errors) console.error(`  ✗ ${e}`);
    throw new Error(`단원 화면 옮기기 오류 ${errors.length}건`);
  }
  fs.writeFileSync(
    path.join(root, "content", "units-sync.json"),
    JSON.stringify({ units: unitCount, engine, hub: hubCount, warnings }, null, 1),
  );
  return { unitCount, engine, warnings };
}
