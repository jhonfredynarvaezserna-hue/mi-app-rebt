// Servidor local para probar J.F en tu PC (npm start)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
// Sirve la carpeta public si existe; si no, la raíz
const WEB = fs.existsSync(path.join(DIR, 'public')) ? path.join(DIR, 'public') : DIR;
const PORT = process.env.PORT || 8080;

// Lee GEMINI_API_KEY del archivo .env (sin instalar nada)
try {
  for (const linea of fs.readFileSync(path.join(DIR, '.env'), 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch (e) { /* sin .env */ }

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.cad': 'application/octet-stream'
};

async function api(req, res) {
  let datos = '';
  for await (const trozo of req) datos += trozo;
  try { req.body = datos ? JSON.parse(datos) : {}; } catch { req.body = {}; }
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
  const { default: handler } = await import(pathToFileURL(path.join(DIR, 'api', 'chat.js')).href);
  await handler(req, res);
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/chat') return await api(req, res);

    let ruta = decodeURIComponent(url.pathname);
    if (ruta === '/') ruta = '/index.html';
    const archivo = path.join(WEB, ruta);
    const rel = path.relative(WEB, archivo);
    const privado = rel.startsWith('..') || rel.split(path.sep).some(p => p.startsWith('.')) ||
                    (WEB === DIR && (rel.startsWith('api') || ['server.js', 'package.json', 'package-lock.json'].includes(rel)));
    if (privado || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) {
      res.statusCode = 404; return res.end('No encontrado');
    }
    res.setHeader('Content-Type', TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream');
    fs.createReadStream(archivo).pipe(res);
  } catch (e) {
    console.error(e); res.statusCode = 500; res.end('Error interno');
  }
}).listen(PORT, () => console.log(`J.F listo en http://localhost:${PORT}`));
