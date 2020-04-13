# Redux Requests Factory

[![npm version](https://img.shields.io/npm/v/redux-requests-factory.svg?style=flat-square)](https://www.npmjs.com/package/redux-requests-factory)
[![npm downloads](https://img.shields.io/npm/dm/redux-requests-factory.svg?style=flat-square)](https://www.npmjs.com/package/redux-requests-factory)

```js
npm install redux-requests-factory

// or

npm install redux-requests-factory --save
```

## Examples

[All examples](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/develop/examples)

[create-react-app](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/develop/examples/create-react-app)

[next.js](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/develop/examples/next-js)

[redux-observabl](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/develop/examples/create-react-app/with-redux-observable)

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
  middleware: requestsFactoryMiddleware
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
  responseSelector, // return `response || []`
  errorSelector, // return Error when request rejected or undefined
  requestStatusSelector, // return request status ('none', 'loading', 'success', 'failed', 'canceled')
  isLoadingSelector, // return true when request status === 'loading'
  isLoadedSelector, // return true when request status === 'success'
} = requestsFactory({
  request: loadUsersRequest,
  stateRequestKey: 'users',
  transformResponse: (response) => response || [],
});
```

```js
import React from 'react';
import { useSelector } from 'react-redux';
import { isSomethingLoadingSelector } from 'redux-requests-factory';

const App = () => {
  const isSomethingLoading = useSelector(isSomethingLoadingSelector); // returns true when something loads

  return (
    <>
      {isSomethingLoading ? <div>'Something Loading...'</div> : null}
    </>
  );
}
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
  transformResponse: (response) => response || [],
});
```

</details>

### requests/posts-by-user.js

<details>
  <summary>Click to expand example!</summary>

```js
import { requestsFactory } from 'redux-requests-factory';

const loadUserPostsRequest = ({ userId }) =>
  fetch(
    `https://mysite.com/posts?userId=${userId}`
  ).then(res => res.json());

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
  transformResponse: (response) => response || [],
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
  fulfilledActions: [ // this actions calls when addPostRequest fulfilled
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
    (userId) => dispatch(loadUserPostsAction({ userId })),
    [dispatch]
  );
  const onForcedLoadUserPosts = useCallback(
    (event) => {
      dispatch(
        forcedLoadUserPostsAction({
          userId: event.currentTarget.dataset.userId,
        })
      );
    },
    [dispatch]
  );
  const onAddPost = useCallback(
    (even) => {
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
      <div>
        {isSomethingLoading ? 'Something Loading...' : null}
      </div>

      <button onClick={onLoadUsers}>
        Load Users
      </button>
      <button onClick={onForcedLoadUsers}>
        Forced Load Users
      </button>
      <button onClick={onCancelLoadUsers}>
        Cancel Load Users
      </button>

      <ul>
        {users.map(({ id, name }) => (
          <li key={id}>
            {name}
            <ul>
              {postsByUser({ userId: id }).map(({ id, title }, index) => (
                <li key={`${id}_${index}`}>{title}</li>
              ))}
              <button
                data-user-id={id}
                onClick={onForcedLoadUserPosts}
              >
                Forced Load User Posts With Debounce 500ms
              </button>
              <form
                data-user-id={id}
                onSubmit={onAddPost}
              >
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

## Config `requestsFactory`

```js
import { requestsFactory } from 'redux-requests-factory';

const {...} = requestsFactory({
  request: ({ id }) => fetch(`https://mysite.com/api/user/${id}`),
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

### `config.request`

`request` is **required** field, it is should be function that takes parameters (or not) and returns `Promise`

with params:

```js
const {
  doRequestAction,
  forcedLoadDataAction,
  loadDataAction,
} = requestsFactory({
  request: ({ id }) => fetch(`https://mysite.com/api/user/${id}`),
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
  request: () => fetch('https://mysite.com/api/users'),
  stateRequestKey: 'users',
});

doRequestAction();
// or
forcedLoadDataAction();
// or
loadDataAction();
```

### `config.stateRequestKey`

`stateRequestKey` is **required** field, it is should be unique string key between all requests

```js
const {...} = requestsFactory({
  stateRequestKey: 'users',
});

const {...} = requestsFactory({
  stateRequestKey: 'user-posts',
});
```

### `config.serializeRequestParameters`

`serializeRequestParameters` is **not required** field, it is should be function that takes parameters and returns `string`.

When used `serializeRequestParameters` all selectors return function that takes parameters and returns selected value.

```js
const {
  responseSelector,
  errorSelector,
  requestStatusSelector,
  isLoadingSelector,
  isLoadedSelector,
} = requestsFactory({
  request: ({ id }) => fetch(`https://mysite.com/api/user/${id}`),
  stateRequestKey: 'user',
  serializeRequestParameters: ({ id }) => `${id}`,
});

responseSelector(store)({ id: 1 });
errorSelector(store)({ id: 1 });
requestStatusSelector(store)({ id: 1 });
isLoadingSelector(store)({ id: 1 });
isLoadedSelector(store)({ id: 1 });
```

## TypeScript

Full support TypeScript

[TypeScript + create-react-app + redux-requests-factory](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/develop/examples/create-react-app)

[TypeScript + next.js + redux-requests-factory](https://github.com/SIARHEI-SMANTSAR/redux-requests-factory/tree/develop/examples/next-js)

## License

MIT
