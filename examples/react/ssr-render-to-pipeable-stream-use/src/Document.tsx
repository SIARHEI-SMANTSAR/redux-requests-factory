import { type PropsWithChildren, type ReactNode, use } from 'react';

import type { AppStore, RootState } from './store';

export type RenderAssets = {
  clientEntry: string;
  stylesheets: string[];
};

export type SsrData = {
  assets: RenderAssets;
  preloadedState: RootState;
};

export const serializeSsrData = (data: SsrData) =>
  JSON.stringify(data).replace(
    /[<\u2028\u2029]/g,
    (character) =>
      ({ '<': '\\u003c', '\u2028': '\\u2028', '\u2029': '\\u2029' })[
        character
      ]!
  );

type DocumentProps = PropsWithChildren<{
  afterRoot: ReactNode;
  stylesheets: string[];
}>;

export function Document({
  afterRoot,
  children,
  stylesheets,
}: DocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <title>
          Streaming Suspense with use(promise) · Redux Requests Factory
        </title>
        {stylesheets.map((href) => (
          <link key={href} rel="stylesheet" href={href} precedence="default" />
        ))}
      </head>
      <body>
        <div id="root">{children}</div>
        {afterRoot}
      </body>
    </html>
  );
}

type HydrationScriptsProps = {
  assets: RenderAssets;
  store: AppStore;
  waitForRequests: boolean;
};

export function HydrationScripts({
  assets,
  store,
  waitForRequests,
}: HydrationScriptsProps) {
  if (waitForRequests) {
    use(store.asyncRequests());
  }

  const serializedData = serializeSsrData({
    assets,
    preloadedState: store.getState(),
  });
  const serializedClientEntry = JSON.stringify(assets.clientEntry).replace(
    /</g,
    '\\u003c'
  );

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__SSR_DATA__=${serializedData};import(${serializedClientEntry})`,
      }}
    />
  );
}
