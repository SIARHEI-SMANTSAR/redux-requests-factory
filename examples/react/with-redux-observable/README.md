# React + Vite example with redux-observable

This example shows `redux-requests-factory` used together with
`redux-observable` in a React 19, Redux 5, TypeScript, and Vite project.

Every request function forwards the factory-provided `AbortSignal` to `fetch`.
The epic's `cancelAddPostAction` therefore aborts the underlying POST request,
not only its Redux state update.

## Run

Build the library from the repository root, then install and run the example:

```bash
npm run build
cd examples/react/with-redux-observable
npm install
npm run dev
```

Use `npm run build` to type-check the example and create a production bundle.

## Flow

- Factory command forwarding is disabled by default in v2.
- `initAppAction` is handled by an epic and dispatches `loadUsersAction` with
  `forwardFactoryAction: true` for that action only.
- `loadUsersActionEpic` listens to the forwarded `loadUsersAction` command and
  logs that it was observed without starting another request.
- `loadUsersFulfilledAction` is handled by an epic and dispatches
  `loadUserPostsAction` for every loaded user.
- `addUserPostAction` is handled by an epic and dispatches
  `cancelAddPostAction` and `addPostAction`.
- `addPostFulfilledAction` updates cached user posts through
  `setUserPostsAction`.
