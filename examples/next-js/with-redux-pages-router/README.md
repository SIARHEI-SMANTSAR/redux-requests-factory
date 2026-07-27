# redux-requests-factory Next.js Pages Router Example

This example shows both ways to await SSR requests: the Promise returned by a
specific factory action and the middleware's aggregate `toPromise` helper.

`getServerSideProps` awaits the users action directly. It then starts a dynamic
group of posts requests and uses `store.asyncRequests()` to wait for that whole
group before returning props. `next-redux-wrapper` hydrates the server-filled
Redux state into the browser.

The page demonstrates a dependent SSR request flow:

1. await `store.dispatch(loadUsersAction())`
2. select users from `store.getState()`
3. dispatch posts requests for each user
4. await `store.asyncRequests()` for the dynamic request group

## How to Use

Build the library from the repository root, then install and run the example:

```bash
npm run build
cd examples/next-js/with-redux-pages-router
npm install
npm run dev
```
