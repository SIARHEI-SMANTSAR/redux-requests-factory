import { Suspense } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router';

import { App } from './App';
import { Document, HydrationScripts, type RenderAssets } from './Document';
import { RequestBaseUrlProvider } from './request-base-url';
import { makeStore } from './store';

export function render(
  pathname: string,
  baseUrl: string,
  assets: RenderAssets,
  abortSignal?: AbortSignal
) {
  // Never share a store between requests in an SSR server.
  const store = makeStore();

  if (abortSignal?.aborted) {
    return Promise.reject(
      abortSignal.reason ?? new Error('SSR render aborted')
    );
  }

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
        <RequestBaseUrlProvider baseUrl={baseUrl}>
          <StaticRouter location={pathname}>
            <Document
              afterRoot={
                <Suspense fallback={null}>
                  <HydrationScripts
                    assets={assets}
                    store={store}
                    waitForRequests
                  />
                </Suspense>
              }
              stylesheets={assets.stylesheets}
            >
              <Provider store={store}>
                <App />
              </Provider>
            </Document>
          </StaticRouter>
        </RequestBaseUrlProvider>,
        {
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
