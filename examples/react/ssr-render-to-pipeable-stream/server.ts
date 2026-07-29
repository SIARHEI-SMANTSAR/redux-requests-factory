import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import express from 'express';
import type { ViteDevServer } from 'vite';

type ServerEntry = typeof import('./src/entry-server');
type RenderAssets = import('./src/Document').RenderAssets;
type ViteManifest = Record<
  string,
  {
    css?: string[];
    file: string;
    isEntry?: boolean;
  }
>;

const root = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? 5173);
const app = express();

let vite: ViteDevServer | undefined;
let assets: RenderAssets;

if (isProduction) {
  app.use(express.static(path.resolve(root, 'dist/client'), { index: false }));

  const manifest = JSON.parse(
    await fs.readFile(
      path.resolve(root, 'dist/client/.vite/manifest.json'),
      'utf8'
    )
  ) as ViteManifest;
  const clientEntry = Object.values(manifest).find((entry) => entry.isEntry);

  if (!clientEntry) {
    throw new Error('Vite manifest does not contain a client entry');
  }

  assets = {
    clientEntry: `/${clientEntry.file}`,
    stylesheets: (clientEntry.css ?? []).map((href) => `/${href}`),
  };
} else {
  const { createServer } = await import('vite');
  vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);

  assets = {
    clientEntry: '/src/entry-client.tsx',
    stylesheets: ['/src/styles.css'],
  };
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
  const renderAbortController = new AbortController();
  let abortReactRender: (() => void) | undefined;
  let abortTimer: ReturnType<typeof setTimeout> | undefined;
  const abortRender = () => {
    clearTimeout(abortTimer);

    if (!response.writableEnded) {
      renderAbortController.abort(new Error('HTTP connection closed'));
      abortReactRender?.();
    }
  };

  response.once('close', abortRender);

  try {
    let serverEntry: ServerEntry;
    if (isProduction) {
      const serverEntryUrl = pathToFileURL(
        path.resolve(root, 'dist/server/entry-server.js')
      ).href;
      serverEntry = (await import(serverEntryUrl)) as ServerEntry;
    } else {
      serverEntry = (await vite!.ssrLoadModule(
        '/src/entry-server.tsx'
      )) as ServerEntry;
    }

    const internalOrigin = `http://127.0.0.1:${port}`;
    const { abort, pipe } = await serverEntry.render(
      request.path,
      internalOrigin,
      assets,
      renderAbortController.signal
    );
    abortReactRender = abort;

    response.status(200).type('html');
    abortTimer = setTimeout(abortRender, 10_000);

    response.on('finish', () => {
      clearTimeout(abortTimer);
    });
    // React owns the complete document and ends the HTTP response after </html>.
    pipe(response);
  } catch (error) {
    response.off('close', abortRender);

    if (renderAbortController.signal.aborted) {
      return;
    }

    vite?.ssrFixStacktrace(error as Error);
    next(error);
  }
});

app.listen(port, () => {
  console.log(`renderToPipeableStream SSR running at http://localhost:${port}`);
});
