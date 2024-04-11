# Redux Requests Factory

[![npm version](https://img.shields.io/npm/v/redux-requests-factory.svg?style=flat-square)](https://www.npmjs.com/package/redux-requests-factory)
[![npm downloads](https://img.shields.io/npm/dm/redux-requests-factory.svg?style=flat-square)](https://www.npmjs.com/package/redux-requests-factory)

```js
npm install redux-requests-factory

// or

npm install redux-requests-factory --save
```

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Redux Requests Factory](#redux-requests-factory)
  - [Table of Contents](#table-of-contents)
  - [Examples](#examples)
  - [Installation](#installation)
    - [store.js](#storejs)
  - [Usage](#usage)
  - [Example](#example)
    - [requests/users.js](#requestsusersjs)
    - [requests/posts-by-user.js](#requestsposts-by-userjs)
    - [requests/add-post.js](#requestsadd-postjs)
    - [App.js](#appjs)
  - [Requests Factory Config](#requests-factory-config)
    - [Required](#required)
      - [`config.request`](#configrequest)
      - [`config.stateRequestKey`](#configstaterequestkey)
    - [Serialize](#serialize)
      - [`config.serializeRequestParameters`](#configserializerequestparameters)
    - [Debounce](#debounce)
      - [`config.useDebounce`](#configusedebounce)
      - [`config.debounceWait`](#configdebouncewait)
      - [`config.debounceOptions`](#configdebounceoptions)
      - [`config.stringifyParamsForDebounce`](#configstringifyparamsfordebounce)
    - [Transform](#transform)
      - [`config.transformError`](#configtransformerror)
      - [`config.transformResponse`](#configtransformresponse)
    - [Actions](#actions)
      - [`config.rejectedActions`](#configrejectedactions)
      - [`config.fulfilledActions`](#configfulfilledactions)
    - [Global Loading](#global-loading)
      - [`config.includeInGlobalLoading`](#configincludeingloballoading)
      - [`config.globalLoadingTimeout`](#configgloballoadingtimeout)
    - [Others](#others)
      - [`config.dispatchFulfilledActionForLoadedRequest`](#configdispatchfulfilledactionforloadedrequest)
  - [Requests Factory Instance](#requests-factory-instance)
    - [Requests Factory Instance Actions](#requests-factory-instance-actions)
      - [`loadDataAction`](#loaddataaction)
      - [`forcedLoadDataAction`](#forcedloaddataaction)
      - [`doRequestAction`](#dorequestaction)
      - [`cancelRequestAction`](#cancelrequestaction)
      - [`requestFulfilledAction`](#requestfulfilledaction)
      - [`requestRejectedAction`](#requestrejectedaction)
      - [`setErrorAction`](#seterroraction)
      - [`setResponseAction`](#setresponseaction)
      - [`resetRequestAction`](#resetrequestaction)
    - [Selectors](#selectors)
      - [`responseSelector`](#responseselector)
      - [`errorSelector`](#errorselector)
      - [`requestStatusSelector`](#requeststatusselector)
      - [`isLoadingSelector`](#isloadingselector)
      - [`isLoadedSelector`](#isloadedselector)
  - [Global Selectors](#global-selectors)
    - [`isSomethingLoadingSelector`](#issomethingloadingselector)
  - [Create Redux Requests Factory](#create-redux-requests-factory)
  - [SSR](#ssr)
  - [TypeScript](#typescript)
  - [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Examples

[All examples](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples)

[create-react-app](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/create-react-app)

[next.js](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/next-js)

[redux-observabl](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/create-react-app/with-redux-observable)

## Installation

`redux-requests-factory` is available on [npm](https://www.npmjs.com/package/redux-requests-factory).

```js
npm install redux-requests-factory
```

### store.js

```js
import { createStore, applyMiddleware, combineReducers } from 'redux';
import {
  stateRequestsKey,
  requestsReducer,
  createRequestsFactoryMiddleware,
} from 'redux-requests-factory';

export const reducer = combineReducers({
  [stateRequestsKey]: requestsReducer,
  // ... others reducers
});

const {
  middleware: requestsFactoryMiddleware,
} = createRequestsFactoryMiddleware();

const reduxMiddleware = applyMiddleware(requestsFactoryMiddleware);

const store = createStore(reducer, reduxMiddleware);

export default store;
```

## Usage

```js
import { requestsFactory } from 'redux-requests-factory';

const loadUsersRequest = () =>
  fetch('https://mysite.com/users').then(res => res.json());

export const {
  // actions
  loadDataAction, // do request once (can be dispatched many times, but do request once)
  forcedLoadDataAction, // do request every time (used when need reload data)
  doRequestAction, // do request every time (used for create, update and delete requests)
  cancelRequestAction, // cancel request
  requestFulfilledAction, // dispatched when request fulfilled
  requestRejectedAction, // dispatched when request rejected
  setErrorAction, // set custom Error for this request (requestRejectedAction will be dispatched)
  setResponseAction, // set response for this request (requestFulfilledAction will be dispatched)
  resetRequestAction, // reset request data
  // selectors
  responseSelector, // returns `response || []`
  errorSelector, // returns Error when request rejected or undefined
  requestStatusSelector, // returns request status ('none', 'loading', 'success', 'failed', 'canceled')
  isLoadingSelector, // returns true when request status === 'loading'
  isLoadedSelector, // returns true when request status === 'success'
} = requestsFactory({
  request: loadUsersRequest,
  stateRequestKey: 'users',
  transformResponse: response => response || [],
});
```

```js
import React from 'react';
import { useSelector } from 'react-redux';
import { isSomethingLoadingSelector } from 'redux-requests-factory';

const App = () => {
  const isSomethingLoading = useSelector(isSomethingLoadingSelector); // returns true when something loads

  return <>{isSomethingLoading ? <div>'Something Loading...'</div> : null}</>;
};
```

## Example

### requests/users.js

<details>
  <summary>Click to expand example!</summary>

```js
import { requestsFactory } from 'redux-requests-factory';

const loadUsersRequest = () =>
  fetch('https://mysite.com/users').then(res => res.json());

export const {
  loadDataAction: loadUsersAction, // do request once
  forcedLoadDataAction: forcedLoadUsersAction, // do request every time
  cancelRequestAction: cancelLoadUsersAction,
  responseSelector: usersSelector, // return `response || []`
  errorSelector: loadUsersErrorSelector,
  isLoadingSelector: isLoadingUsersSelector,
  isLoadedSelector: isLoadedUsersSelector,
} = requestsFactory({
  request: loadUsersRequest,
  stateRequestKey: 'users',
  transformResponse: response => response || [],
});
```

</details>

### requests/posts-by-user.js

<details>
  <summary>Click to expand example!</summary>

```js
import { requestsFactory } from 'redux-requests-factory';

const loadUserPostsRequest = ({ userId }) =>
  fetch(`https://mysite.com/posts?userId=${userId}`).then(res => res.json());

export const {
  loadDataAction: loadUserPostsAction,
  forcedLoadDataAction: forcedLoadUserPostsAction,
  setResponseAction: setUserPostsAction,
  responseSelector: userPostsSelector, // return function `({ userId }) => response || []`
} = requestsFactory({
  request: loadUserPostsRequest,
  stateRequestKey: 'user-posts',
  useDebounce: true,
  serializeRequestParameters: ({ userId }) => `${userId}`, // selector will return function
  transformResponse: response => response || [],
});
```

</details>

### requests/add-post.js

<details>
  <summary>Click to expand example!</summary>

```js
import { requestsFactory } from 'redux-requests-factory';

import { setUserPostsAction, userPostsSelector } from './posts-by-user';

const addPostRequest = ({ userId, title, body }) =>
  fetch('https://mysite.com/posts', {
    method: 'POST',
    body: JSON.stringify({
      title,
      body,
      userId,
    }),
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  }).then(res => res.json());

export const {
  doRequestAction: addPostAction,
  cancelRequestAction: cancelAddPostAction,
  isLoadingSelector: isLoadingAddPostSelector,
} = requestsFactory({
  request: addPostRequest,
  stateRequestKey: 'add-post',
  includeInGlobalLoading: false, // not include in isSomethingLoadingSelector
  serializeRequestParameters: ({ userId }) => `${userId}`,
  fulfilledActions: [
    // this actions calls when addPostRequest fulfilled
    ({ response, request: { userId }, state }) => {
      return setUserPostsAction({
        response: [...userPostsSelector(state)({ userId }), response],
        params: { userId },
      });
    },
  ],
});
```

</details>

### App.js

<details>
  <summary>Click to expand example!</summary>

```js
import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isSomethingLoadingSelector } from 'redux-requests-factory';

import {
  loadUsersAction,
  forcedLoadUsersAction,
  cancelLoadUsersAction,
  usersSelector,
} from '../requests/users';
import {
  loadUserPostsAction,
  userPostsSelector,
  forcedLoadUserPostsAction,
} from '../requests/posts-by-user';
import {
  addPostAction,
  isLoadingAddPostSelector,
  cancelAddPostAction,
} from '../requests/add-post';

const App = () => {
  const dispatch = useDispatch();

  const users = useSelector(usersSelector);
  const postsByUser = useSelector(userPostsSelector);
  const isSomethingLoading = useSelector(isSomethingLoadingSelector);
  const isLoadingAddPost = useSelector(isLoadingAddPostSelector);

  const onLoadUsers = useCallback(() => dispatch(loadUsersAction()), [
    dispatch,
  ]);
  const onForcedLoadUsers = useCallback(
    () => dispatch(forcedLoadUsersAction()),
    [dispatch]
  );
  const onCancelLoadUsers = useCallback(
    () => dispatch(cancelLoadUsersAction()),
    [dispatch]
  );
  const onLoadUserPosts = useCallback(
    userId => dispatch(loadUserPostsAction({ userId })),
    [dispatch]
  );
  const onForcedLoadUserPosts = useCallback(
    event => {
      dispatch(
        forcedLoadUserPostsAction({
          userId: event.currentTarget.dataset.userId,
        })
      );
    },
    [dispatch]
  );
  const onAddPost = useCallback(
    even => {
      event.preventDefault();
      const form = event.currentTarget;
      const elements = form.elements;
      const userId = form.dataset.userId;

      dispatch(cancelAddPostAction({ userId }));
      dispatch(
        addPostAction({
          userId,
          title: elements.title.value,
          body: elements.body.value,
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    onLoadUsers();
  }, [onLoadUsers]);

  useEffect(() => {
    if (users) {
      users.forEach(({ id }) => {
        onLoadUserPosts(id);
      });
    }
  }, [users, onLoadUserPosts]);

  return (
    <div>
      <div>{isSomethingLoading ? 'Something Loading...' : null}</div>

      <button onClick={onLoadUsers}>Load Users</button>
      <button onClick={onForcedLoadUsers}>Forced Load Users</button>
      <button onClick={onCancelLoadUsers}>Cancel Load Users</button>

      <ul>
        {users.map(({ id, name }) => (
          <li key={id}>
            {name}
            <ul>
              {postsByUser({ userId: id }).map(({ id, title }, index) => (
                <li key={`${id}_${index}`}>{title}</li>
              ))}
              <button data-user-id={id} onClick={onForcedLoadUserPosts}>
                Forced Load User Posts With Debounce 500ms
              </button>
              <form data-user-id={id} onSubmit={onAddPost}>
                <h3>Add new post </h3>
                <label>
                  Title
                  <input id={`title_${id}`} name="title" />
                </label>
                <label>
                  Body
                  <textarea name="body" />
                </label>
                <button
                  type="submit"
                  disabled={isLoadingAddPost({ userId: id })}
                >
                  {isLoadingAddPost({ userId: id }) ? 'Loading...' : 'Add'}
                </button>
              </form>
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
```

</details>

## Requests Factory Config

```js
import { requestsFactory } from 'redux-requests-factory';

const {...} = requestsFactory({
  request: ({ id }) => fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
  serializeRequestParameters: ({ id }) => `${id}`,
  // Debounce
  useDebounce: true,
  debounceWait: 500,
  stringifyParamsForDebounce: ({ id }) => `${id}`,
  debounceOptions: {
    leading: true,
    trailing: false,
    maxWait: 500,
  },
  // Request rejected
  transformError: (error) => error && error.message,
  rejectedActions: [({ error, request: { id }, state }) => {
    // return the actions that should be dispatched when request is rejected
    return { type: 'SHOW_NOTIFICATION' }
  }],
  // Request fulfilled
  transformResponse: (response) => response || {},
  fulfilledActions: [({ response, request: { id }, state }) => {
    // return the actions that should be dispatched when request is fulfilled
    return { type: 'SHOW_NOTIFICATION' }
  }],
  // Loading
  includeInGlobalLoading: true,
});
```

### Required

#### `config.request`

`request` is **required** field, it is should be function that takes parameters (or not) and returns `Promise`

with params:

```js
const {
  doRequestAction,
  forcedLoadDataAction,
  loadDataAction,
} = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
});

doRequestAction({ id: 1 });
// or
forcedLoadDataAction({ id: 1 });
// or
loadDataAction({ id: 1 });
```

or without params:

```js
const {
  doRequestAction,
  forcedLoadDataAction,
  loadDataAction,
} = requestsFactory({
  request: () => fetch('https://mysite.com/api/users').then(res => res.json()),
  stateRequestKey: 'users',
});

doRequestAction();
// or
forcedLoadDataAction();
// or
loadDataAction();
```

#### `config.stateRequestKey`

`stateRequestKey` is **required** field, it is should be unique string key between all requests

```js
const {...} = requestsFactory({
  stateRequestKey: 'users',
});

const {...} = requestsFactory({
  stateRequestKey: 'user-posts',
});

// Now the state is like here
// state = {
//   [stateRequestsKey]: {
//     responses: {
//       users: {
//         status: RequestsStatuses.None,
//         response: undefined,
//         error: undefined,
//       },
//       'user-posts': {
//         status: RequestsStatuses.None,
//         response: undefined,
//         error: undefined,
//       },
//     },
//   },
// };

```

### Serialize

#### `config.serializeRequestParameters`

`serializeRequestParameters` is **not required** field, it is should be function that takes parameters and returns `string`.

When used `serializeRequestParameters` all selectors return function that takes parameters and returns selected value.
When used `serializeRequestParameters` params are required for all actions.

```js
const {
  loadDataAction,
  forcedLoadDataAction,
  doRequestAction,
  cancelRequestAction,
  requestFulfilledAction,
  requestRejectedAction,
  setErrorAction,
  setResponseAction,
  resetRequestAction,

  responseSelector,
  errorSelector,
  requestStatusSelector,
  isLoadingSelector,
  isLoadedSelector,
} = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
  serializeRequestParameters: ({ id }) => `${id}`,
});

loadDataAction({ id: 1 });
forcedLoadDataAction({ id: 1 });
doRequestAction({ id: 1 });
cancelRequestAction({ id: 1 });
setErrorAction({
  error: new Error(),
  params: { id: 1 },
});
setResponseAction({
  response: { id: 1, name: 'Name' },
  params: { id: 1 },
});
resetRequestAction({ id: 1 });

responseSelector(store)({ id: 1 });
errorSelector(store)({ id: 1 });
requestStatusSelector(store)({ id: 1 });
isLoadingSelector(store)({ id: 1 });
isLoadedSelector(store)({ id: 1 });

// loadDataAction({ id: 1 });
// loadDataAction({ id: 2 });
// loadDataAction({ id: 3 });
//
// Now the state is like here
// state = {
//   [stateRequestsKey]: {
//     responses: {
//       user: {
//         '1': {
//           status: RequestsStatuses.Loading,
//           response: undefined,
//           error: undefined,
//         },
//         '2': {
//           status: RequestsStatuses.Loading,
//           response: undefined,
//           error: undefined,
//         },
//         '3': {
//           status: RequestsStatuses.Loading,
//           response: undefined,
//           error: undefined,
//         },
//       },
//     },
//   },
// };
```

### Debounce

#### `config.useDebounce`

`useDebounce` is **not required** field, default value - `false`.

When `useDebounce: true` requestsFactory creates debounced actions `doRequestAction`, `forcedLoadDataAction` and `loadDataAction` that delays dispatch action with **same params** until after wait `config.debounceWait` milliseconds have elapsed since the last time the debounced action was dispatched.
Detect same params helps `config.stringifyParamsForDebounce`.
For debounce used [lodash.debounce](https://lodash.com/docs/4.17.15#debounce) and you can use own debounce options `config.debounceOptions`.

```js
const {...} = requestsFactory({
  useDebounce: true,
});
```

#### `config.debounceWait`

`debounceWait` is **not required** field, default value - `500`.
Used when `config.useDebounce: true`.

```js
const {...} = requestsFactory({
  debounceWait: 300,
});
```

#### `config.debounceOptions`

`debounceOptions` is **not required** field, default value:

```js
{
  leading: true,
  trailing: false,
  maxWait: config.debounceWait,
}
```

It is options for [lodash.debounce](https://lodash.com/docs/4.17.15#debounce).
Used when `config.useDebounce: true`.

```js
const {...} = requestsFactory({
  debounceOptions: {
    leading: true,
    trailing: false,
    maxWait: 300,
  },
});
```

#### `config.stringifyParamsForDebounce`

`stringifyParamsForDebounce` is **not required** field, default value - `JSON.stringify`. It is should be function that takes parameters and returns `string`.
Used when `config.useDebounce: true`.

```js
const {...} = requestsFactory({
  request: ({ id }) => fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
  stringifyParamsForDebounce: ({ id }) => `${id}`,
});
```

### Transform

#### `config.transformError`

`transformError` is **not required** field, it is should be function that takes request `error` or `undefined` and returns transformed `error` or `undefined`. `transformError` used for `errorSelector`.

```js
const { errorSelector } = requestsFactory({
  transformError: error => error && `Error: ${error.message}`,
});

errorSelector(state); // undefined  or `Error: ${error.message}`
```

#### `config.transformResponse`

`transformResponse` is **not required** field, it is should be function that takes request `response` or `undefined` and returns transformed `response`. `transformResponse` used for `responseSelector`. Better use `transformResponse` for setting default value.

NOTE: For best performance, do not use `transformResponse` with `serializeRequestParameters` for expensive transformations. For all expensive transforms better use [reselect](https://www.npmjs.com/package/reselect).

```js
const {
  responseSelector,
} = requestsFactory({
  transformResponse: (response) => response || [],,
});

responseSelector(state); // []
```

### Actions

#### `config.rejectedActions`

`rejectedActions` is **not required** field, default value - `[]`. It is should be array with actions or with functions that takes object `{ error, request, state }` as parameter and returns `action` or `[action, action, ...]` that will be dispatched when request is rejected.

```js
const {...} = requestsFactory({
  request: ({ id }) => fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
  rejectedActions: [
    { type: 'SHOW_NOTIFICATION' }, // simple action
    ({ error, request: { id }, state }) => {
      // ...
      return id === 1 ? { type: 'SHOW_ERROR' } : null;
    }, // function that returns an action or null
    ({ error, request: { id }, state }) => {
      // ...
      return [{ type: 'SHOW_ERROR' }, (id === 1 ? { type: 'SHOW_ERROR' } : null) ];
    }, // function that returns an array with actions or null
  ],
});
```

#### `config.fulfilledActions`

`fulfilledActions` is **not required** field, default value - `[]`. It is should be array with actions or with functions that takes object `{ response, request, state }` as parameter and returns `action` or `[action, action, ...]` that will be dispatched when request is fulfilled.

```js
const {...} = requestsFactory({
  request: ({ id }) => fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
  fulfilledActions: [
    { type: 'SHOW_NOTIFICATION' }, // simple action
    ({ response, request: { id }, state }) => {
      // ...
      return !response ? { type: 'SHOW_ERROR' } : null;
    }, // function that returns an action or null
    ({ response, request: { id }, state }) => {
      // ...
      return [{ type: 'SHOW_NOTIFICATION' }, (!response ? { type: 'SHOW_ERROR' } : null) ];
    }, // function that returns an array with actions or null
  ],
});
```

### Global Loading

#### `config.includeInGlobalLoading`

`includeInGlobalLoading` is **not required** field, default value - `true`. It is should be boolean.
When `includeInGlobalLoading: true` and request is loading, global `isSomethingLoadingSelector` will be return `true`. If `includeInGlobalLoading: false` you can use `isLoadingSelector`

```js
import { isSomethingLoadingSelector } from 'redux-requests-factory';

const { isLoadingSelector } = requestsFactory({
  includeInGlobalLoading: false,
});
```

Use the `silent` option for the following actions to temporarily disable the `includeInGlobalLoading` property:

```js
loadDataAction(params, { silent: true });
forcedLoadDataAction(params, { silent: true });
doRequestAction(params, { silent: true });
cancelRequestAction(params, { silent: true });
```

#### `config.globalLoadingTimeout`

`globalLoadingTimeout` is value in ms. After the specified time has passed, the request is excluded from global loading but is not cancelled.

### Others

#### `config.dispatchFulfilledActionForLoadedRequest`

`dispatchFulfilledActionForLoadedRequest` is **not required** field, default value - `false`. It is should be boolean.
When `dispatchFulfilledActionForLoadedRequest: true` and the request is loaded and new `loadDataAction` is dispatched, then the `requestFulfilledAction` and `config.fulfilledActions` will be dispatched again.

```js
const { loadDataAction, requestFulfilledAction } = requestsFactory({
  dispatchFulfilledActionForLoadedRequest: true,
});
```

## Requests Factory Instance

```js
import { requestsFactory } from 'redux-requests-factory';

export const {
  // actions
  loadDataAction, // do request once (can be dispatched many times, but do request once)
  forcedLoadDataAction, // do request every time (used when need reload data)
  doRequestAction, // do request every time (used for create, update and delete requests)
  cancelRequestAction, // cancel request
  requestFulfilledAction, // dispatched when request fulfilled
  requestRejectedAction, // dispatched when request rejected
  setErrorAction, // set custom Error for this request (requestRejectedAction will be dispatched)
  setResponseAction, // set response for this request (requestFulfilledAction will be dispatched)
  resetRequestAction, // reset request data
  // selectors
  responseSelector, // returns `response || []`
  errorSelector, // returns Error when request rejected or undefined
  requestStatusSelector, // returns request status ('none', 'loading', 'success', 'failed', 'canceled')
  isLoadingSelector, // returns true when request status === 'loading'
  isLoadedSelector, // returns true when request status === 'success'
} = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
  transformResponse: response => response || [],
});
```

### Requests Factory Instance Actions

#### `loadDataAction`

`loadDataAction` do request once (can be dispatched many times, but do request once)

```js
export const { loadDataAction } = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
});

dispatch(loadDataAction({ id: 1 }));
```

#### `forcedLoadDataAction`

`forcedLoadDataAction` do request every time (used when need reload data)

```js
export const { forcedLoadDataAction } = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
});

dispatch(forcedLoadDataAction({ id: 1 }));
```

#### `doRequestAction`

`doRequestAction` do request every time (used for create, update and delete requests)

```js
export const { doRequestAction } = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
});

dispatch(doRequestAction({ id: 1 }));
```

#### `cancelRequestAction`

`cancelRequestAction` cancel active request

```js
export const { cancelRequestAction } = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
});

dispatch(cancelRequestAction());
```

#### `requestFulfilledAction`

`requestFulfilledAction` dispatched with `payload: { params, response }` when request fulfilled. Can be used for subscriptions ([redux-observable](https://www.npmjs.com/package/redux-observable), [redux-saga](https://www.npmjs.com/package/redux-saga)).

```js
import { ofType } from 'redux-observable';

export const { requestFulfilledAction } = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
});

const loadUserFulfilledEpic = (action$, state$) =>
  action$.pipe(
    ofType(requestFulfilledAction),
    tap(
      ({
        payload: {
          params: { id },
          response,
        },
      }) => {
        alert(`User ${id} is loaded`);
      }
    ),
    ignoreElements()
  );
```

#### `requestRejectedAction`

`requestRejectedAction` dispatched with `payload: { params, error }` when request rejected. Can be used for subscriptions ([redux-observable](https://www.npmjs.com/package/redux-observable), [redux-saga](https://www.npmjs.com/package/redux-saga)).

```js
import { ofType } from 'redux-observable';

export const { requestRejectedAction } = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
});

const loadUserRejectedEpic = (action$, state$) =>
  action$.pipe(
    ofType(requestRejectedAction),
    tap(
      ({
        payload: {
          params: { id },
          error,
        },
      }) => {
        alert(`User ${id} is not loaded`);
      }
    ),
    ignoreElements()
  );
```

#### `setErrorAction`

`setErrorAction` set custom Error for this request (`requestRejectedAction` will be dispatched)

```js
export const { setErrorAction } = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
});

dispatch(setErrorAction({ error: 'some error' }));
```

#### `setResponseAction`

`setResponseAction` set response for this request (`requestFulfilledAction` will be dispatched)

```js
export const { setResponseAction } = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
});

dispatch(setResponseAction({ response: { id: 1, name: 'Name' } }));
```

#### `resetRequestAction`

`resetRequestAction` reset request data. Set `undefined` to `response` and `error`, and set `RequestsStatuses.None` to `status`.

```js
export const {
  resetRequestAction,
  responseSelector,
  errorSelector,
  requestStatusSelector,
} = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
});

dispatch(resetRequestAction());

responseSelector(state); // undefined
errorSelector(state); // undefined
requestStatusSelector(state); // RequestsStatuses.None
```

### Selectors

#### `responseSelector`

`responseSelector` returns `response` when request fulfilled or `undefined`

```js
export const { responseSelector } = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
});

responseSelector(state);
```

#### `errorSelector`

`errorSelector` returns `Error` when request rejected or `undefined`

```js
export const { errorSelector } = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
});

errorSelector(state);
```

#### `requestStatusSelector`

`requestStatusSelector` returns request `status` (`RequestsStatuses.None`, `RequestsStatuses.Loading`, `RequestsStatuses.Success`, `RequestsStatuses.Failed`, `RequestsStatuses.Canceled`)

```js
import { RequestsStatuses } from 'redux-requests-factory';

export const { requestStatusSelector } = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
});

requestStatusSelector(state) === RequestsStatuses.None;
```

#### `isLoadingSelector`

`isLoadingSelector` returns true when request `status === RequestsStatuses.Loading`

```js
export const { isLoadingSelector } = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
});

isLoadingSelector(state);
```

#### `isLoadedSelector`

`isLoadedSelector` returns true when request `status === RequestsStatuses.Success`

```js
export const { isLoadedSelector } = requestsFactory({
  request: ({ id }) =>
    fetch(`https://mysite.com/api/user/${id}`).then(res => res.json()),
  stateRequestKey: 'user',
});

isLoadedSelector(state);
```

## Global Selectors

### `isSomethingLoadingSelector`

`isSomethingLoadingSelector` returns `true` when something loads

```js
import { isSomethingLoadingSelector } from 'redux-requests-factory';

isSomethingLoadingSelector(state);
```

## Create Redux Requests Factory

Used if you need more than one instance of `createReduxRequestsFactory`

```js
import createReduxRequestsFactory from 'redux-requests-factory';

export const {
  stateRequestsKey, // 'api-key-one'
  createRequestsFactoryMiddleware, // Middleware for 'api-key-one'
  requestsFactory, // requestsFactory for 'api-key-one'
  requestsReducer, // requestsReducer for 'api-key-one'
  isSomethingLoadingSelector, // isSomethingLoadingSelector for 'api-key-one'
} = createReduxRequestsFactory({
  stateRequestsKey: 'api-key-one',
});

export const {
  stateRequestsKey, // 'api-key-two'
  createRequestsFactoryMiddleware, // Middleware for 'api-key-two'
  requestsFactory, // requestsFactory for 'api-key-two'
  requestsReducer, // requestsReducer for 'api-key-two'
  isSomethingLoadingSelector, // isSomethingLoadingSelector for 'api-key-two'
} = createReduxRequestsFactory({
  stateRequestsKey: 'api-key-two',
});
```

## SSR

`store.js`

```js
const makeStore = initialState => {
  const { middleware, toPromise } = createRequestsFactoryMiddleware();
  const reduxMiddleware = applyMiddleware(middleware);

  const store = createStore(reducer, initialState, reduxMiddleware);

  store.asyncRequests = toPromise;

  return store;
};
```

`app.js`

```js
const loadData = async ({ isServer, store }) => {
  store.dispatch(loadUsersAction());

  if (isServer) {
    await store.asyncRequests();
  }
};
```

## TypeScript

Full support TypeScript

[TypeScript + create-react-app + redux-requests-factory](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/create-react-app)

[TypeScript + next.js + redux-requests-factory](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/master/examples/next-js)

## License

MIT
