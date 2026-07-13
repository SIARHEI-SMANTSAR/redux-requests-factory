# redux-requests-factory Next.js Pages Router Example

This example shows the SSR flow where `redux-requests-factory` middleware
`toPromise` is useful.

`getServerSideProps` dispatches request actions, then awaits
`store.asyncRequests()` before returning props. `next-redux-wrapper` hydrates the
server-filled Redux state into the browser.

The page demonstrates a dependent SSR request flow:

1. dispatch `loadUsersAction()`
2. await `store.asyncRequests()`
3. select users from `store.getState()`
4. dispatch posts requests for each user
5. await `store.asyncRequests()` again

## How to Use

```bash
npm install
npm run dev
```
