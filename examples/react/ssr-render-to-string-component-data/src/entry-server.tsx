import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router';

import { App } from './App';
import { RequestEnvironmentProvider } from './request-environment';
import { makeStore } from './store';

export async function render(pathname: string, baseUrl: string) {
  // Never share a store between requests in an SSR server.
  const store = makeStore();

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

  // Pass one discovers requests in the components. Its HTML is discarded.
  renderApp();
  await store.asyncRequests();

  return {
    // Pass two reads the resolved request state and becomes the response HTML.
    appHtml: renderApp(),
    preloadedState: store.getState(),
  };
}
