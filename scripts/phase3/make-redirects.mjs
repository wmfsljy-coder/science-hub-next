#!/usr/bin/env node
/*
 * 3단계(옛 주소 넘겨주기) 준비 스크립트 — 아직 돌리지 않습니다. 설계: 문서/3단계-넘겨주기-설계.md
 *
 * 옛 저장소(과목 12 + science-teacher-hub + 껍데기 4)의 index.html 을 '새 주소로 넘겨주기' 한 장으로 바꿉니다.
 * 주소 뒤 ?sec=02 · ?open=1 · ?all=1 · #… 는 그대로 붙여 넘깁니다(인쇄해 둔 QR 이 계속 동작).
 * 자료 파일(js·img·data·assets)은 지우지 않습니다 — 캐시된 페이지·바깥 링크용으로 한 학기 남김.
 *
 *   node scripts/phase3/make-redirects.mjs                     미리 보기: 바꿀 파일 목록만 출력(아무것도 안 씀)
 *   node scripts/phase3/make-redirects.mjs --apply             옛 저장소 작업 폴더에 씀(커밋·푸시는 사람이 함)
 *   node scripts/phase3/make-redirects.mjs --undo              --apply 로 바꾼 파일을 git 으로 되돌림(커밋 전)
 *   --dir <과학허브 폴더>  (기본: 이 저장소의 상위 폴더)
 *
 * --apply 전에 저장소마다 `git tag pre-redirect` 를 걸어 두면, 푸시한 뒤에도
 * `git checkout pre-redirect -- .` + 커밋·푸시로 1분 안에 되돌릴 수 있습니다.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const DIR = path.resolve(args.includes("--dir") ? args[args.indexOf("--dir") + 1] : path.join(ROOT, ".."));
const APPLY = args.includes("--apply");
const UNDO = args.includes("--undo");
const SITE = "https://wmfsljy-coder.github.io";
const NEW = "/science-hub-next-ywarpe";

const courses = JSON.parse(fs.readFileSync(path.join(ROOT, "lib", "courses.json"), "utf8"));
/* 옛 과목 묶음 껍데기 → 새 첫 화면(과목군 거르기는 첫 화면에서) */
const SHELLS = ["integrated-science", "earth-system", "planet-space", "science-inquiry"];
/* 옛 허브 화면 → 새 화면 */
const HUB = { "": "/", "class/": "/class/", "records/": "/records/", "resources/": "/resources/", "qr/": "/qr/", "maps/": "/maps/", "phet/": "/resources/#PhET" };

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function page(target, title) {
  const [p, h] = target.split("#");
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>새 주소로 옮겼어요 — ${esc(title)}</title>
<link rel="canonical" href="${SITE}${esc(target)}">
<script>
/* science-hub-next 3단계: 옛 주소 → 새 주소. 주소 뒤 ?sec= · ?open= · ?all= · # 를 그대로 붙임 */
(function () { var t = ${JSON.stringify(p)}, h = ${JSON.stringify(h ? "#" + h : "")}; location.replace(t + location.search + (location.hash || h)); })();
</script>
<noscript><meta http-equiv="refresh" content="0; url=${esc(target)}"></noscript>
<style>body{font:18px/1.6 system-ui,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#f8fafc;color:#0f172a}a{color:#0f766e;font-weight:700}</style>
</head>
<body>
<p>이 화면은 새 주소로 옮겼어요. <a href="${esc(target)}">${esc(title)} 열기</a></p>
</body>
</html>
`;
}

const plan = []; /* [저장소, 파일, 새 주소, 제목] */
for (const c of courses) {
  const rd = path.join(DIR, c.repo);
  if (!fs.existsSync(rd)) continue;
  plan.push([c.repo, "index.html", `${NEW}/c/${c.repo}/`, c.name]);
  for (const d of fs.readdirSync(rd, { withFileTypes: true })) {
    if (d.isDirectory() && /^\d/.test(d.name) && fs.existsSync(path.join(rd, d.name, "index.html"))) {
      plan.push([c.repo, `${d.name}/index.html`, `${NEW}/u/${c.repo}/${d.name}/`, `${c.name} ${d.name}`]);
    }
  }
}
for (const s of SHELLS) if (fs.existsSync(path.join(DIR, s, "index.html"))) plan.push([s, "index.html", `${NEW}/`, "과학 수업 허브"]);
for (const [from, to] of Object.entries(HUB)) {
  const f = path.join(DIR, "science-teacher-hub", from, "index.html");
  if (fs.existsSync(f)) plan.push(["science-teacher-hub", `${from}index.html`, `${NEW}${to}`, from ? `허브 ${from.replace("/", "")}` : "과학 수업 허브"]);
}

if (UNDO) {
  for (const repo of new Set(plan.map((p) => p[0]))) {
    const files = plan.filter((p) => p[0] === repo).map((p) => p[1]);
    execFileSync("git", ["-C", path.join(DIR, repo), "checkout", "--", ...files], { stdio: "inherit" });
    console.log(`되돌림: ${repo} (${files.length}개)`);
  }
  process.exit(0);
}

for (const [repo, file, target, title] of plan) {
  const fp = path.join(DIR, repo, file);
  if (APPLY) fs.writeFileSync(fp, page(target, title));
  console.log(`${APPLY ? "씀" : "바꿀 예정"}  /${repo}/${file.replace(/index\.html$/, "")}  →  ${target}`);
}
console.log(`\n${plan.length}개 페이지 ${APPLY ? "바꿈(커밋·푸시는 저장소마다 직접)" : "— 미리 보기만 했습니다. 실제로 쓰려면 --apply"}`);
