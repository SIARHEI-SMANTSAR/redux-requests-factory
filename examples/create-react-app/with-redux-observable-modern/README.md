# Modern Create React App example with redux-observable

This example shows `redux-requests-factory` used together with
`redux-observable` in a modern Create React App project.

It uses React 19, Redux 5, React Redux 9, redux-observable 3, RxJS 7, and
Create React App 5.

## Run

```bash
npm install
npm start
```

## Flow

- `initAppAction` is handled by an epic and dispatches `loadUsersAction`.
- `loadUsersFulfilledAction` is handled by an epic and dispatches
  `loadUserPostsAction` for every loaded user.
- `addUserPostAction` is handled by an epic and dispatches
  `cancelAddPostAction` and `addPostAction`.
- `addPostFulfilledAction` updates cached user posts through
  `setUserPostsAction`.

