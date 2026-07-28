import { StrictMode, Suspense } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';

import { App } from './App';
import {
  Document,
  HydrationScripts,
  type SsrData,
} from './Document';
import {
  RequestBaseUrlProvider,
} from './request-base-url';
import { makeStore, type RootState } from './store';
import './styles.css';

declare global {
  interface Window {
    __SSR_DATA__: SsrData;
  }
}

const ssrData = window.__SSR_DATA__;
const store = makeStore(ssrData.preloadedState as RootState);

hydrateRoot(
  document,
  <StrictMode>
    <RequestBaseUrlProvider baseUrl="">
      <BrowserRouter>
        <Document
          afterRoot={
            <Suspense fallback={null}>
              <HydrationScripts
                assets={ssrData.assets}
                store={store}
                waitForRequests={false}
              />
            </Suspense>
          }
          stylesheets={ssrData.assets.stylesheets}
        >
          <Provider store={store}>
            <App />
          </Provider>
        </Document>
      </BrowserRouter>
    </RequestBaseUrlProvider>
  </StrictMode>
);
