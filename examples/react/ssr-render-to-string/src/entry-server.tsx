import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router';

import { App } from './App';
import { loadActivityAction, loadStatsAction } from './dashboard-requests';
import { pageFromPath } from './routes';
import { makeStore } from './store';
import { loadUsersAction } from './users-request';

export async function render(pathname: string, baseUrl: string) {
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

  return {
    appHtml: renderToString(
      <StaticRouter location={pathname}>
        <Provider store={store}>
          <App />
        </Provider>
      </StaticRouter>
    ),
    preloadedState: store.getState(),
  };
}
