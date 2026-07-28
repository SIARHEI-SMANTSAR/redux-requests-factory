import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';

import { App } from './App';
import { makeStore, type RootState } from './store';
import './styles.css';

declare global {
  interface Window {
    __PRELOADED_STATE__: RootState;
  }
}

const store = makeStore(window.__PRELOADED_STATE__);
delete (window as Partial<Window>).__PRELOADED_STATE__;

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </BrowserRouter>
  </StrictMode>
);
