import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import express from 'express';
import type { ViteDevServer } from 'vite';

type ServerEntry = typeof import('./src/entry-server');

const root = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? 5173);
const app = express();

let vite: ViteDevServer | undefined;

if (isProduction) {
  app.use(
    express.static(path.resolve(root, 'dist/client'), { index: false })
  );
} else {
  const { createServer } = await import('vite');
  vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);
}

const users = [
  { id: 1, name: 'Ada Lovelace', role: 'Mathematician' },
  { id: 2, name: 'Grace Hopper', role: 'Computer scientist' },
  { id: 3, name: 'Margaret Hamilton', role: 'Software engineer' },
];

app.get('/api/users', async (_request, response) => {
  await new Promise((resolve) => setTimeout(resolve, 250));
  response.json(users);
});

app.get('/api/stats', async (_request, response) => {
  await new Promise((resolve) => setTimeout(resolve, 350));
  response.json({ projects: 12, requestsToday: 1842, successRate: '99.8%' });
});

app.get('/api/activity', async (_request, response) => {
  await new Promise((resolve) => setTimeout(resolve, 180));
  response.json([
    { id: 1, message: 'Production deployment completed' },
    { id: 2, message: 'New project created' },
    { id: 3, message: 'API latency returned to normal' },
  ]);
});

app.use(async (request, response, next) => {
  try {
    const templatePath = isProduction
      ? path.resolve(root, 'dist/client/index.html')
      : path.resolve(root, 'index.html');
    let template = await fs.readFile(templatePath, 'utf8');

    let serverEntry: ServerEntry;
    if (isProduction) {
      const serverEntryUrl = pathToFileURL(
        path.resolve(root, 'dist/server/entry-server.js')
      ).href;
      serverEntry = (await import(serverEntryUrl)) as ServerEntry;
    } else {
      template = await vite!.transformIndexHtml(request.originalUrl, template);
      serverEntry = (await vite!.ssrLoadModule(
        '/src/entry-server.tsx'
      )) as ServerEntry;
    }

    const internalOrigin = `http://127.0.0.1:${port}`;
    const { appHtml, preloadedState } = await serverEntry.render(
      request.path,
      internalOrigin
    );
    const serializedState = JSON.stringify(preloadedState).replace(
      /[<\u2028\u2029]/g,
      (character) =>
        ({ '<': '\\u003c', '\u2028': '\\u2028', '\u2029': '\\u2029' })[
          character
        ]!
    );

    const html = template
      .replace('<!--app-html-->', appHtml)
      .replace(
        '<!--preloaded-state-->',
        `<script>window.__PRELOADED_STATE__=${serializedState}</script>`
      );

    response.status(200).type('html').send(html);
  } catch (error) {
    vite?.ssrFixStacktrace(error as Error);
    next(error);
  }
});

app.listen(port, () => {
  console.log(`Two-pass renderToString SSR running at http://localhost:${port}`);
});
