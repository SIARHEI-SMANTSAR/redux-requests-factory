import { renderToPipeableStream } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router';

import { App } from './App';
import { loadActivityAction, loadStatsAction } from './dashboard-requests';
import {
  Document,
  serializeSsrData,
  type RenderAssets,
} from './Document';
import { pageFromPath } from './routes';
import { makeStore } from './store';
import { loadUsersAction } from './users-request';

export async function render(
  pathname: string,
  baseUrl: string,
  assets: RenderAssets
) {
  // Never share a store between requests in an SSR server.
  const store = makeStore();
  const page = pageFromPath(pathname);

  if (page === 'single') {
    await store.dispatch(loadUsersAction({ baseUrl }));
  } else {
    // Start independent work together, then wait for the middleware batch.
    store.dispatch(loadUsersAction({ baseUrl }));
    store.dispatch(loadStatsAction({ baseUrl }));
    store.dispatch(loadActivityAction({ baseUrl }));
    await store.asyncRequests();
  }

  const serializedData = serializeSsrData({
    assets,
    preloadedState: store.getState(),
  });

  return new Promise<{
    abort: () => void;
    pipe: (destination: NodeJS.WritableStream) => void;
  }>((resolve, reject) => {
    let controller: ReturnType<typeof renderToPipeableStream>;

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
