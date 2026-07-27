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
- While a request is loading, repeated `loadUsersAction` dispatches return the
  same cached `Promise<void>` for that request key.
- `useLoadUsers` passes that Promise to `use` only for the `None` and `Loading`
  statuses. Calling `use` conditionally is supported by React.
- Force reload uses a normal `dispatch(forceLoadUsersAction())`. The status
  change renders `useLoadUsers` again, and `loadUsersAction` returns the latest
  in-flight Promise.
- Factory command forwarding is disabled for this middleware instance, so a
  cached `loadUsersAction` read during render does not notify Redux subscribers.
- Request data and errors are read normally with `useAppSelector` and rendered
  as JSX. Request failures are stored in Redux instead of being thrown through
  the dispatch Promise, so an Error Boundary is not required for this flow.
- `Suspense` renders a skeleton while the request is pending.

The Suspense integration lives in a custom hook:

```tsx
function useLoadUsers() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(usersStatusSelector);

  if (
    status === RequestsStatuses.None ||
    status === RequestsStatuses.Loading
  ) {
    use(dispatch(loadUsersAction()));
  }
}
```

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
every dispatch. It works here because `loadDataAction` returns the latest
in-flight Promise for the request key. Forced actions start a new request, but
the following loading render retrieves their Promise through `loadDataAction`.

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
