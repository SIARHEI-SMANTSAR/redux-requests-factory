# Next.js App Router with Redux

This example shows Redux Toolkit, React Redux, and `redux-requests-factory`
integrated with the Next.js App Router.

## Routes

| Route | Demonstrates |
| --- | --- |
| `/` | Client-side loading, cache-aware loading, and forced reloads. |
| `/server-redux` | One async Server Component inside a `Suspense` boundary. |
| `/server-redux-batch` | One server store starting and awaiting three requests. |
| `/server-redux-streams` | Three independent async Server Components and streams. |

- `lib/store.ts` creates a new store instead of exporting a shared singleton.
- `app/store-provider.tsx` owns the browser store, while the shared root layout
  keeps its Provider mounted across client-side route transitions.
- `lib/hooks.ts` exports typed Redux hooks.
- `lib/logger-middleware.ts` logs every Redux action and the resulting state to
  the browser Console for client actions and the terminal for server actions.
- `store.asyncRequests()` exposes the middleware's `toPromise` helper and lets
  callers wait until all currently tracked requests have finished.
- `app/page.tsx` remains a Server Component and renders an interactive counter.
- `lib/features/users/users-requests.ts` defines a request factory for users.
- `app/api/users/route.ts` provides a local Route Handler used by the example.
- `app/users.tsx` dispatches the request and renders loading, error, and response
  states from Redux.

The requests factory middleware is prepended to Redux Toolkit's default
middleware so it receives factory actions before the default thunk middleware.
The factory reducer is mounted using the library's exported `stateRequestsKey`.

The users example demonstrates both cache-aware and forced loading:

- **Try cached load** dispatches `loadDataAction`. After the request has
  completed successfully, dispatching it again does not execute another network
  request because the response is already stored.
- **Force reload** dispatches `forcedLoadDataAction`. It ignores the cached
  response and always executes the request again.

Open the browser Console to compare the action sequences:

- After **Try cached load**, the logger prints `LOAD/users`, but a cached
  successful request does not produce `REQUEST/START` or `REQUEST/SUCCESS`.
- After **Force reload**, the logger prints `FORCED_LOAD/users`, followed by
  `REQUEST/START` and `REQUEST/SUCCESS` because a network request is executed.

`responseSelector` returns the unmodified `User[] | undefined` response. The UI
uses `usersSelector(state) ?? []` only at the rendering boundary; the request
factory does not transform the stored response.

## Server Component example

The `/server-redux` route uses the same store and request factory as the client
example:

1. `app/server-redux/page.tsx` renders the page shell and places the users block
   inside a `Suspense` boundary.
2. The async `app/server-components/server-users.tsx` component creates a new
   store for its current server render.
3. The component dispatches `loadUsersAction()` and waits for all tracked
   requests with `await store.asyncRequests()`.
4. `requestsStateSelector(store.getState())` returns the serializable requests
   slice without exposing the configured Redux state key.
5. After the hydration boundary commits, its layout effect dispatches the
   library's `hydrateRequestsAction` into the store owned by the shared layout
   Provider. The standard `requestsReducer` performs the deep merge. The later
   `Users` effect sees the successful cached response and does not repeat the
   network request.

Only the async users subtree waits for the request. Next.js can stream the page
shell and the Suspense fallback before the server-loaded Redux state is ready.

The shared layout owns one browser store that survives navigation between `/`
and `/server-redux`. The server store remains request-scoped: Server Components
cannot pass a Redux store through the React Server Component boundary because
it is not serializable. They pass only the state that needs to be reconciled
with the browser store. Never share a global server store between requests.

Because the shared Provider is created above the route, a nested Server
Component cannot initialize it during render without causing a React update
warning. `RequestsHydrator` therefore reconciles the server state in
`useLayoutEffect`, after commit. If the server-loaded Redux state must be used
to generate the initial HTML itself, place a preloaded Provider at the route
boundary instead of sharing one Provider across routes.

The users request supports both runtimes. On the server it calls the data
function directly; in the browser it calls the `/api/users` Route Handler.

## Batched server loading

The `/server-redux-batch` route demonstrates one store coordinating the full
route data set:

```ts
const store = makeStore();

store.dispatch(loadUsersAction());
store.dispatch(loadPostsAction());
store.dispatch(loadSettingsAction());

await store.asyncRequests();
```

The three requests start before the await and run in parallel. After all
currently tracked requests finish, one `RequestsHydrator` merges the complete
requests slice into the browser store from the shared layout. The library
reducer merges response keys instead of replacing the slice, so navigating
between server examples does not remove previously hydrated requests.

## Independent Server Components

The `/server-redux-streams` route renders three async Server Components:

- `ServerUsers` creates a store and waits only for `loadUsersAction()`.
- `ServerPosts` creates a store and waits only for `loadPostsAction()`.
- `ServerSettings` creates a store and waits only for `loadSettingsAction()`.

Each component has its own `Suspense` boundary and can stream independently.
When a component finishes, its `RequestsHydrator` merges that component's
response key into the one browser store owned by the shared layout. This trades
additional short-lived server stores for finer streaming granularity.

## Getting started

The example installs `redux-requests-factory` from the repository root through
the `file:../../..` dependency. Its `.npmrc` enables `install-links`, so npm
copies the local package into `node_modules` instead of creating a symlink.
This keeps the linked library inside the app's Turbopack root and prevents its
`src/middleware.ts` from being treated as Next.js middleware.

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and use the counter to verify
that Redux is connected.
