# Component-driven React SSR with `renderToString`

Classic React SSR with dynamic, component-owned data loading. It uses React's
`renderToString` and `hydrateRoot` APIs directly, without Next.js or another
React framework.

Unlike the
[route-preloaded example](../ssr-render-to-string), the server entry does not
import request actions or maintain a list of data required by each route.
Instead, the component that reads a request also calls its loading hook.

## How the two-pass render works

Each loading hook has one action and two execution modes:

- during server rendering, it dispatches the action immediately;
- in the browser, it dispatches the same action inside `useEffect`.

The SSR server then follows this sequence:

1. Create an isolated Redux store for the HTTP request.
2. Call `renderToString` once. Mounted route components dispatch their request
   actions; this discovery HTML is discarded.
3. Await `store.asyncRequests()` so every request discovered in pass one can
   settle.
4. Call `renderToString` again. Selectors now read the resolved data from Redux.
5. Cancel requests started during the second pass and wait for their lifecycle
   promises to settle.
6. Return the second HTML string and serialize the Redux state for
   `hydrateRoot`.

Only components mounted for the requested route participate. On client-side
React Router navigation, newly mounted components load their data from
`useEffect`. Normal factory actions reuse hydrated or previously loaded data,
and multiple components can dispatch the same action without duplicating its
request.

Successful requests are cached, so the second pass does not start them again.
Failed requests are also kept terminal for the rest of that request-scoped
server store. Requests discovered only during the second pass are canceled
after the HTML is produced. The browser's `useEffect` dispatches the normal
loading action and the middleware permits one client retry for either hydrated
`failed` or hydrated `canceled` state. A second client failure or cancellation
stays terminal until an explicit forced reload. Serializing `loading` here
would be incorrect because the browser store has no corresponding server-side
execution to await.

Every discovered request forwards its factory-provided `AbortSignal` to
`fetch`. Express connects a closed HTTP response to
`store.cancelAsyncRequests()`, so abandoning either render pass aborts all
transport work owned by that request-scoped store.

The example has two routes:

- `/single` discovers the users request inside `UsersList`;
- `/batch` discovers users, stats, and activity in independent dashboard
  components. Two cards request the same stats data to demonstrate request
  deduplication.

## Run in development

Build the library from the repository root, then install and run the example:

```bash
npm run build
cd examples/react/ssr-render-to-string-component-data
npm install
npm run dev
```

Open <http://localhost:5173/single> or <http://localhost:5173/batch>. Use “View
page source” to confirm that the response contains data from the second server
render.

## Production build

```bash
npm run build
npm start
```
