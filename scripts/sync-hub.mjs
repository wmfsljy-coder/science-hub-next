/*
 * 허브 화면 옮겨 담기 (fetch-content.mjs 가 syncUnits 다음에 부릅니다)
 *
 *   public/class/index.html     교사 화면(옛 허브 class/ 를 주소만 바꿔 그대로) — 열쇠는 sessionStorage
 *   public/records/index.html   학생 기록·명단·PIN(같은 방식). 옛 뒷단·새 뒷단 둘 다 동작
 *   public/hub-assets/share-config.js  허브용 공유 설정(복사본에서 localhost 뺌)
 *   public/maps/plates.kml      판 경계 KML(파일 그대로)
 *   public/phet/index.html      자료실 PhET 칸(/resources/#PhET)으로 넘겨주기
 *   content/resources.json      자료실 목록(옛 resources/index.html 표를 읽어 React 화면용 자료로)
 *
 * class/·records/ 는 science-teacher-hub main 판을 씁니다. 급히 이 사이트만 다른 판을 써야 하면
 * legacy/hub/<화면>/index.html 을 두면 그것이 우선합니다(지금은 없음).
 */
import fs from "node:fs";
import path from "node:path";
import { patchShareConfig, rewriteOwnLinks } from "./sync-units.mjs";

const mkdir = (p) => fs.mkdirSync(p, { recursive: true });
const strip = (h) =>
  h
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
const unent = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

const HUB_DATA = new Set(["precheck-all.js", "unit-items-all.js"]);

function rewriteHubPage(html, { base, engine, repoSet, errors, name }) {
  html = html.replace(/(<(?:script|link)\b[^>]*?\b(?:src|href)=")\.\.\/assets\/([^"?#]+)(?:\?[^"]*)?"/g, (all, pre, f) => {
    if (HUB_DATA.has(f) || f === "share-config.js") return `${pre}${base}/hub-assets/${f}"`;
    if (engine[f]) return `${pre}${base}/engine/${f}?v=${engine[f]}"`;
    errors.push(`${name}: 엔진에 없는 파일 ../assets/${f}`);
    return all;
  });
  /* 처음 쓸 때 불러오는 자료(class/ 의 unit-items-all.js) */
  html = html.replace(/(\.src\s*=\s*")\.\.\/assets\/(precheck-all\.js|unit-items-all\.js)"/g, `$1${base}/hub-assets/$2"`);
  /* ← 교사용 허브 */
  html = html.replace(/href="\.\.\/"/g, `href="${base}/"`);
  html = rewriteOwnLinks(html, { base, repoSet, fallback: `${base}/` });
  if (/["']\.\.\/assets\//.test(html)) errors.push(`${name}: 바꾸지 못한 ../assets/ 주소가 남음`);
  return html;
}

/* 옛 자료실 표 한 줄 → 자료 */
function parseResources(html, base) {
  const rows = [];
  for (const m of html.matchAll(/<tr data-s="([^"]*)" data-g="([^"]*)">([\s\S]*?)<\/tr>/g)) {
    const cells = [...m[3].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1]);
    if (cells.length < 6) continue;
    const ua = cells[1].match(/<a href="(?:\.\.\/)+([\w-]+)\/([\w-]+)\/?"[^>]*>([\s\S]*?)<\/a>/);
    const links = [...cells[4].matchAll(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((a) => ({ href: unent(a[1]), text: strip(a[2]) }));
    rows.push({
      s: unent(m[1]),
      g: unent(m[2]),
      repo: ua ? ua[1] : "",
      unit: ua ? ua[2] : "",
      play: ua ? `${base}/u/${ua[1]}/${ua[2]}/` : "",
      unitLabel: ua ? strip(ua[3]) : strip(cells[1]),
      tab: strip((cells[1].match(/<div class="sub">([\s\S]*?)<\/div>/) || [])[1] || ""),
      kind: strip(cells[2]),
      word: strip(cells[3]),
      links,
      open: links.length ? "" : strip(cells[4]),
      note: strip(cells[5]),
    });
  }
  const intro = strip((html.match(/<div class="hero">[\s\S]*?<p>([\s\S]*?)<\/p>/) || [])[1] || "");
  return { intro, rows };
}

export function syncHub({ root, contentDir, courses, base, engine }) {
  const pub = path.join(root, "public");
  const hub = path.join(contentDir, "science-teacher-hub");
  const errors = [];
  const repoSet = new Set(courses.map((c) => c.repo));
  const notes = [];

  /* 1. 교사 화면·학생 기록 */
  for (const name of ["class", "records"]) {
    const override = path.join(root, "legacy", "hub", name, "index.html");
    const src = fs.existsSync(override) ? override : path.join(hub, name, "index.html");
    if (!fs.existsSync(src)) {
      errors.push(`${name}/index.html 이 없습니다: ${src}`);
      continue;
    }
    notes.push(`${name}/ ← ${fs.existsSync(override) ? "legacy/hub(임시 사본)" : "science-teacher-hub main"}`);
    const html = rewriteHubPage(fs.readFileSync(src, "utf8"), { base, engine, repoSet, errors, name });
    mkdir(path.join(pub, name));
    fs.writeFileSync(path.join(pub, name, "index.html"), html);
  }

  /* 2. 허브용 공유 설정 */
  const sc = path.join(hub, "assets", "share-config.js");
  if (fs.existsSync(sc)) {
    fs.writeFileSync(path.join(pub, "hub-assets", "share-config.js"), patchShareConfig(fs.readFileSync(sc, "utf8"), "science-teacher-hub", (m) => errors.push(m)));
  } else errors.push("science-teacher-hub/assets/share-config.js 가 없습니다");

  /* 3. 판 경계 KML */
  const kml = path.join(hub, "maps", "plates.kml");
  mkdir(path.join(pub, "maps"));
  if (fs.existsSync(kml)) fs.copyFileSync(kml, path.join(pub, "maps", "plates.kml"));
  else errors.push("maps/plates.kml 이 없습니다");

  /* 4. phet/ → 자료실 PhET 칸 */
  mkdir(path.join(pub, "phet"));
  const to = `${base}/resources/#PhET`;
  fs.writeFileSync(
    path.join(pub, "phet", "index.html"),
    `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>PhET 더 해 보기</title><meta http-equiv="refresh" content="0; url=${to}"><link rel="canonical" href="${to}"></head><body><p>PhET 목록은 <a href="${to}">자료실</a>로 옮겼습니다.</p></body></html>\n`,
  );

  /* 5. 자료실 목록 */
  const resHtml = path.join(hub, "resources", "index.html");
  let resources = { intro: "", rows: [] };
  if (fs.existsSync(resHtml)) resources = parseResources(fs.readFileSync(resHtml, "utf8"), base);
  if (resources.rows.length < 100) errors.push(`자료실 목록이 너무 적습니다(${resources.rows.length}줄) — resources/index.html 모양이 바뀌었는지 확인`);
  fs.writeFileSync(path.join(root, "content", "resources.json"), JSON.stringify(resources));

  console.log(`허브 화면: ${notes.join(", ")} · 자료실 ${resources.rows.length}곳 · maps/plates.kml · phet/ 넘겨주기`);
  if (errors.length) {
    for (const e of errors) console.error(`  ✗ ${e}`);
    throw new Error(`허브 화면 옮기기 오류 ${errors.length}건`);
  }
}
