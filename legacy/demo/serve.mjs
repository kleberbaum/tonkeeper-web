/*
 * DEV-ONLY static server for previewing the prebuilt legacy TWA bundle in a
 * normal browser. Serves legacy/twa-3.20.2/ as-is, but injects the Telegram
 * mock (tg-mock.js) into index.html so the Mini App can boot outside Telegram.
 *
 *   node legacy/demo/serve.mjs        # -> http://localhost:8788
 *
 * The committed bundle stays pristine; the mock is injected on the fly.
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..', 'twa-3.20.2');
const MOCK = join(__dirname, 'tg-mock.js');
const PORT = process.env.PORT ? Number(process.env.PORT) : 8788;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8'
};

async function sendIndex(res) {
    let html = await readFile(join(ROOT, 'index.html'), 'utf8');
    // Inject the mock as the first script in <head> so it runs before the
    // app's (deferred) module bundle reads launch params.
    html = html.replace(/<head>/i, '<head>\n    <script src="/__tg-mock.js"></script>');
    res.writeHead(200, { 'content-type': MIME['.html'] });
    res.end(html);
}

const server = http.createServer(async (req, res) => {
    try {
        const url = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);

        if (url === '/__tg-mock.js') {
            const body = await readFile(MOCK);
            res.writeHead(200, { 'content-type': MIME['.js'] });
            return res.end(body);
        }

        if (url === '/' || url === '/index.html') {
            return await sendIndex(res);
        }

        // Static asset
        const safe = normalize(url).replace(/^(\.\.[/\\])+/, '');
        const filePath = join(ROOT, safe);
        if (!filePath.startsWith(ROOT)) {
            res.writeHead(403);
            return res.end('Forbidden');
        }
        try {
            const body = await readFile(filePath);
            const type = MIME[extname(filePath)] || 'application/octet-stream';
            res.writeHead(200, { 'content-type': type });
            return res.end(body);
        } catch {
            // SPA fallback: serve index for unknown routes.
            return await sendIndex(res);
        }
    } catch (e) {
        res.writeHead(500);
        res.end(String(e));
    }
});

server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`\n  Legacy TWA 3.20.2 preview:  http://localhost:${PORT}\n`);
});
