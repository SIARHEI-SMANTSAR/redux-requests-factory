# React SSR with `renderToPipeableStream`

Classic streaming React SSR built directly with `renderToPipeableStream` and
`hydrateRoot`, without Next.js or another React framework. Express owns the
HTTP response, Vite builds the client and server entries, React Router owns the
routes, and `redux-requests-factory` loads route data.

This example explicitly preloads the data required by the requested route. It
then starts `renderToPipeableStream` with a React component that returns the
complete `<html>` document. `onShellReady` pipes React's output directly into
the Node.js HTTP response.

The complete response is owned by React rather than assembled around an app
fragment:

1. Create an isolated Redux store for the HTTP request.
2. Dispatch and await the route's request actions.
3. Render `<Document>`, which returns `<html>`, `<head>`, `<body>`, the React
   root, stylesheet links, and serialized Redux state.
4. Read the hashed client entry and CSS URLs from Vite's production manifest.
5. Pass the client entry to React through `bootstrapModules`.
6. Pipe the complete document directly to the Express response. React writes
   the doctype, finishes `</html>`, and ends the response.
7. Recreate the browser store from the embedded state and hydrate the whole
   `document` with the same `<Document>` component.

Vite is configured with `src/entry-client.tsx` as an explicit Rollup input, so
this full-document SSR example does not need an `index.html` file. The server
finds the generated client entry through the `isEntry` field in Vite's
manifest.

Every request forwards its factory-provided `AbortSignal` to `fetch`. The
server connects both a closed HTTP response and the ten-second render timeout
to React's `abort()` and `store.cancelAsyncRequests()`. This stops the stream,
aborts all transport work owned by that SSR store, and prevents late results
from updating it. Preload cleanup runs in `finally`; synchronous render errors
and `onShellError` cancel the store; `onAllReady` releases any unused work left
after rendering. Streaming errors after the shell has started destroy the HTTP
response, while errors before the shell is ready use the Express error path.

## Routes

- `/single` awaits one users request before starting the stream;
- `/batch` starts three independent requests and waits for the middleware's
  `toPromise()` before starting the stream.

Navigation after hydration uses React Router's `NavLink` and remains
client-side. Normal request actions reuse the hydrated cache.

## Run in development

Build the library from the repository root, then install and run the example:

```bash
npm run build
cd examples/react/ssr-render-to-pipeable-stream
npm install
npm run dev
```

Open <http://localhost:5173/single> or <http://localhost:5173/batch>.

## Production build

```bash
npm run build
npm start
```
