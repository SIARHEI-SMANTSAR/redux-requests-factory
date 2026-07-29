# React `use(promise)` SPA

A client-only React 19 and Vite example integrating
`redux-requests-factory` with Suspense.

## What it demonstrates

- Plain Redux configures the store with `createStore`, `combineReducers`, and
  `applyMiddleware`; there are no slices.
- `redux-logger` prints request lifecycle actions and their state changes in the
  browser console.
- `redux-requests-factory` provides the requests reducer, middleware, actions,
  and selectors.
- `useLoadUsers` starts the initial request while rendering `UsersResult`.
- While a request is pending and after it settles, repeated `loadUsersAction`
  dispatches return the same cached `Promise<void>` for that request key.
- `useLoadUsers` passes the stable Promise to `use` unconditionally.
- Force reload uses a normal `dispatch(forceLoadUsersAction())`. The request
  version change renders `useLoadUsers` again, and `loadUsersAction` returns the
  latest in-flight Promise.
- Factory command forwarding is disabled by the v2 default, so a cached
  `loadUsersAction` read during render does not notify Redux subscribers.
- Request data and errors are read normally with `useAppSelector` and rendered
  as JSX. Request failures are stored in Redux instead of being thrown through
  the dispatch Promise, so an Error Boundary is not required for this flow.
- `Suspense` renders a skeleton while the request is pending.
- The request passes the factory-provided `AbortSignal` through both its
  artificial delay and `fetch`, so cancellation releases the Suspense Promise
  without leaving transport work running.

The Suspense integration lives in a custom hook:

```tsx
function useLoadUsers() {
  const dispatch = useAppDispatch();
  useAppSelector(usersRequestVersionSelector);

  use(dispatch(loadUsersAction()));
}
```

The version selector starts at `0` and increments whenever a real request
starts. Cached dispatches do not increment it. Its value does not gate `use`;
the subscription triggers the render that reads the new pending Promise, even
when a forced request replaces one that is already loading.

Keeping this subscription means an explicit refresh reliably returns the
nearest Suspense boundary to its fallback. Removing it changes the common case
to a background refresh: the previous users remain visible until
`usersSelector` receives the new response. An unrelated render during the
pending request can still reach `use()` and suspend.

Data and errors are still read from Redux:

```tsx
function UsersResult() {
  useLoadUsers();

  const users = useAppSelector(usersSelector) ?? [];
  const error = useAppSelector(usersErrorSelector);

  if (error) {
    return <div>Could not load users.</div>;
  }

  return users.map((user) => <div key={user.id}>{user.name}</div>);
}
```

The same pattern must not be used with an action that creates a fresh Promise on
every dispatch. It works here because `loadDataAction` retains the latest
pending or settled Promise for the request key. Forced actions start a new
request, but the following render retrieves their Promise through
`loadDataAction`. Automatic terminal-state retries are disabled in the store so
a failed render reads its settled Promise and displays the Redux error.

## Run locally

Build `redux-requests-factory` from the repository root first:

```bash
npm run build
```

Then start the example:

```bash
cd examples/react/use-promise
npm install
npm run dev
```

The example fetches `public/users.json`, so it does not depend on an external
API.
