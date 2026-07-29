import { renderToPipeableStream } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router';

import { App } from './App';
import { loadActivityAction, loadStatsAction } from './dashboard-requests';
import { Document, serializeSsrData, type RenderAssets } from './Document';
import { pageFromPath } from './routes';
import { makeStore } from './store';
import { loadUsersAction } from './users-request';

export async function render(
  pathname: string,
  baseUrl: string,
  assets: RenderAssets,
  abortSignal?: AbortSignal
) {
  // Never share a store between requests in an SSR server.
  const store = makeStore();
  const page = pageFromPath(pathname);
  const cancelRequests = () => void store.cancelAsyncRequests();

  abortSignal?.addEventListener('abort', cancelRequests, { once: true });

  try {
    if (abortSignal?.aborted) {
      await store.cancelAsyncRequests();
      throw abortSignal.reason ?? new Error('SSR render aborted');
    }

    if (page === 'single') {
      await store.dispatch(loadUsersAction({ baseUrl }));
    } else {
      // Start independent work together, then wait for the middleware batch.
      store.dispatch(loadUsersAction({ baseUrl }));
      store.dispatch(loadStatsAction({ baseUrl }));
      store.dispatch(loadActivityAction({ baseUrl }));
      await store.asyncRequests();
    }

    if (abortSignal?.aborted) {
      throw abortSignal.reason ?? new Error('SSR render aborted');
    }
  } finally {
    await store.cancelAsyncRequests();
    abortSignal?.removeEventListener('abort', cancelRequests);
  }

  const serializedData = serializeSsrData({
    assets,
    preloadedState: store.getState(),
  });

  return new Promise<{
    abort: () => void;
    pipe: (destination: NodeJS.WritableStream) => void;
  }>((resolve, reject) => {
    let controller: ReturnType<typeof renderToPipeableStream> | undefined;
    const abortRender = () => {
      void store.cancelAsyncRequests();
      controller?.abort();
    };

    abortSignal?.addEventListener('abort', abortRender, { once: true });

    try {
      controller = renderToPipeableStream(
        <StaticRouter location={pathname}>
          <Document
            serializedData={serializedData}
            stylesheets={assets.stylesheets}
          >
            <Provider store={store}>
              <App />
            </Provider>
          </Document>
        </StaticRouter>,
        {
          bootstrapModules: [assets.clientEntry],
          onShellReady() {
            if (abortSignal?.aborted) {
              abortSignal?.removeEventListener('abort', abortRender);
              abortRender();
              reject(abortSignal.reason ?? new Error('SSR render aborted'));
              return;
            }

            resolve({
              abort: () => {
                abortSignal?.removeEventListener('abort', abortRender);
                abortRender();
              },
              pipe: (destination) => controller!.pipe(destination),
            });
          },
          onShellError(error) {
            abortSignal?.removeEventListener('abort', abortRender);
            abortRender();
            reject(error);
          },
          onAllReady() {
            abortSignal?.removeEventListener('abort', abortRender);
            void store.cancelAsyncRequests();
          },
          onError(error) {
            console.error('React streaming error:', error);
          },
        },
      );
    } catch (error) {
      abortSignal?.removeEventListener('abort', abortRender);
      abortRender();
      reject(error);
    }
  });
}
