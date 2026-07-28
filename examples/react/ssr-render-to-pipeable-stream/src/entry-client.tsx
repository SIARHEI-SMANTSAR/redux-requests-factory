import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';

import { App } from './App';
import {
  Document,
  serializeSsrData,
  type SsrData,
} from './Document';
import { makeStore, type RootState } from './store';
import './styles.css';

declare global {
  interface Window {
    __SSR_DATA__: SsrData;
  }
}

const ssrData = window.__SSR_DATA__;
const store = makeStore(ssrData.preloadedState as RootState);
const serializedData = serializeSsrData(ssrData);

hydrateRoot(
  document,
  <StrictMode>
    <BrowserRouter>
      <Document
        serializedData={serializedData}
        stylesheets={ssrData.assets.stylesheets}
      >
        <Provider store={store}>
          <App />
        </Provider>
      </Document>
    </BrowserRouter>
  </StrictMode>
);
