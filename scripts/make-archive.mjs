#!/usr/bin/env node
/*
 * science-hub-next 는 보관용입니다. 정식 주소는 https://wmfsljy-coder.github.io/science-teacher-hub/ (소스: science-teacher-hub/site/).
 * 이 스크립트는 예전 science-hub-next 주소로 들어온 사람을 정식 주소로 넘겨주는 작은 페이지들만 out/ 에 만듭니다.
 * 주소 뒤 ?sec= · ?open= · ?all= · # 는 그대로 붙여 넘깁니다.
 *
 *   /science-hub-next/                         → /science-teacher-hub/
 *   /science-hub-next/c/<저장소>/              → /science-teacher-hub/c/<저장소>/
 *   /science-hub-next/u/<저장소>/<단원>/       → /<저장소>/<단원>/            (정식 단원 주소)
 *   /science-hub-next/u/<저장소>/<단원>/plan/  → /science-teacher-hub/u/<저장소>/<단원>/plan/
 *   /science-hub-next/u/<저장소>/              → /science-teacher-hub/c/<저장소>/
 *   /science-hub-next/resources/ · qr/ · maps/ · class/ · records/ → /science-teacher-hub/ 의 같은 화면, phet/ → 자료실 PhET 칸
 *   그 밖의 주소(404.html)                     → 같은 규칙으로 계산, 모르면 /science-teacher-hub/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "out");
const HUB = "/science-teacher-hub";
const list = JSON.parse(fs.readFileSync(path.join(ROOT, "archive", "units.json"), "utf8"));

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const page = (target) => {
  const [p, h] = target.split("#");
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>과학 수업 허브로 이동</title><link rel="canonical" href="https://wmfsljy-coder.github.io${esc(target)}"><script>location.replace(${JSON.stringify(p)} + location.search + (location.hash || ${JSON.stringify(h ? "#" + h : "")}))</script><noscript><meta http-equiv="refresh" content="0; url=${esc(target)}"></noscript></head><body style="font:18px/1.6 system-ui,sans-serif;padding:2rem"><p>과학 수업 허브는 <a href="${esc(target)}">새 주소</a>에서 열립니다.</p></body></html>\n`;
};
const write = (rel, target) => {
  const f = path.join(OUT, rel, "index.html");
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, page(target));
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let n = 0;
write("", `${HUB}/`), n++;
for (const p of ["resources", "qr", "maps", "class", "records"]) write(p, `${HUB}/${p}/`), n++;
write("phet", `${HUB}/resources/#PhET`), n++;
for (const c of list) {
  write(`c/${c.repo}`, `${HUB}/c/${c.repo}/`), n++;
  write(`u/${c.repo}`, `${HUB}/c/${c.repo}/`), n++;
  for (const u of c.units) {
    write(`u/${c.repo}/${u}`, `/${c.repo}/${u}/`), n++;
    write(`u/${c.repo}/${u}/plan`, `${HUB}/u/${c.repo}/${u}/plan/`), n++;
  }
}
/* 모르는 주소: 같은 규칙을 화면에서 계산 */
fs.writeFileSync(
  path.join(OUT, "404.html"),
  `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>과학 수업 허브로 이동</title><script>
(function () {
  var p = location.pathname.replace(/^\\/science-hub-next/, ""), m, t = "${HUB}/";
  if ((m = /^\\/u\\/([\\w-]+)\\/([\\w-]+)\\/plan\\//.exec(p))) t = "${HUB}/u/" + m[1] + "/" + m[2] + "/plan/";
  else if ((m = /^\\/u\\/([\\w-]+)\\/([\\w-]+)\\//.exec(p))) t = "/" + m[1] + "/" + m[2] + "/";
  else if ((m = /^\\/(?:u|c)\\/([\\w-]+)/.exec(p))) t = "${HUB}/c/" + m[1] + "/";
  else if ((m = /^\\/(resources|qr|maps|class|records)\\b/.exec(p))) t = "${HUB}/" + m[1] + "/";
  else if (/^\\/phet\\b/.test(p)) t = "${HUB}/resources/#PhET";
  location.replace(t + location.search + (t.indexOf("#") < 0 ? location.hash : ""));
})();
</script></head><body><p>과학 수업 허브는 <a href="${HUB}/">새 주소</a>에서 열립니다.</p></body></html>\n`,
);
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
console.log(`넘겨주기 페이지 ${n}개 + 404.html → out/`);
