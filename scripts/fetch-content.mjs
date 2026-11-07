#!/usr/bin/env node
/*
 * 단원 내용 모으기 (빌드 전에 한 번 실행)
 *
 * - 내용 폴더: 환경 변수 CONTENT_DIR. 없으면 이 프로젝트의 상위 폴더(과학허브)를 씁니다.
 * - `--clone` 을 붙이면 공개 과목 저장소를 CONTENT_DIR 안에 얕게(--depth 1) 받아 옵니다. (GitHub Actions 에서 사용)
 * - 결과: content/generated.json (단원 정보 + 지도안 원문), public/thumbs/*.webp (작은 대표 그림)
 * - 끝에 scripts/sync-units.mjs 로 단원 화면(엔진·자료·그림)을 public/u/, public/engine/, public/hub-assets/ 에 옮겨 담습니다.
 *
 * 과목 저장소의 파일은 읽기만 하고 절대 고치지 않습니다.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { syncUnits } from "./sync-units.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OWNER = "wmfsljy-coder";
const PAGES = `https://${OWNER}.github.io`;
const BASE = "/science-hub-next"; /* next.config.ts 의 basePath 와 같아야 합니다 */
const courses = JSON.parse(fs.readFileSync(path.join(ROOT, "lib", "courses.json"), "utf8"));

const contentDir = path.resolve(ROOT, process.env.CONTENT_DIR || "..");
const doClone = process.argv.includes("--clone");

if (doClone) {
  fs.mkdirSync(contentDir, { recursive: true });
  /* 과목 저장소 + 엔진이 부르는 허브 자료(review-*.js 등)가 있는 science-teacher-hub */
  for (const c of [...courses, { repo: "science-teacher-hub" }]) {
    const dest = path.join(contentDir, c.repo);
    if (fs.existsSync(path.join(dest, "index.html"))) continue;
    console.log(`받는 중: ${c.repo}`);
    execFileSync("git", ["clone", "--depth", "1", `https://github.com/${OWNER}/${c.repo}.git`, dest], { stdio: "inherit" });
  }
}

/* ---------- 작은 도우미 ---------- */
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "");
const strip = (html) =>
  html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
const num = (s, re) => {
  const m = s.match(re);
  return m ? Number(m[1]) : null;
};

