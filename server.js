/* ============================================================
   词海工具箱 - 服务端（Node 零依赖）
   1) 静态托管本目录（index.html / tools/ / assets/）
   2) 开放式 API：/api/<endpoint>，按 IP 限流（每日配额）
   启动：node server.js   （环境变量 PORT、API_DAILY_LIMIT 可覆盖）
   ============================================================ */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8080);
const DAILY_LIMIT = Number(process.env.API_DAILY_LIMIT || 100);
const DATA_DIR = path.join(ROOT, "data");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

/* ---------------- 限流存储（内存 + 文件持久化，按日分文件） ---------------- */
let usage = { date: today(), map: {} };

function today() { return new Date().toISOString().slice(0, 10); }

function loadUsage() {
  const d = today();
  if (usage.date !== d) { usage = { date: d, map: {} }; return; }
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, `usage-${d}.json`), "utf8"));
    if (raw.date === d) usage = raw;
  } catch (e) { /* 无文件或损坏，重新计数 */ }
}
function saveUsage() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(DATA_DIR, `usage-${usage.date}.json`), JSON.stringify(usage));
  } catch (e) { /* 磁盘异常不影响主流程 */ }
}
function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  return (xf ? xf.split(",")[0].trim() : "") || req.socket.remoteAddress || "unknown";
}

/* ---------------- 工具函数 ---------------- */
function json(res, code, obj, extra) {
  const body = JSON.stringify(obj);
  res.writeHead(code, Object.assign({
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  }, extra || {}));
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", c => { data += c; if (data.length > 1024 * 512) req.destroy(); });
    req.on("end", () => resolve(data));
  });
}

