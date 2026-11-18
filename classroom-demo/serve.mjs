import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const port = Number(process.env.PANTRI_DEMO_PORT ?? 5173);
const html = new URL('PANTRI_Final.html', import.meta.url);

createServer(async (request, response) => {
  if (request.method !== 'GET' || !['/', '/PANTRI_Final.html'].includes(request.url)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const source = await readFile(html);
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    }).end(source);
  } catch {
    response.writeHead(500).end('Build PANTRI_Final.html before starting the demo.');
  }
}).listen(port, '127.0.0.1', () => console.log('PANTRI demo at http://127.0.0.1:' + port));
