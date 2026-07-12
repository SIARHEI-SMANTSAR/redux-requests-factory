# Redux Requests Factory

[![npm version](https://img.shields.io/npm/v/redux-requests-factory.svg?style=flat-square)](https://www.npmjs.com/package/redux-requests-factory)
[![npm downloads](https://img.shields.io/npm/dm/redux-requests-factory.svg?style=flat-square)](https://www.npmjs.com/package/redux-requests-factory)

`redux-requests-factory` is a small Redux helper for request state. It creates
typed action creators, selectors, a reducer, and middleware for async requests.

It is useful when you want the same request lifecycle everywhere:

- `none -> loading -> success`
- `none -> loading -> failed`
- request cancellation
- request-level and global loading selectors
- optional caching by request parameters
- optional debounce
- optional follow-up actions after success or failure

## Contents

- [Installation](#installation)
- [Store Setup](#store-setup)
- [Quick Start](#quick-start)
- [Requests With Parameters](#requests-with-parameters)
- [Updating Cached Data](#updating-cached-data)
- [Global Loading](#global-loading)
- [API Reference](#api-reference)
- [Custom Factory Instances](#custom-factory-instances)
- [SSR](#ssr)
- [Examples](#examples)
- [TypeScript](#typescript)
- [License](#license)

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
  createRequestsFactoryMiddleware();

const store = createStore(
  reducer,
  applyMiddleware(requestsFactoryMiddleware)
);

export default store;
```

The default `stateRequestsKey` is `requests`.

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
  transformResponse: response => response || [],
});
```

Use the generated API in a component.

```js
import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  loadUsersAction,
  reloadUsersAction,
  usersSelector,
  isLoadingUsersSelector,
} from './requests/users';

const Users = () => {
  const dispatch = useDispatch();
  const users = useSelector(usersSelector);
  const isLoading = useSelector(isLoadingUsersSelector);

  const loadUsers = useCallback(() => {
    dispatch(loadUsersAction());
  }, [dispatch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
| `transformError` | No | - | Transforms `errorSelector` output and rejected action payloads. |
| `useDebounce` | No | `false` | Enables debounce for `doRequestAction`, `forcedLoadDataAction`, and `loadDataAction`. |
| `debounceWait` | No | `500` | Debounce wait in milliseconds. |
| `debounceOptions` | No | `{ leading: true, trailing: false, maxWait: debounceWait }` | Options passed to `lodash.debounce`. |
| `stringifyParamsForDebounce` | No | `JSON.stringify` | Converts params to a debounce key. |
| `fulfilledActions` | No | `[]` | Actions or action factories dispatched after success. |
| `rejectedActions` | No | `[]` | Actions or action factories dispatched after failure. |
| `includeInGlobalLoading` | No | `true` | Includes this request in `isSomethingLoadingSelector`. |
| `globalLoadingTimeout` | No | - | Removes this request from global loading after the given time in ms. |
| `dispatchFulfilledActionForLoadedRequest` | No | `false` | Re-dispatches fulfilled side effects when `loadDataAction` is called for an already loaded request. |

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
| `loadDataAction(params?, options?)` | Runs the request only if it is not already `loading` or `success`. |
| `forcedLoadDataAction(params?, options?)` | Runs the request every time. Use it for reload flows. |
| `doRequestAction(params?, options?)` | Runs the request every time. Use it for create, update, and delete flows. |
| `cancelRequestAction(params?, options?)` | Cancels the latest active request for this key. |
| `setErrorAction({ error, params? })` | Writes an error state and dispatches `requestRejectedAction` when it is used. |
| `setResponseAction({ response, params? })` | Writes a success state and dispatches `requestFulfilledAction` when it is used. |
| `resetRequestAction(params?)` | Resets status to `RequestsStatuses.None` and clears response and error. |
| `requestFulfilledAction` | Plain action creator for subscriptions. Payload is `{ params, response }`. |
| `requestRejectedAction` | Plain action creator for subscriptions. Payload is `{ params, error }`. |

The `options` object currently supports `silent`.

```js
dispatch(loadDataAction({ id: 1 }));
dispatch(forcedLoadDataAction({ id: 1 }));
dispatch(doRequestAction({ id: 1 }, { silent: true }));
dispatch(cancelRequestAction({ id: 1 }));
dispatch(resetRequestAction({ id: 1 }));
```

Use `requestFulfilledAction` and `requestRejectedAction` with middleware such
as `redux-observable` or `redux-saga`.

```js
import { ofType } from 'redux-observable';
import { ignoreElements, tap } from 'rxjs/operators';

export const { requestFulfilledAction } = requestsFactory({
  request: loadUserRequest,
  stateRequestKey: 'user',
});

const userLoadedEpic = action$ =>
  action$.pipe(
    ofType(requestFulfilledAction),
    tap(({ payload: { params, response } }) => {
      console.log('User loaded', params, response);
    }),
    ignoreElements()
  );
```

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

```js
const { responseSelector } = requestsFactory({
  request: loadUsersRequest,
  stateRequestKey: 'users',
  transformResponse: response => response || [],
});

responseSelector(state); // []
```

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
} = createReduxRequestsFactory({
  stateRequestsKey: 'api',
});
```

## SSR

`createRequestsFactoryMiddleware()` returns `toPromise`, which resolves when
all currently tracked requests finish.

```js
const makeStore = initialState => {
  const { middleware, toPromise } = createRequestsFactoryMiddleware();

  const store = createStore(
    reducer,
    initialState,
    applyMiddleware(middleware)
  );

  store.asyncRequests = toPromise;

  return store;
};
```

On the server, dispatch request actions and then wait for them.

```js
const loadData = async ({ isServer, store }) => {
  store.dispatch(loadUsersAction());

  if (isServer) {
    await store.asyncRequests();
  }
};
```

## Examples

- [All examples](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples)
- [Create React App](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/create-react-app)
- [Create React App simple modern](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/create-react-app/simple-modern)
- [Create React App simple legacy](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/create-react-app/simple-legacy)
- [Next.js](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/next-js)
- [Redux Observable modern](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/create-react-app/with-redux-observable-modern)
- [Redux Observable legacy](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/create-react-app/with-redux-observable-legacy)

## TypeScript

The package ships with TypeScript declarations.

Examples:

- [TypeScript + Create React App modern](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/create-react-app/simple-modern)
- [TypeScript + Next.js](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/next-js)

## License

MIT
