# React SSR with `renderToString`

Classic server-side rendering built directly with React's `renderToString` and
`hydrateRoot` APIs—without Next.js or another React framework. Express serves
the application, Vite builds the client and server entries, React Router owns
the routes, and `redux-requests-factory` loads the data.

This example uses explicit route-level preloading: the server entry knows which
requests each route needs, dispatches and awaits them, and then renders the page
once. See the
[component-driven example](../ssr-render-to-string-component-data) for an
alternative where nested components discover their own requests during a first
render and the server returns a second render.

The example has two pages:

- `/single` awaits one `loadUsersAction` before the server render;
- `/batch` starts three independent requests and awaits the middleware's
  `toPromise()` before the server render.

For every HTTP request, the server creates an isolated Redux store, waits for
the route's data, and calls `renderToString` to produce the page HTML. It embeds
the resulting Redux state in that HTML so the browser can recreate the store
and attach React with `hydrateRoot` without requesting the same data again.

Every request forwards its factory-provided `AbortSignal` to `fetch`. Express
creates an abort controller for the render; if the HTTP response closes while
data is loading, the server calls `store.cancelAsyncRequests()`, aborts all
transport work owned by that SSR store, and skips the abandoned render. The
server entry also awaits the same cleanup in `finally`, so a preload or render
exception cannot leave requests running after its request-scoped store is
discarded.

The server renders the route tree inside React Router's `StaticRouter`; the
browser hydrates it inside `BrowserRouter`. Navigation uses `NavLink`, so it
stays client-side. `renderToString` runs only when a page is opened directly or
reloaded.

## Run in development

Build the library from the repository root, then install and run the example:

```bash
npm run build
cd examples/react/ssr-render-to-string
npm install
npm run dev
```

Open <http://localhost:5173/single> or <http://localhost:5173/batch>. Disable
JavaScript or use “View page source” to confirm that page data is present in
the server response.

## Production build

```bash
npm run build
npm start
```
