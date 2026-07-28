# Modern React SSR with streaming, `Suspense`, and `use(promise)`

This is the primary modern SSR reference for `redux-requests-factory`. It shows
framework-free React 19 streaming SSR built directly with
`renderToPipeableStream`, `Suspense`, `use`, and `hydrateRoot`; it does not use
Next.js or another React framework.

The example demonstrates the complete modern SSR lifecycle: React renders the
whole HTML document, sends the application shell immediately, progressively
streams component-owned data boundaries, serializes the completed Redux state,
and hydrates the document in the browser. React Router provides client-side
navigation, so another server render happens only after a full page reload.

Use this example as the recommended starting point when building a new Node.js
React SSR integration. The `renderToString` and preload-first streaming
examples remain useful as simpler alternatives and for comparing data-loading
strategies.

Request actions are not preloaded by the server entry. Each data component
owns a custom hook that dispatches its `redux-requests-factory` action and
passes the returned Promise to React's `use` API:

```tsx
const status = useSelector(usersStatusSelector);

if (status === RequestsStatuses.None || status === RequestsStatuses.Loading) {
  use(dispatch(loadUsersAction({ baseUrl })));
}
```

React retries a component from scratch after it suspends, so `use` must receive
the same Promise instance while the request is running. The request factory
middleware owns this cache: repeated normal load actions for the same request
key return the same in-flight Promise. No application-level Promise runtime is
needed. After success, the Redux request status prevents the component from
suspending again.

`makeStore()` creates a new `createRequestsFactoryMiddleware()` instance for
every SSR request. Its in-flight Promise cache, cancellation bookkeeping,
debounce state, and aggregate request tracker are isolated from every other
server render, while the request action modules remain safe singletons.

Every singleton request definition contributes only a stable
`requestFactoryRuntimeKey`. Each middleware has its own private `WeakMap`, so
the same key resolves to a different runtime state in every SSR store. The key
contains no Promise or other mutable request data.

## Streaming sequence

1. The server creates an isolated Redux store and middleware instance.
2. `renderToPipeableStream` renders the complete HTML document.
3. Data components dispatch during render and suspend with `use(promise)`.
4. `onShellReady` immediately pipes the document shell and each nearest
   `Suspense` fallback to the HTTP response.
5. As users, activity, and stats resolve independently, React streams hidden
   boundary content and its replacement instructions into the same response.
6. A final internal boundary calls `store.asyncRequests()` and waits for every
   request tracked by that middleware. It then streams one inline script that
   installs the current Redux state before dynamically importing the client
   module.
7. The client recreates the store and selectively hydrates the streamed
   boundaries without repeating the server requests.

The `/batch` route deliberately uses separate boundaries with different API
delays. Activity resolves first, followed by users, then stats. Projects and
SuccessRate request the same stats action and share the in-flight Promise
cached by their store's middleware.

Vite builds `src/entry-client.tsx` through an explicit Rollup input. There is no
`index.html`: React owns the complete streamed document, and the server reads
the hashed client entry and CSS files from Vite's manifest.

## Run in development

Build the library from the repository root, then install and run the example:

```bash
npm run build
cd examples/react/ssr-render-to-pipeable-stream-use
npm install
npm run dev
```

Open <http://localhost:5173/batch>. In the browser network response, the shell
and fallbacks arrive first and completed Suspense boundaries follow as chunks.

## Production build

```bash
npm run build
npm start
```

## React documentation

- [`use(promise)`](https://react.dev/reference/react/use)
- [`Suspense`](https://react.dev/reference/react/Suspense)
- [`renderToPipeableStream`](https://react.dev/reference/react-dom/server/renderToPipeableStream)
