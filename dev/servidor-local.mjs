// Servidor local para testar o site + a API sem precisar da Vercel.
// Uso: npm run dev   → abre em http://localhost:3000
// Serve a pasta site/ e manda /api/<nome> para a função api/<nome>.js (o mesmo formato da Vercel).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, dirname, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORTA = Number(process.env.PORT) || 3000;
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORTA}`);
  try {
    const api = url.pathname.match(/^\/api\/([a-z0-9-]+)\/?$/);
    if (api) {
      const mod = await import(pathToFileURL(join(RAIZ, "api", api[1] + ".js")).href).catch(() => null);
      const fn = mod && mod[req.method];
      if (!fn) { res.writeHead(mod ? 405 : 404).end(); return; }
      const corpo = ["GET", "HEAD"].includes(req.method) ? undefined : await new Promise(ok => { const p = []; req.on("data", c => p.push(c)); req.on("end", () => ok(Buffer.concat(p))); });
      const r = await fn(new Request(url, { method: req.method, headers: req.headers, body: corpo }));
      res.writeHead(r.status, Object.fromEntries(r.headers)).end(Buffer.from(await r.arrayBuffer()));
    } else {
      const arq = normalize(join(RAIZ, "site", url.pathname === "/" ? "index.html" : url.pathname));
      if (!arq.startsWith(join(RAIZ, "site"))) { res.writeHead(403).end(); return; }
      const dados = await readFile(arq);
      res.writeHead(200, { "content-type": TIPOS[extname(arq)] || "application/octet-stream" }).end(dados);
    }
  } catch (e) {
    res.writeHead(e.code === "ENOENT" ? 404 : 500).end(e.code === "ENOENT" ? "Não encontrado" : "Erro");
    if (e.code !== "ENOENT") console.error(e);
  }
  console.log(req.method, url.pathname, res.statusCode);
}).listen(PORTA, () => console.log(`Site + API em http://localhost:${PORTA}  (Ctrl+C para parar)`));
