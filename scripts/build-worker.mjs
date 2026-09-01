import { mkdir, writeFile } from 'node:fs/promises';

const worker = `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let response = await env.ASSETS.fetch(request);

    if (request.method === 'GET' && response.status === 404 && !url.pathname.startsWith('/api/')) {
      const indexUrl = new URL('/index.html', url);
      response = await env.ASSETS.fetch(new Request(indexUrl, request));
    }

    return response;
  },
};
`;

await mkdir(new URL('../dist/server/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/server/index.js', import.meta.url), worker);