/* 과목 첫 화면(index.html)에서 단원 카드 읽기 */
function parseCourseIndex(html) {
  const desc = strip((html.match(/<div class="hero">[\s\S]*?<p>([\s\S]*?)<\/p>/) || [])[1] || "")
    .replace(/\s*아래에서 학습할 (?:대)?단원을 선택하세요\.?\s*$/, "")
    .trim();
  const marks = [];
  for (const m of html.matchAll(/<div class="part-(?:label|heading)">([\s\S]*?)<\/div>/g)) {
    marks.push({ at: m.index, part: strip(m[1]) });
  }
  const cards = {};
  for (const m of html.matchAll(/<a class="unit-card[^"]*" href="([^"]+)">([\s\S]*?)<\/a>/g)) {
    const slug = m[1].replace(/\/$/, "");
    const body = m[2];
    const part = marks.filter((x) => x.at < m.index).pop()?.part || "";
    cards[slug] = {
      chapter: strip((body.match(/<div class="chapter">([\s\S]*?)<\/div>/) || [])[1] || ""),
      title: strip((body.match(/<h3[^>]*>([\s\S]*?)<\/h3>/) || [])[1] || ""),
      summary: strip((body.match(/<p>([\s\S]*?)<\/p>/) || [])[1] || ""),
      topics: [...((body.match(/<div class="topics">([\s\S]*?)<\/div>/) || [])[1] || "").matchAll(/<span>([\s\S]*?)<\/span>/g)].map((t) => strip(t[1])),
      part,
    };
  }
  return { desc, cards };
}

/* 지도안(LESSON.md) 읽기 */
function parseLesson(md) {
  const lines = md.split(/\r?\n/);
  const h1 = (lines.find((l) => l.startsWith("# ")) || "").replace(/^#\s*/, "");
  const make = md.match(/- 구성:\s*(.+)/)?.[1] || "";
  const counts = {
    stories: num(make, /이야기\s*(\d+)\s*편/),
    quiz: num(make, /수준별 문제\s*(\d+)\s*문항/),
    labs: num(make, /응용 실험실\s*(\d+)\s*사례/),
    real: num(make, /실제 자료\s*(\d+)\s*사례/),
  };
  const standards = [];
  for (const m of md.matchAll(/^- \*\*\[([^\]]+)\]\*\*\s*(.+)$/gm)) {
    if (!standards.some((s) => s.code === m[1])) standards.push({ code: m[1], text: m[2].trim() });
  }
  const periods = [];
  const re = /^## (\d+)차시\s*[—-]\s*(.+?)\s*(?:\(([^)]*)\))?\s*$/gm;
  for (const m of md.matchAll(re)) {
    const after = md.slice(m.index, m.index + 600);
    const terms = (after.match(/- 핵심 용어:\s*(.+)/)?.[1] || "").split(/\s*,\s*/).filter(Boolean);
    periods.push({ n: Number(m[1]), title: m[2].trim(), topic: (m[3] || "").replace(/^\d+\s*·\s*/, "").trim(), terms });
  }
  /* 화면에 보일 본문: 맨 위 제목과 '이 파일은 … 만든 것입니다' 안내 줄은 뺍니다 */
  const body = lines
    .filter((l, i) => !(i < 5 && (l.startsWith("# ") || /^>\s*이 파일은/.test(l))))
    .join("\n")
    .trim();
  return { h1, counts, standards, periods, body };
}

/* 단원 화면의 탭 순서 → 수업 흐름 */
const FIXED = ["수준별 문제", "응용 실험실", "실제 자료", "정리하기", "우리 반", "교과서 실험"];
function parseFlow(html, hasPre, hasReal) {
  const tabs = [...html.matchAll(/<button class="tab-btn[^"]*"[^>]*>([\s\S]*?)<\/button>/g)]
    .map((m) => strip(m[1]).replace(/^\d+\s*/, ""))
    .filter(Boolean);
  const flow = tabs.map((label) => ({ label, kind: FIXED.includes(label) ? "step" : "story" }));
  if (hasReal && !tabs.includes("실제 자료")) {
    const i = flow.findIndex((f) => f.label === "응용 실험실");
    flow.splice(i >= 0 ? i + 1 : flow.length, 0, { label: "실제 자료", kind: "step" });
  }
  if (hasPre) flow.unshift({ label: "들어가기", kind: "intro" });
  return flow;
}

/* ---------- 모으기 ---------- */
let sharp = null;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn("sharp 를 불러오지 못해 대표 그림은 원래 주소로 연결합니다.");
}
const thumbDir = path.join(ROOT, "public", "thumbs");
fs.mkdirSync(thumbDir, { recursive: true });

const out = { generatedAt: new Date().toISOString(), courses: [] };
let unitTotal = 0;

for (const c of courses) {
  const dir = path.join(contentDir, c.repo);
  if (!fs.existsSync(dir)) {
    console.error(`과목 폴더가 없습니다: ${dir}  (CONTENT_DIR 을 확인하거나 --clone 을 붙이세요)`);
    process.exit(1);
  }
  const { desc, cards } = parseCourseIndex(read(path.join(dir, "index.html")));
  const slugs = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d/.test(d.name) && fs.existsSync(path.join(dir, d.name, "index.html")))
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

  const units = [];
  for (const slug of slugs) {
    const ud = path.join(dir, slug);
    const html = read(path.join(ud, "index.html"));
    const lesson = parseLesson(read(path.join(ud, "LESSON.md")));
    const card = cards[slug] || {};
    const h1 = strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || "");
    const titleTag = strip((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "").replace(/\s*—.*$/, "");
    const title = card.title || h1 || titleTag;
    const chapter = card.chapter || (lesson.h1.match(/\s([ⅠⅡⅢⅣⅤ](?:-\d+)?)\s/) || [])[1] || slug;

    const pre = read(path.join(ud, "precheck-items.js"));
    const hasReal = fs.existsSync(path.join(ud, "real-cases.js"));
    const flow = parseFlow(html, !!pre, hasReal);

    /* 대표 그림: 단원 화면에 처음 나오는 img/ 그림 */
    const im = html.match(/<img src="(img\/[^"]+)"[^>]*?alt="([^"]*)"/);
    const id = `${c.repo}--${slug}`;
    let thumb = null;
    let thumbAlt = "";
    if (im) {
      thumbAlt = strip(im[2]);
      const src = path.join(ud, im[1]);
      const liveSrc = `${PAGES}/${c.repo}/${slug}/${im[1]}`;
      thumb = liveSrc;
      if (sharp && fs.existsSync(src)) {
        const dest = path.join(thumbDir, `${id}.webp`);
        try {
          await sharp(src).resize(480, 480, { fit: "cover" }).webp({ quality: 68 }).toFile(dest);
          thumb = `/thumbs/${id}.webp`;
        } catch (e) {
          console.warn(`그림 줄이기 실패(${id}): ${e.message}`);
        }
      }
    }

    units.push({
      id,
      repo: c.repo,
      slug,
      chapter,
      title,
      part: card.part || "",
      summary: card.summary || "",
      topics: card.topics || [],
      /* 학생 주소(QR): 이 사이트 안 단원 화면. oldUrl 은 예전 과목 저장소 주소 */
      url: `${PAGES}${BASE}/u/${c.repo}/${slug}/`,
      play: `${BASE}/u/${c.repo}/${slug}/`,
      oldUrl: `${PAGES}/${c.repo}/${slug}/`,
      thumb,
      thumbAlt,
      counts: { ...lesson.counts, precheck: (pre.match(/\{\s*id:\s*"p/g) || []).length || null },
      standards: lesson.standards,
      periods: lesson.periods,
      flow,
      lesson: lesson.body,
    });
  }
  unitTotal += units.length;
  out.courses.push({ ...c, description: desc, url: `${PAGES}/${c.repo}/`, units });
  console.log(`${c.name}: ${units.length}개 단원`);
}

fs.mkdirSync(path.join(ROOT, "content"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "content", "generated.json"), JSON.stringify(out, null, 1));
console.log(`완료: 과목 ${out.courses.length}개, 단원 ${unitTotal}개 → content/generated.json`);

/* 단원 화면 옮겨 담기 */
syncUnits({ root: ROOT, contentDir, courses, base: BASE });
