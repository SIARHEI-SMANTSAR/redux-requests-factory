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

This combines React's streaming SSR and selective hydration—sometimes grouped
under the informal term “streaming hydration.” React owns the rendering and
hydration schedule; the request factory contributes stable dispatch Promises
for `use()`, request state shared through Redux, and state transfer that
prevents hydration-time duplicate requests. Slow boundaries can finish after
faster content has already been sent without requiring a second client query
cache.

Use this example as the recommended starting point when building a new Node.js
React SSR integration. The `renderToString` and preload-first streaming
examples remain useful as simpler alternatives and for comparing data-loading
strategies.

Request actions are not preloaded by the server entry. Each data component
owns a custom hook that dispatches its `redux-requests-factory` action and
passes the returned Promise to React's `use` API:

```tsx
useSelector(usersRequestVersionSelector);
use(dispatch(loadUsersAction({ baseUrl })));
```

React retries a component from scratch after it suspends, so `use` must receive
the same Promise instance on every render. The request factory middleware owns
this cache: repeated normal load actions for the same request key return the
same Promise while it is pending and after it settles. No application-level
Promise runtime or status guard is needed. A stale response, configured retry,
or forced load replaces the cache entry with a new Promise.

The request version selector remains a subscription rather than a guard. It
starts at `0`, increments whenever a real request starts, and does not change
for a cached dispatch. The subscription triggers the render that passes the
replacement pending Promise to `use`, including a forced load started while
the previous request is already `Loading`.

This example keeps the version subscription to demonstrate a Suspense refresh.
Without it, the forced request can instead refresh in the background while the
previous response remains visible, unless another render reaches the pending
Promise through `use`.

`makeStore()` creates a new `createRequestsFactoryMiddleware()` instance for
every SSR request. Its stable latest Promise cache, cancellation bookkeeping,
debounce state, and aggregate request tracker are isolated from every other
server render, while the request action modules remain safe singletons.

Every request forwards its factory-provided `AbortSignal` to `fetch`. Express
connects a closed HTTP response and the render timeout to React's `abort()` and
`store.cancelAsyncRequests()`, so every pending Suspense request in that SSR
store is aborted and its dispatch Promise settles immediately. Synchronous
render errors and `onShellError` perform the same cleanup, while `onAllReady`
cancels any unused fire-and-forget work that did not participate in a Suspense
boundary.

## Automatic request retry

The users request demonstrates bounded automatic retries for transient HTTP
failures. It retries rate limiting and server errors, uses exponential backoff,
and leaves client errors such as `400` or `404` as final failures:

```ts
class UsersRequestError extends Error {
  constructor(public readonly status: number) {
    super(`Users request failed with status ${status}`);
  }
}

const usersRequest = requestsFactory({
  request: loadUsersRequest,
  stateRequestKey: 'users',
  retry: {
    maxRetries: 2,
    shouldRetry: ({ error }) =>
      error instanceof UsersRequestError &&
      (error.status === 429 || error.status >= 500),
    delay: ({ attempt }) => Math.min(250 * 2 ** (attempt - 1), 2_000),
  },
});
```

`maxRetries: 2` means one initial request plus at most two retries. All attempts
remain inside the same dispatch Promise, so React continues to receive one
stable thenable through `use(promise)`. Intermediate failures do not update
Redux or resolve the Suspense boundary; only a success or the final exhausted
failure completes the lifecycle.

This is independent from the store's `loadDataRetryStatuses: []` setting. That
setting prevents a later render from starting a new lifecycle for an already
failed request, while `retry` controls attempts inside the lifecycle that is
already pending. If the HTTP connection closes during backoff, the store-wide
cancellation clears the retry timer and prevents another attempt.

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

The force reload buttons dispatch each request factory's
`forcedLoadDataAction`. The resulting request version change makes the data
component read the same in-flight Promise through `use` again, so its nearest
`Suspense` boundary temporarily returns to the fallback until the fresh response
arrives.

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
