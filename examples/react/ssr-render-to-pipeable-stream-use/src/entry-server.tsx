import { Suspense } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router';

import { App } from './App';
import {
  Document,
  HydrationScripts,
  type RenderAssets,
} from './Document';
import {
  RequestBaseUrlProvider,
} from './request-base-url';
import { makeStore } from './store';

export function render(
  pathname: string,
  baseUrl: string,
  assets: RenderAssets
) {
  // Never share a store between requests in an SSR server.
  const store = makeStore();

  return new Promise<{
    abort: () => void;
    pipe: (destination: NodeJS.WritableStream) => void;
  }>((resolve, reject) => {
    let controller: ReturnType<typeof renderToPipeableStream>;

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
          resolve({
            abort: controller.abort,
            pipe: (destination) => controller.pipe(destination),
          });
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          console.error('React streaming error:', error);
        },
      }
    );
  });
}
