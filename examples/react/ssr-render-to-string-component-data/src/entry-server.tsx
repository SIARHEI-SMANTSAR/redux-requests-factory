import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router';

import { App } from './App';
import { RequestEnvironmentProvider } from './request-environment';
import { makeStore } from './store';

export async function render(
  pathname: string,
  baseUrl: string,
  abortSignal?: AbortSignal
) {
  // Never share a store between requests in an SSR server.
  const store = makeStore();
  const cancelRequests = () => void store.cancelAsyncRequests();

  abortSignal?.addEventListener('abort', cancelRequests, { once: true });

  const renderApp = () =>
    renderToString(
      <StaticRouter location={pathname}>
        <Provider store={store}>
          <RequestEnvironmentProvider serverBaseUrl={baseUrl}>
            <App />
          </RequestEnvironmentProvider>
        </Provider>
      </StaticRouter>
    );

  try {
    if (abortSignal?.aborted) {
      await store.cancelAsyncRequests();
      throw abortSignal.reason ?? new Error('SSR render aborted');
    }

    // Pass one discovers requests in the components. Its HTML is discarded.
    renderApp();
    await store.asyncRequests();

    if (abortSignal?.aborted) {
      throw abortSignal.reason ?? new Error('SSR render aborted');
    }

    // Pass two reads the resolved request state and becomes the response HTML.
    const appHtml = renderApp();

    // A failed request can be discovered again during pass two. Do not leave
    // that transport running after the final HTML has already been produced,
    // and do not hydrate the browser with an orphaned `loading` state.
    await store.cancelAsyncRequests();

    return {
      appHtml,
      preloadedState: store.getState(),
    };
  } finally {
    // Also cover an exception thrown while either render pass is running.
    await store.cancelAsyncRequests();
    abortSignal?.removeEventListener('abort', cancelRequests);
  }
}
