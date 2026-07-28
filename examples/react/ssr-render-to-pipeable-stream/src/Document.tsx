import type { PropsWithChildren } from 'react';

import type { RootState } from './store';

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
  serializedData: string;
  stylesheets: string[];
}>;

export function Document({
  children,
  serializedData,
  stylesheets,
}: DocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <title>
          React SSR with renderToPipeableStream · Redux Requests Factory
        </title>
        {stylesheets.map((href) => (
          <link key={href} rel="stylesheet" href={href} precedence="default" />
        ))}
      </head>
      <body>
        <div id="root">{children}</div>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__SSR_DATA__=${serializedData}`,
          }}
        />
      </body>
    </html>
  );
}