/* ---------------- API 端点 ---------------- */
const API = {
  /* GET /api/md5?text=xxx → 32/16 位大小写 */
  md5(q) {
    const text = q.text ?? "";
    const hex = crypto.createHash("md5").update(text, "utf8").digest("hex");
    return { text, md5: hex, md5_16: hex.slice(8, 24) };
  },
  /* GET /api/sha256?text=xxx（另支持 sha1/sha512） */
  sha256(q) {
    const text = q.text ?? "";
    const alg = ["sha1", "sha256", "sha512"].includes(q.alg) ? q.alg : "sha256";
    return { text, alg, hash: crypto.createHash(alg).update(text, "utf8").digest("hex") };
  },
  /* GET /api/base64?text=xxx&mode=encode|decode */
  base64(q) {
    const text = q.text ?? "";
    if ((q.mode || "encode") === "decode") {
      return { mode: "decode", result: Buffer.from(text, "base64").toString("utf8") };
    }
    return { mode: "encode", result: Buffer.from(text, "utf8").toString("base64") };
  },
  /* GET /api/url?text=xxx&mode=encode|decode */
  url(q) {
    const text = q.text ?? "";
    if ((q.mode || "encode") === "decode") {
      return { mode: "decode", result: decodeURIComponent(text) };
    }
    return { mode: "encode", result: encodeURIComponent(text) };
  },
  /* GET /api/timestamp?ts=1695456000（缺省取当前时间） */
  timestamp(q) {
    const ts = q.ts ? Number(q.ts) : Math.floor(Date.now() / 1000);
    if (!Number.isFinite(ts)) throw new Error("ts 必须是数字（秒级或毫秒级时间戳）");
    const ms = ts > 1e12 ? ts : ts * 1000;
    const d = new Date(ms);
    if (isNaN(d.getTime())) throw new Error("无效的时间戳");
    const p = n => String(n).padStart(2, "0");
    return {
      timestamp: ts,
      datetime: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`,
      iso: d.toISOString(),
      weekday: "日一二三四五六"[d.getDay()],
    };
  },
  /* GET /api/uuid?n=5（1-50 个，v4） */
  uuid(q) {
    const n = Math.min(Math.max(Number(q.n) || 1, 1), 50);
    return { n, list: Array.from({ length: n }, () => crypto.randomUUID()) };
  },
};

/* ---------------- SEO：sitemap（扫描 tools/ 自动生成，目录变化自动重建） ---------------- */
const HOST = "https://tools.hdemba.cn";
let sitemapCache = { dirMtime: 0, xml: "" };
function buildSitemap() {
  const dir = path.join(ROOT, "tools");
  const dmtime = fs.statSync(dir).mtimeMs;
  if (sitemapCache.dirMtime === dmtime) return sitemapCache.xml;
  const files = ["index.html", ...fs.readdirSync(dir).filter(f => f.endsWith(".html")).sort().map(f => `tools/${f}`)];
  const items = files.map(f => {
    const lastmod = new Date(fs.statSync(path.join(ROOT, f)).mtimeMs).toISOString().slice(0, 10);
    const loc = f === "index.html" ? `${HOST}/` : `${HOST}/${f}`;
    return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
  });
  sitemapCache = {
    dirMtime: dmtime,
    xml: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join("\n")}\n</urlset>\n`,
  };
  return sitemapCache.xml;
}

/* ---------------- 主服务 ---------------- */
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  /* CORS 预检 */
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  /* ---- API ---- */
  if (u.pathname.startsWith("/api/")) {
    const name = u.pathname.slice(5).replace(/\/+$/, "");
    if (!API[name]) return json(res, 404, { ok: false, error: `未知接口 /api/${name}，可用：${Object.keys(API).join(", ")}` });

    loadUsage();
    const ip = clientIp(req);
    const used = usage.map[ip] || 0;
    const headers = {
      "X-RateLimit-Limit": String(DAILY_LIMIT),
      "X-RateLimit-Remaining": String(Math.max(DAILY_LIMIT - used - 1, 0)),
      "X-RateLimit-Reset": usage.date + "T23:59:59+08:00",
    };
    if (used >= DAILY_LIMIT) {
      return json(res, 429, { ok: false, error: `今日调用次数已达上限（${DAILY_LIMIT} 次/天），明日 0 点重置` }, headers);
    }
    usage.map[ip] = used + 1;
    saveUsage();

    try {
      const q = Object.fromEntries(u.searchParams);
      if (req.method === "POST") {
        const body = await readBody(req);
        try { Object.assign(q, JSON.parse(body || "{}")); } catch (e) { /* 忽略非 JSON body */ }
      }
      const data = API[name](q);
      return json(res, 200, { ok: true, data }, headers);
    } catch (e) {
      return json(res, 400, { ok: false, error: e.message }, headers);
    }
  }

  /* ---- SEO 路由 ---- */
  if (u.pathname === "/robots.txt") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" });
    return res.end(`User-agent: *\nAllow: /\nSitemap: ${HOST}/sitemap.xml\n`);
  }
  if (u.pathname === "/sitemap.xml") {
    res.writeHead(200, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-cache" });
    return res.end(buildSitemap());
  }

  /* ---- 静态文件 ---- */
  let fp = decodeURIComponent(u.pathname);
  if (fp.endsWith("/")) fp += "index.html";
  const file = path.normalize(path.join(ROOT, fp));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("404 Not Found"); }
    const etag = `W/"${stat.size}-${Math.floor(stat.mtimeMs)}"`;
    if (req.headers["if-none-match"] === etag) {
      res.writeHead(304, { ETag: etag });
      return res.end();
    }
    fs.readFile(file, (err2, buf) => {
      if (err2) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("404 Not Found"); }
      res.writeHead(200, {
        "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
        /* assets 带 ?v= 版本号可长缓存；HTML 等其余内容保持 no-cache（靠 ETag 协商 304） */
        "Cache-Control": fp.startsWith("/assets/") ? "public, max-age=2592000" : "no-cache",
        ETag: etag,
      });
      res.end(buf);
    });
  });
});

loadUsage();
server.listen(PORT, () => {
  console.log(`词海工具箱已启动: http://localhost:${PORT}`);
  console.log(`开放API: /api/${Object.keys(API).join(" | /api/")}  （每 IP 每日 ${DAILY_LIMIT} 次）`);
});
