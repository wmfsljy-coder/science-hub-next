#!/usr/bin/env node
/* 빌드 결과(out/)를 GitHub Pages 처럼 /science-hub-next/ 아래에서 보여 주는 아주 작은 서버.
 * 사용: node scripts/serve-out.mjs [포트=4173]  → http://localhost:4173/science-hub-next/ */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "out");
const BASE = "/science-hub-next";
const PORT = Number(process.argv[2] || 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

http
  .createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p === "/") {
      res.writeHead(302, { Location: BASE + "/" });
      return res.end();
    }
    if (!p.startsWith(BASE)) {
      res.writeHead(404);
      return res.end("not found");
    }
    p = p.slice(BASE.length) || "/";
    let file = path.join(ROOT, p);
    if (!file.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end();
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file) && fs.existsSync(file + ".html")) file += ".html";
    if (!fs.existsSync(file)) {
      res.writeHead(404, { "Content-Type": TYPES[".html"] });
      return res.end(fs.existsSync(path.join(ROOT, "404.html")) ? fs.readFileSync(path.join(ROOT, "404.html")) : "not found");
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`http://localhost:${PORT}${BASE}/`));
