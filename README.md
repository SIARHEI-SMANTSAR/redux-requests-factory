# Redux Requests Factory

[![npm version](https://img.shields.io/npm/v/redux-requests-factory.svg?style=flat-square)](https://www.npmjs.com/package/redux-requests-factory)
[![npm downloads](https://img.shields.io/npm/dm/redux-requests-factory.svg?style=flat-square)](https://www.npmjs.com/package/redux-requests-factory)

> Build independent Redux components that can load and share server data
> without duplicate requests, hand-written request state, or coordination
> between components.

`redux-requests-factory` is for teams building Redux applications where the
same data is used across multiple components and features. It is especially
useful in medium and large codebases developed by several teams in parallel:
developers share typed request actions and selectors, while the library owns
the request lifecycle, caching, load deduplication, and action-stream noise.

The same request modules work in client-rendered SPAs and SSR applications. A
server render can dispatch and await requests, then hydrate or merge the cached
request state into the browser store so client components reuse the same
selectors and loaded data.

It is useful when you want the same request lifecycle everywhere:

- `none -> loading -> success`
- `none -> loading -> failed`
- canceled-result suppression
- request-level and global loading selectors
- request caching, optionally separated by serialized parameters
- client-side SPA and SSR request flows
- optional debounce
- optional follow-up actions after success or failure

## Contents

- [What the factory optimizes](#what-the-factory-optimizes)
- [Installation](#installation)
- [Store Setup](#store-setup)
- [Quick Start](#quick-start)
- [React Suspense with `use(promise)`](#react-suspense-with-usepromise)
- [Requests With Parameters](#requests-with-parameters)
- [Updating Cached Data](#updating-cached-data)
- [Global Loading](#global-loading)
- [API Reference](#api-reference)
- [Custom Factory Instances](#custom-factory-instances)
- [SSR](#ssr)
  - [React Server Components](#react-server-components)
- [Examples](#examples)
- [TypeScript](#typescript)
- [License](#license)

## What the factory optimizes

### Request caching and load deduplication

`loadDataAction` checks the request state by request key before starting work.
Calling it repeatedly does not produce repeated network requests:

- while a request is loading, every `loadDataAction` dispatch returns the same
  in-flight `Promise`;
- after a successful request, another `loadDataAction` dispatch uses the cached
  Redux response and skips the request;
- `forcedLoadDataAction` remains available when an explicit reload is needed.

```js
const firstLoad = dispatch(loadDataAction({ id: 1 }));
const duplicateLoad = dispatch(loadDataAction({ id: 1 }));

firstLoad === duplicateLoad; // true while the request is running
```

With `serializeRequestParameters`, each serialized parameter set gets its own
request status, response, error, and in-flight Promise. Components can dispatch
the same load action freely without implementing their own cache or duplicate
request guards.

#### Independent components and parallel team development

This allows components to stay independent. They do not need a shared parent,
an application-level loading coordinator, or knowledge of which component
requested the data first. When components use the same factory instance and
the same serialized request key, the factory starts at most one normal load and
makes its response available to every component through the same selector.

In a large application, a shared request module becomes the contract between
independently developed components. Different developers or feature teams can
use the same load action and selectors without coordinating component mount
order or adding feature-specific request guards. The factory coordinates the
runtime behavior, so one team's component does not create duplicate requests
for data that another team's component is already loading or has already
cached.

```tsx
function UserName({ id }) {
  const dispatch = useDispatch();
  const user = useSelector(state => userSelector(state)({ id }));

  useEffect(() => {
    dispatch(loadUserAction({ id }));
  }, [dispatch, id]);

  return <strong>{user?.name}</strong>;
}

function UserAvatar({ id }) {
  const dispatch = useDispatch();
  const user = useSelector(state => userSelector(state)({ id }));

  useEffect(() => {
    dispatch(loadUserAction({ id }));
  }, [dispatch, id]);

  return user ? <img alt={user.name} src={user.avatarUrl} /> : null;
}
```

These components do not coordinate with each other. If they mount together,
both dispatch the same load action, but only one request runs. When it succeeds,
Redux updates both selector consumers. If either component mounts later, it
immediately reads the cached response and its normal load action does not start
another request.

Teams only need to agree on the shared request module, its parameter contract,
and its serialized request key. Components can then evolve independently while
the request state, caching, deduplication, and result distribution remain
centralized in the factory.

This removes the need for manual request deduplication and cache coordination
between components. The guarantee applies to normal `loadDataAction` calls;
`forcedLoadDataAction` intentionally requests a new execution. When debounce is
enabled, request execution remains subject to its configured timing rules.

Use `forcedLoadDataAction` when a user action or an application event may have
made the cached response stale. For example, after a user completes a level,
the application can explicitly reload that user's data. In this example,
`reloadUserAction` is the user's `forcedLoadDataAction`:

```js
async function handleLevelCompleted(userId) {
  await store.dispatch(completeLevelAction({ userId }));
  await store.dispatch(reloadUserAction({ userId }));
}
```

`completeLevelAction` changes the user on the server. `reloadUserAction` then
bypasses the successful request cache, fetches the updated user, and makes the
fresh response available to every component using the user selector.

The same approach applies to a manual refresh button, a completed mutation, a
WebSocket event, or another freshness trigger. Regular components should keep
using `loadDataAction`; only the code handling the freshness event needs to know
that the cached data must be replaced.

### Shared derived data with Reselect

Factory selectors can be composed with [Reselect](https://reselect.js.org/) to
create application-specific views of a cached response without changing the
response stored in Redux. The factory caches the request and server data;
Reselect separately memoizes filtering, mapping, sorting, aggregation, and
other derived computations.

Install `reselect` as a direct application dependency when composing selectors
in application code:

```sh
npm install reselect
```

Define shared selectors once at module scope and export the same selector
instances to every component that needs them:

```js
import { createSelector } from 'reselect';

import { usersSelector } from './users-request';

export const activeUsersSelector = createSelector(
  [usersSelector],
  users => (users ?? []).filter(user => user.isActive)
);

export const activeUserCountSelector = createSelector(
  [activeUsersSelector],
  users => users.length
);
```

Different components can consume these selectors independently:

```tsx
function ActiveUserList() {
  const users = useSelector(activeUsersSelector);

  return users.map(user => <UserRow key={user.id} user={user} />);
}

function ActiveUserCount() {
  const count = useSelector(activeUserCountSelector);

  return <span>{count} active users</span>;
}
```

As long as the factory response reference has not changed, Reselect reuses the
memoized derived values. Components and feature teams can therefore share
expensive calculations without duplicating either the request or the
calculation. Do not create a shared selector inside a component render; doing
so creates a new memoization cache for every render instead of sharing one
cache between consumers.

### A cleaner Redux action stream

The requests middleware can consume factory command actions internally. When
the application does not need reducers, epics, or other middleware to observe
commands such as `loadDataAction`, disable forwarding globally:

```ts
const { middleware: requestsFactoryMiddleware } =
  createRequestsFactoryMiddleware({
    forwardFactoryActions: false,
  });
```

This keeps factory command actions out of subsequent middleware, reducers, and
the corresponding Redux action stream. Request lifecycle state updates still
reach the built-in reducer. Lazy `requestFulfilledAction` and
`requestRejectedAction` subscription actions are dispatched only when their
action creators have been accessed.

Forwarding can be enabled for the individual commands that an epic or another
consumer actually needs:

```js
dispatch(
  loadDataAction(params, {
    forwardFactoryAction: true,
  })
);
```

This combination keeps repeated loads from creating repeated requests and
keeps unused factory commands and subscription actions from adding noise to the
application's action flow.

## Installation

```sh
npm install redux-requests-factory
```

`redux` is a peer dependency:

```sh
npm install redux
```

## Store Setup

Add the requests reducer under `stateRequestsKey`, then apply the middleware.

```js
import { createStore, applyMiddleware, combineReducers } from 'redux';
import {
  stateRequestsKey,
  requestsReducer,
  createRequestsFactoryMiddleware,
} from 'redux-requests-factory';

export const reducer = combineReducers({
  [stateRequestsKey]: requestsReducer,
  // other reducers
});

const { middleware: requestsFactoryMiddleware } =
  createRequestsFactoryMiddleware({
    forwardFactoryActions: false,
  });

const store = createStore(
  reducer,
  applyMiddleware(requestsFactoryMiddleware)
);

export default store;
```

The default `stateRequestsKey` is `requests`.

### Redux Toolkit

With Redux Toolkit, prepend the requests middleware so it can handle factory
actions before the default thunk middleware:

```ts
import { configureStore } from '@reduxjs/toolkit';
import {
  createRequestsFactoryMiddleware,
  requestsReducer,
  stateRequestsKey,
} from 'redux-requests-factory';

export const makeStore = () => {
  const { middleware: requestsFactoryMiddleware } =
    createRequestsFactoryMiddleware({
      forwardFactoryActions: false,
    });

  return configureStore({
    reducer: {
      [stateRequestsKey]: requestsReducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().prepend(requestsFactoryMiddleware),
  });
};
```

The examples disable factory command forwarding because the application does
not subscribe to those commands. By default, however, command actions are
forwarded as plain objects to the next middleware and reducers. This preserves
support for epics, custom reducers, logging, and Redux DevTools integrations
that observe actions such as `loadDataAction` itself. Enabled request lifecycle
actions are dispatched separately.

Disable forwarding whenever factory commands are implementation details, and
especially when they can be dispatched during render by a Suspense integration:

```ts
const { middleware: requestsFactoryMiddleware } =
  createRequestsFactoryMiddleware({
    forwardFactoryActions: false,
  });
```

With forwarding disabled, requests and the built-in reducer continue to work,
but subsequent middleware and reducers receive the internal request-state
actions plus any lazy fulfilled or rejected actions that have been enabled.

The middleware setting can be overridden for one dispatch:

```ts
dispatch(
  loadDataAction(params, {
    forwardFactoryAction: true,
  })
);
```

Likewise, `forwardFactoryAction: false` suppresses forwarding for one action
when middleware forwarding is enabled globally.

## Quick Start

Create a request module and export only the actions and selectors your app
needs.

```js
import { requestsFactory } from 'redux-requests-factory';

const loadUsersRequest = () =>
  fetch('https://mysite.com/users').then(res => res.json());

export const {
  loadDataAction: loadUsersAction,
  forcedLoadDataAction: reloadUsersAction,
  cancelRequestAction: cancelLoadUsersAction,
  responseSelector: usersSelector,
  errorSelector: usersErrorSelector,
  isLoadingSelector: isLoadingUsersSelector,
  isLoadedSelector: isLoadedUsersSelector,
} = requestsFactory({
  request: loadUsersRequest,
  stateRequestKey: 'users',
});
```

Use the generated API in a component.

```js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  loadUsersAction,
  reloadUsersAction,
  usersSelector,
  isLoadingUsersSelector,
} from './requests/users';

const Users = () => {
  const dispatch = useDispatch();
  const users = useSelector(usersSelector) ?? [];
  const isLoading = useSelector(isLoadingUsersSelector);

  useEffect(() => {
    dispatch(loadUsersAction());
  }, [dispatch]);

  return (
    <div>
      <button onClick={() => dispatch(reloadUsersAction())}>Reload</button>
      {isLoading ? <span>Loading...</span> : null}
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
};
```

`loadDataAction` runs the request only while it has not succeeded yet.
`forcedLoadDataAction` always runs the request again.

`responseSelector` returns the original response, or `undefined` before the
request succeeds. Apply UI defaults such as `?? []` at the rendering boundary.
Use `transformResponse` only when the selector itself should expose a
transformed value.

## React Suspense with `use(promise)`

In a client-rendered React 19 application, `loadDataAction` can provide the
stable in-flight Promise read by React's `use()` API. Suspense handles the
pending state, while response and error data continue to come from normal Redux
selectors.

Disable factory command forwarding for this integration. The hook dispatches a
factory command during render, so that command must not notify later middleware
or Redux subscribers. Internal request-state actions still update the reducer.

```ts
const { middleware: requestsFactoryMiddleware } =
  createRequestsFactoryMiddleware({
    forwardFactoryActions: false,
  });
```

Create a hook that reads the current request status and passes the load Promise
to `use()` only while the request is uninitialized or loading:

```tsx
import { use } from 'react';
import { RequestsStatuses } from 'redux-requests-factory';

import { useAppDispatch, useAppSelector } from './hooks';
import { loadUsersAction, usersStatusSelector } from './users-request';

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

Unlike most React Hooks, `use()` may be called conditionally. The status check
is still important here: it avoids passing a new already-resolved dispatch
Promise to `use()` after success, and lets a failed request render its error
from Redux instead of immediately starting another request.

Read the result and error with selectors as usual:

```tsx
import { Suspense } from 'react';

import { useAppSelector } from './hooks';
import { usersErrorSelector, usersSelector } from './users-request';

function UsersResult() {
  useLoadUsers();

  const users = useAppSelector(usersSelector) ?? [];
  const error = useAppSelector(usersErrorSelector);

  if (error) {
    return <div role="alert">Could not load users.</div>;
  }

  return users.map(user => <div key={user.id}>{user.name}</div>);
}

function Users() {
  return (
    <Suspense fallback={<div>Loading users...</div>}>
      <UsersResult />
    </Suspense>
  );
}
```

Request failures are caught by the factory and stored in Redux, so this pattern
does not require an Error Boundary for normal request errors. The dispatch
Promise resolves only after the request lifecycle finishes; it does not resolve
to the response value.

For an explicit refresh, dispatch `forcedLoadDataAction` normally from the user
event rather than passing it directly to `use()`:

```tsx
import { useAppDispatch } from './hooks';
import { forceLoadUsersAction } from './users-request';

function ForceReloadButton() {
  const dispatch = useAppDispatch();

  return (
    <button onClick={() => dispatch(forceLoadUsersAction())}>
      Force reload
    </button>
  );
}
```

The forced action starts a new request and changes the status to `Loading`.
That render calls `loadUsersAction`, which reuses the exact in-flight Promise
started by the forced action. Do not call `forcedLoadDataAction` or
`doRequestAction` from this render hook: those actions request fresh work and
can create a new Promise on every render.

See the complete
[React `use(promise)` SPA example](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/use-promise).

## Requests With Parameters

Use `serializeRequestParameters` when one logical request has separate cached
states for different parameters.

```js
import { requestsFactory } from 'redux-requests-factory';

const loadUserPostsRequest = ({ userId }) =>
  fetch(`https://mysite.com/posts?userId=${userId}`).then(res => res.json());

export const {
  loadDataAction: loadUserPostsAction,
  forcedLoadDataAction: reloadUserPostsAction,
  responseSelector: userPostsSelector,
  isLoadingSelector: isLoadingUserPostsSelector,
} = requestsFactory({
  request: loadUserPostsRequest,
  stateRequestKey: 'user-posts',
  serializeRequestParameters: ({ userId }) => `${userId}`,
  transformResponse: response => response || [],
});
```

When `serializeRequestParameters` is used, selectors return a function that
accepts the same params.

```js
const postsByUser = useSelector(userPostsSelector);
const isLoadingByUser = useSelector(isLoadingUserPostsSelector);

postsByUser({ userId: 1 });
isLoadingByUser({ userId: 1 });

dispatch(loadUserPostsAction({ userId: 1 }));
dispatch(reloadUserPostsAction({ userId: 1 }));
```

The request state is stored by serialized key:

```js
{
  requests: {
    responses: {
      'user-posts': {
        '1': {
          status: 'success',
          response: []
        }
      }
    }
  }
}
```

## Updating Cached Data

Use `fulfilledActions` and `rejectedActions` to dispatch additional actions
after a request finishes.

```js
import { requestsFactory } from 'redux-requests-factory';

import { setUserPostsAction, userPostsSelector } from './posts-by-user';

const addPostRequest = ({ userId, title, body }) =>
  fetch('https://mysite.com/posts', {
    method: 'POST',
    body: JSON.stringify({ userId, title, body }),
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  }).then(res => res.json());

export const {
  doRequestAction: addPostAction,
  cancelRequestAction: cancelAddPostAction,
  isLoadingSelector: isAddingPostSelector,
} = requestsFactory({
  request: addPostRequest,
  stateRequestKey: 'add-post',
  includeInGlobalLoading: false,
  serializeRequestParameters: ({ userId }) => `${userId}`,
  fulfilledActions: [
    ({ response, request: { userId }, state }) =>
      setUserPostsAction({
        response: [...userPostsSelector(state)({ userId }), response],
        params: { userId },
      }),
  ],
});
```

`setResponseAction` and `setErrorAction` can also be dispatched directly when
you need to write request state manually.

```js
dispatch(
  setResponseAction({
    response: { id: 1, name: 'Ada' },
    params: { id: 1 },
  })
);

dispatch(
  setErrorAction({
    error: new Error('Request failed'),
    params: { id: 1 },
  })
);
```

## Global Loading

Use `isSomethingLoadingSelector` to read global request activity.

```js
import { useSelector } from 'react-redux';
import { isSomethingLoadingSelector } from 'redux-requests-factory';

const isSomethingLoading = useSelector(isSomethingLoadingSelector);
```

Requests are included in global loading by default. Disable that per request:

```js
requestsFactory({
  request: saveDraftRequest,
  stateRequestKey: 'save-draft',
  includeInGlobalLoading: false,
});
```

Or disable it for one dispatch with `silent`.

```js
dispatch(loadDataAction(params, { silent: true }));
dispatch(forcedLoadDataAction(params, { silent: true }));
dispatch(doRequestAction(params, { silent: true }));
dispatch(cancelRequestAction(params, { silent: true }));
```

Use `globalLoadingTimeout` to remove long-running requests from global loading
after a timeout without cancelling them.

```js
requestsFactory({
  request: loadReportRequest,
  stateRequestKey: 'report',
  globalLoadingTimeout: 1000,
});
```

## API Reference

### `createRequestsFactoryMiddleware(config?)`

Creates the Redux middleware and a helper for awaiting requests started through
that middleware instance.

```ts
const { middleware, toPromise } = createRequestsFactoryMiddleware({
  forwardFactoryActions: false,
});
```

| Option | Default | Description |
| --- | --- | --- |
| `forwardFactoryActions` | `true` | Forwards factory command actions as plain Redux actions to later middleware and reducers. Internal request lifecycle actions are unaffected. |

Add `middleware` to the Redux middleware chain. Calling `toPromise()` waits for
the requests tracked by this middleware instance. Dispatching one factory
command returns that command's own `Promise<void>`, which is usually preferable
when only one request must be awaited.

`forwardFactoryActions: false` keeps command actions such as `loadDataAction`
out of later middleware, reducers, loggers, and Redux DevTools. Override the
setting for one supported command with its `forwardFactoryAction` option.

### `requestsFactory(config)`

Creates request-specific actions and selectors.

```js
const request = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/users/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
  serializeRequestParameters: ({ id }) => `${id}`,
  transformResponse: response => response || null,
  transformError: error => error && error.message,
  useDebounce: true,
  debounceWait: 500,
  debounceOptions: {
    leading: true,
    trailing: false,
    maxWait: 500,
  },
  stringifyParamsForDebounce: ({ id }) => `${id}`,
  includeInGlobalLoading: true,
  globalLoadingTimeout: 1000,
  dispatchFulfilledActionForLoadedRequest: false,
  fulfilledActions: [],
  rejectedActions: [],
});
```

### Config

| Option | Required | Default | Description |
| --- | --- | --- | --- |
| `request` | Yes | - | Function that receives params and returns a `Promise`. |
| `stateRequestKey` | Yes | - | Unique key for this request in Redux state. |
| `serializeRequestParameters` | No | - | Converts params to a string cache key. When set, selectors return `(params) => value`. |
| `transformResponse` | No | - | Transforms `responseSelector` output. Commonly used to provide a default value. |
| `transformError` | No | - | Transforms `errorSelector` output and failed-request errors passed to `requestRejectedAction` and `rejectedActions`. |
| `useDebounce` | No | `false` | Enables debounce for `doRequestAction`, `forcedLoadDataAction`, and `loadDataAction`. |
| `debounceWait` | No | `500` | Debounce wait in milliseconds. |
| `debounceOptions` | No | `{ leading: true, trailing: false, maxWait: debounceWait }` | Options passed to `lodash.debounce`. |
| `stringifyParamsForDebounce` | No | `JSON.stringify` | Converts params to a debounce key. |
| `fulfilledActions` | No | `[]` | Actions or action factories dispatched after success. |
| `rejectedActions` | No | `[]` | Actions or action factories dispatched after failure. |
| `includeInGlobalLoading` | No | `true` | Includes this request in `isSomethingLoadingSelector`. |
| `globalLoadingTimeout` | No | - | Removes this request from global loading after the given time in ms. |
| `dispatchFulfilledActionForLoadedRequest` | No | `false` | When `requestFulfilledAction` is enabled, re-dispatches it and `fulfilledActions` for a cached successful `loadDataAction`. |

`fulfilledActions` receive `{ request, response, state }`.
`rejectedActions` receive `{ request, error, state }`.

Each item can be an action, `null`, an array of actions or `null`s, or a
function that returns one of those values.

```js
requestsFactory({
  request: loadUserRequest,
  stateRequestKey: 'user',
  fulfilledActions: [
    { type: 'HIDE_NOTIFICATION' },
    ({ response }) =>
      response ? { type: 'USER_LOADED', payload: response } : null,
  ],
  rejectedActions: [
    ({ error }) => ({
      type: 'SHOW_NOTIFICATION',
      payload: error.message,
    }),
  ],
});
```

### Actions

| Action creator | Behavior |
| --- | --- |
| `loadDataAction(params?, options?)` | Runs the request only if it is not already `loading` or `success`; reuses an in-flight Promise for the same key. |
| `forcedLoadDataAction(params?, options?)` | Bypasses the successful-response cache. Use it for reload flows. |
| `doRequestAction(params?, options?)` | Bypasses the successful-response cache. Use it for create, update, and delete flows. |
| `cancelRequestAction(params?, options?)` | Marks the latest active request for this key as canceled and ignores its eventual result. |
| `setErrorAction({ error, params? })` | Writes an error state and dispatches `requestRejectedAction` when that lifecycle action is enabled. |
| `setResponseAction({ response, params? })` | Writes a success state and dispatches `requestFulfilledAction` when that lifecycle action is enabled. |
| `resetRequestAction(params?)` | Resets status to `RequestsStatuses.None` and clears response and error. |
| `requestFulfilledAction` | Plain action creator for subscriptions. Reading it enables fulfilled lifecycle dispatches. Payload is `{ params, response }`. |
| `requestRejectedAction` | Plain action creator for subscriptions. Reading it enables rejected lifecycle dispatches. Payload is `{ params, error }`. |

#### Lazy lifecycle actions

`requestFulfilledAction` and `requestRejectedAction` are lazy. The factory
dispatches each lifecycle action only after its action creator has been read
from that factory instance. This avoids dispatching actions when no reducer,
epic, saga, or other middleware subscribes to them.

Destructuring an action creator enables its lifecycle dispatches:

```js
const { requestFulfilledAction } = requestsFactory({
  request: loadUserRequest,
  stateRequestKey: 'user',
});
```

After this property access, successful requests and `setResponseAction`
dispatch `requestFulfilledAction`. The flag remains enabled for the lifetime of
that factory instance. The same behavior applies to `requestRejectedAction`,
failed requests, and `setErrorAction`.

Do not spread the factory result. Spreading reads every enumerable property and
therefore enables both lifecycle actions even if the copied properties are
never used:

```js
// BAD: Do not spread a factory result. This enables every lazy lifecycle action.
const allFactoryActions = { ...requestsFactory(config) };
```

Instead, destructure only the actions and selectors that are actually needed:

```js
const { loadDataAction, requestFulfilledAction, responseSelector } =
  requestsFactory(config);
```

`loadDataAction` reuses the Promise of the latest in-flight request for the same
request key. This also applies when that request was started by a forced or
direct request action. Forced and direct actions bypass the successful-response
cache, request fresh work, and become the Promise reused by later normal loads.
The in-flight Promise is removed after it settles. When `useDebounce` is
enabled, all three request-starting actions remain subject to the configured
debounce behavior.

The in-flight Promise, cancellation bookkeeping, and debounce state belong to
the middleware instance returned by `createRequestsFactoryMiddleware()`. They
are not stored globally in the request factory. Reusing singleton request
actions across several stores is therefore safe as long as every store gets
its own middleware instance, which is also the required setup for SSR.

Internally, each `requestsFactory(config)` call creates one stable request
factory runtime key. The key is only an identity token; it contains no mutable
state. Each middleware instance owns a separate `WeakMap` and stores its own
runtime state under that shared key:

```text
middleware A: requestFactoryRuntimeKey -> runtime state A
middleware B: requestFactoryRuntimeKey -> runtime state B
```

Consequently, the same singleton request actions can be dispatched through
several stores without sharing in-flight Promises or cancellation state.

Dispatch promises represent completion, not response values: they resolve to
`void`. A rejected request is normally caught by the factory, written to Redux,
and exposed by `errorSelector`; it is not rethrown through the dispatch Promise.
Render or otherwise handle request errors from Redux state.

`cancelRequestAction` does not abort the underlying network operation or force
its Promise to settle. It changes the request status to `Canceled` and prevents
the eventual response or error from updating Redux. Until the underlying work
settles, `loadDataAction` for the same key still reuses that in-flight Promise.
After it settles, another normal load can start because the status is not
`Success` or `Loading`.

`resetRequestAction` changes only Redux request state. It does not cancel an
active request, so that request can still write its result afterward. Cancel
the active request first when its eventual result must be ignored, then reset
the state if `None` is the desired final status.

`loadDataAction`, `forcedLoadDataAction`, `doRequestAction`, and
`cancelRequestAction` accept an `options` object:

| Option | Behavior |
| --- | --- |
| `silent` | Excludes a started request from global loading state updates. |
| `forwardFactoryAction` | Overrides `forwardFactoryActions` for this dispatch only. |

When canceling a request started with `{ silent: true }`, also pass
`{ silent: true }` to `cancelRequestAction` so the global loading counter is
handled consistently.

```js
dispatch(loadDataAction({ id: 1 }));
dispatch(forcedLoadDataAction({ id: 1 }));
dispatch(doRequestAction({ id: 1 }, { silent: true }));
dispatch(loadDataAction({ id: 1 }, { forwardFactoryAction: false }));
dispatch(cancelRequestAction({ id: 1 }));
dispatch(resetRequestAction({ id: 1 }));
```

#### Integration with Redux Observable, Redux Saga, and other consumers

The built-in requests reducer does not require `requestFulfilledAction` or
`requestRejectedAction`. They are optional, request-specific integration
events for code outside the factory. Use them when an epic, saga, custom
middleware, or application reducer needs to react after a request succeeds or
fails.

Typical uses include starting a dependent workflow, updating another Redux
slice, showing a notification, redirecting, or reporting analytics. Fulfilled
actions carry `{ params, response }`.
Rejected actions carry `{ params, error }`. Errors from failed requests are
processed by `transformError`; `setErrorAction` forwards the error value passed
to it.

With Redux Observable, an epic can subscribe to the fulfilled action:

```js
import { ofType } from 'redux-observable';
import { ignoreElements, tap } from 'rxjs/operators';

export const { requestFulfilledAction } = requestsFactory({
  request: loadUserRequest,
  stateRequestKey: 'user',
});

const userLoadedEpic = action$ =>
  action$.pipe(
    ofType(requestFulfilledAction.type),
    tap(({ payload: { params, response } }) => {
      console.log('User loaded', params, response);
    }),
    ignoreElements()
  );
```

With Redux Saga, a saga can subscribe to the rejected action:

```js
import { put, takeEvery } from 'redux-saga/effects';

export const { requestRejectedAction } = requestsFactory({
  request: loadUserRequest,
  stateRequestKey: 'user',
});

function* handleUserLoadRejected({ payload: { error } }) {
  yield put({
    type: 'SHOW_NOTIFICATION',
    payload: error.message,
  });
}

export function* userRequestsSaga() {
  yield takeEvery(requestRejectedAction.type, handleUserLoadRejected);
}
```

Reading these action creators for the subscription enables their lazy
dispatches for that factory instance. If no external consumer needs them, do
not destructure them and the factory leaves those actions out of the Redux
stream.

### Selectors

| Selector | Without `serializeRequestParameters` | With `serializeRequestParameters` |
| --- | --- | --- |
| `responseSelector` | `state => response` | `state => params => response` |
| `errorSelector` | `state => error` | `state => params => error` |
| `requestStatusSelector` | `state => RequestsStatuses` | `state => params => RequestsStatuses` |
| `isLoadingSelector` | `state => boolean` | `state => params => boolean` |
| `isLoadedSelector` | `state => boolean` | `state => params => boolean` |

Available statuses:

```js
import { RequestsStatuses } from 'redux-requests-factory';

RequestsStatuses.None;
RequestsStatuses.Loading;
RequestsStatuses.Success;
RequestsStatuses.Failed;
RequestsStatuses.Canceled;
```

`responseSelector` returns `undefined` until a response exists unless
`transformResponse` provides another value.

`errorSelector` similarly returns `undefined` until an error exists unless
`transformError` provides another value.

```js
const { responseSelector } = requestsFactory({
  request: loadUsersRequest,
  stateRequestKey: 'users',
  transformResponse: response => response || [],
});

responseSelector(state); // []
```

### Request-state hydration

`requestsStateSelector` returns the complete requests slice without exposing
the configured `stateRequestsKey`:

```ts
const requestsState = requestsStateSelector(store.getState());
```

Dispatch `hydrateRequestsAction` to merge that slice into another store using
the standard `requestsReducer`:

```ts
store.dispatch(hydrateRequestsAction(requestsState));
```

The reducer applies these rules:

- the receiving store keeps its current global loading count;
- different `stateRequestKey` values are merged;
- different `serializedKey` values for a parameterized request are merged;
- the same `stateRequestKey` and `serializedKey` identity is replaced by the
  hydrated request state.

The action creator is tied to its factory instance. When multiple custom
factories are mounted in one store, only the matching reducer handles the
hydration action.

## Custom Factory Instances

Use the default export when you need more than one independent request factory,
for example to store request states under different reducer keys.

```js
import createReduxRequestsFactory from 'redux-requests-factory';

export const apiOne = createReduxRequestsFactory({
  stateRequestsKey: 'apiOne',
});

export const apiTwo = createReduxRequestsFactory({
  stateRequestsKey: 'apiTwo',
});
```

Each instance provides the same API:

```js
const {
  stateRequestsKey,
  createRequestsFactoryMiddleware,
  requestsFactory,
  requestsReducer,
  isSomethingLoadingSelector,
  requestsStateSelector,
  hydrateRequestsAction,
} = createReduxRequestsFactory({
  stateRequestsKey: 'api',
});
```

## SSR

Dispatching a request-factory action returns a promise for that action. Await it
when the next step depends on one specific request:

```ts
await store.dispatch(loadUsersAction());
```

`createRequestsFactoryMiddleware()` also returns `toPromise`, which resolves
when all currently tracked requests finish. It is useful when several requests
are deliberately started together.

```js
const makeStore = initialState => {
  const { middleware, toPromise } = createRequestsFactoryMiddleware({
    forwardFactoryActions: false,
  });

  const store = createStore(
    reducer,
    initialState,
    applyMiddleware(middleware)
  );

  store.asyncRequests = toPromise;

  return store;
};
```

Call `createRequestsFactoryMiddleware()` inside `makeStore`. Every SSR request
then gets its own store, middleware, tracked-request set, in-flight Promise
cache, cancellation state, and debounce state. Request action modules can stay
as application-level singletons without leaking runtime state between server
requests. Their stable request factory keys identify the request definition in
each middleware's private runtime map; the keys themselves do not hold cache
data.

In Next.js Pages Router, dispatch request actions in `getServerSideProps` and
then wait for them before returning props.

```ts
export const getServerSideProps = wrapper.getServerSideProps(
  (store) => async () => {
    await store.dispatch(loadUsersAction());

    return {
      props: {},
    };
  }
);
```

You can also chain dependent requests by reading the Redux state after the first
await.

```ts
export const getServerSideProps = wrapper.getServerSideProps(
  (store) => async () => {
    await store.dispatch(loadUsersAction());

    const users = usersSelector(store.getState());

    users.forEach(({ id }) => {
      store.dispatch(loadUserPostsAction({ userId: id }));
    });

    await store.asyncRequests();

    return {
      props: {},
    };
  }
);
```

See the [Next.js Pages Router example](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/next-js/with-redux-pages-router)
for a complete setup with `next-redux-wrapper`.

For a new framework-free React 19 SSR integration, start with the
[modern streaming SSR example](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/ssr-render-to-pipeable-stream-use).
It is the primary SSR reference in this repository and demonstrates the full
document lifecycle with `renderToPipeableStream`, component-owned data loading,
`use(promise)`, independent `Suspense` boundaries, progressive HTML streaming,
Redux state transfer, `hydrateRoot`, and React Router navigation.

### React `renderToString`

The classic React SSR examples show two ways to decide which requests must
finish before HTML is returned:

| Approach | Server flow | Best fit |
| --- | --- | --- |
| [Route-level preloading](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/ssr-render-to-string) | Dispatch known route actions, await them, render once | Routes with an explicit data-loading contract |
| [Component-driven loading](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/ssr-render-to-string-component-data) | Discovery render, `await store.asyncRequests()`, result render | Pages where nested components own and dynamically declare their requests |

In the preloading approach, the server entry knows all data required by the
route. In the component-driven approach, a loading hook dispatches immediately
during server rendering and uses `useEffect` in the browser. The first server
render mounts only the requested route and discovers its actions; after the
aggregate promise settles, the second render reads the loaded state and its HTML
is sent to the client.

### React `renderToPipeableStream`

The [modern Suspense and `use(promise)` streaming example](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/ssr-render-to-pipeable-stream-use)
is the recommended reference for new React SSR integrations. It combines the
current React 19 primitives without a framework:

- `renderToPipeableStream` renders the complete `<html>`, `<head>`, and
  `<body>` document;
- data loading stays inside the components that consume it;
- components pass stable middleware-owned dispatch Promises directly to
  `use`;
- independent `Suspense` boundaries let React flush the shell and fallbacks
  first, then stream completed content as each request resolves;
- a final boundary transfers the completed Redux state and starts
  `hydrateRoot(document, ...)` without repeating server requests;
- React Router takes over navigation after hydration, while a full reload
  performs a fresh isolated SSR render.

This example is the clearest demonstration of how the library supports modern
progressive SSR: request modules remain singleton application code, while every
server request creates its own store, middleware runtime, Promise cache, and
React stream.

For comparison, the simpler
[preload-first streaming example](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/ssr-render-to-pipeable-stream)
loads all route data before starting the React stream. It still renders the
complete document and hydrates it with `hydrateRoot`, but it does not stream
data-driven `Suspense` boundaries independently.

### React Server Components

Create a new store for every server render. After its requests finish, pass the
requests slice—not the store object—across the Server/Client Component boundary.
Responses and errors included in that state must be serializable.

```tsx
import { requestsStateSelector } from 'redux-requests-factory';

export default async function ServerUsers() {
  const store = makeStore();

  await store.dispatch(loadUsersAction());

  const requestsState = requestsStateSelector(store.getState());

  return (
    <RequestsHydrator requestsState={requestsState}>
      <Users />
    </RequestsHydrator>
  );
}
```

`RequestsHydrator` can dispatch the state into a store owned by a shared client
Provider:

```tsx
'use client';

import { useLayoutEffect } from 'react';
import { useStore } from 'react-redux';
import {
  hydrateRequestsAction,
  type RequestsState,
} from 'redux-requests-factory';

type Props = {
  children: React.ReactNode;
  requestsState: RequestsState;
};

const RequestsHydrator = ({ children, requestsState }: Props) => {
  const store = useStore();

  useLayoutEffect(() => {
    store.dispatch(hydrateRequestsAction(requestsState));
  }, [requestsState, store]);

  return children;
};
```

Place the shared Provider in a layout when its browser store should survive
client-side navigation:

```tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
```

Because that Provider already exists above the route, a nested component must
not dispatch hydration during render. The layout effect reconciles the state
after commit and before passive effects such as a component's client-side load
effect. If request data must be present in the initial HTML generated by client
components, use a route-level Provider initialized with `preloadedState`
instead of a shared layout Provider.

#### Reading the server promise with React `use`

A synchronous Server Component can start loading without awaiting and pass the
promise to a Client Component inside `Suspense`:

```tsx
export default function Page() {
  const requestsStatePromise = loadUsersRequestsState();

  return (
    <Suspense fallback={<UsersSkeleton />}>
      <RequestsPromise requestsStatePromise={requestsStatePromise}>
        <Users />
      </RequestsPromise>
    </Suspense>
  );
}
```

The Client Component reads the promise with React's `use()` API:

```tsx
'use client';

import { use } from 'react';

function RequestsPromise({ children, requestsStatePromise }) {
  const requestsState = use(requestsStatePromise);

  return (
    <RequestsHydrator requestsState={requestsState}>
      {children}
    </RequestsHydrator>
  );
}
```

`loadUsersRequestsState()` creates a request-scoped store, awaits
`store.dispatch(loadUsersAction())`, and resolves to the serializable requests
slice. The dispatch promise tracks only that action; unlike
`store.asyncRequests()`, it does not wait for unrelated requests. Pass the state
promise across the Server/Client boundary, never the Redux store itself.

#### Loading several requests with one server store

Dispatch every independent request before awaiting. They start concurrently,
and one `asyncRequests()` call waits for all requests currently tracked by that
middleware instance.

```tsx
export default async function Page() {
  const store = makeStore();

  store.dispatch(loadUsersAction());
  store.dispatch(loadPostsAction());
  store.dispatch(loadSettingsAction());

  await store.asyncRequests();

  return (
    <RequestsHydrator
      requestsState={requestsStateSelector(store.getState())}
    >
      <Users />
      <Posts />
      <Settings />
    </RequestsHydrator>
  );
}
```

#### Streaming independent server components

For finer streaming, give each async Server Component its own request-scoped
store and `Suspense` boundary:

```tsx
export default function Page() {
  return (
    <>
      <Suspense fallback={<UsersSkeleton />}>
        <ServerUsers />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <ServerPosts />
      </Suspense>
      <Suspense fallback={<SettingsSkeleton />}>
        <ServerSettings />
      </Suspense>
    </>
  );
}
```

Each component hydrates only the request state created in its temporary store.
The library reducer merges those independently arriving request keys into the
one browser store owned by the shared Provider.

See the [complete Next.js App Router example](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/next-js/redux-app),
including [batched server loading](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/next-js/redux-app/app/server-redux-batch)
and [independent streamed components](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/next-js/redux-app/app/server-redux-streams).

## Examples

- [All examples](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples)
- [React + Vite examples](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react)
- [React + Vite: simple](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/simple)
- [Recommended: modern React streaming SSR with `Suspense` and `use(promise)`](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/ssr-render-to-pipeable-stream-use)
- [React SSR with `renderToString`: route-level preloading](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/ssr-render-to-string)
- [React SSR with `renderToString`: component-driven two-pass loading](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/ssr-render-to-string-component-data)
- [React streaming SSR with `renderToPipeableStream`](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/ssr-render-to-pipeable-stream)
- [React `use(promise)` SPA](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/use-promise)
- [Next.js Pages Router](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/next-js/with-redux-pages-router)
- [Next.js App Router](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/next-js/redux-app)
- [React + Vite: Redux Observable](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/with-redux-observable)

## TypeScript

The package ships with TypeScript declarations and JSDoc for its public
configuration, actions, selectors, middleware, and request-state types. Editors
such as VS Code show the request behavior and option defaults directly in
IntelliSense.

### Request type inference

Define parameter, response, and transformed error types on the request
boundary. `requestsFactory` carries them into its actions and selectors without
requiring explicit factory generics:

```ts
import { requestsFactory } from 'redux-requests-factory';

type User = {
  id: number;
  name: string;
};

type LoadUserParams = {
  id: number;
};

type RequestError = {
  message: string;
};

const loadUserRequest = async ({ id }: LoadUserParams): Promise<User> => {
  const response = await fetch(`/api/users/${id}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<User>;
};

export const {
  loadDataAction: loadUserAction,
  responseSelector: userSelector,
  errorSelector: userErrorSelector,
} = requestsFactory({
  request: loadUserRequest,
  stateRequestKey: 'user',
  serializeRequestParameters: ({ id }) => `${id}`,
  transformError: (error): RequestError | undefined =>
    error === undefined
      ? undefined
      : {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
});
```

TypeScript now requires `{ id: number }` when calling `loadUserAction`. The
parameterized `userSelector(state)` returns a function whose result is
`User | undefined`, and `userErrorSelector(state)` uses the transformed
`RequestError | undefined` type.

### Typed Redux dispatch

Redux Toolkit includes the request middleware's dispatch extension in the
inferred store type when the middleware is added through `configureStore`. Use
the normal inferred dispatch type:

```ts
export type AppDispatch = AppStore['dispatch'];
```

With `createStore` and `applyMiddleware`, combine the store dispatch with the
exported `RequestsFactoryDispatch` overload so dispatching a factory command is
typed as `Promise<void>`:

```ts
import type { RequestsFactoryDispatch } from 'redux-requests-factory';

export type AppDispatch = RequestsFactoryDispatch & typeof store.dispatch;
```

React Redux typed hooks can then use those store types:

```ts
import { useDispatch, useSelector } from 'react-redux';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

### Exported types

Commonly useful public types include:

- `RequestsState`, `RequestState`, and `RequestsStatuses` for stored request
  state and SSR hydration boundaries;
- `RequestsFactoryDispatch` for plain Redux stores;
- `ActionOptions` and `MiddlewareConfig` for reusable configuration helpers;
- `ReduxRequestsFactory` for code that accepts a custom factory instance;
- request config, action, and selector types for advanced wrappers around
  `requestsFactory`.

Prefer inference from `requestsFactory` and the configured store in application
code. Import the explicit public types when data crosses a module boundary or
when building reusable abstractions around the library.

Examples:

- [TypeScript + React + Vite](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/simple)
- [Recommended: TypeScript + modern React streaming SSR with `Suspense` and `use(promise)`](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/ssr-render-to-pipeable-stream-use)
- [TypeScript + React SSR with route-level preloading](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/ssr-render-to-string)
- [TypeScript + React SSR with component-driven two-pass loading](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/ssr-render-to-string-component-data)
- [TypeScript + React streaming SSR with `renderToPipeableStream`](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/react/ssr-render-to-pipeable-stream)
- [TypeScript + Next.js Pages Router](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/next-js/with-redux-pages-router)
- [TypeScript + Next.js App Router](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/next-js/redux-app)

## License

MIT
