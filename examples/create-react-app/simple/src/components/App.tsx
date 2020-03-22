import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isSomethingLoadingSelector } from 'redux-requests-factory';

import {
  loadUsersAction,
  forcedLoadUsersAction,
  cancelLoadUsersAction,
  usersSelector,
} from '../api/users';
import './App.css';
import { loadUserPostsAction, userPostsSelector } from '../api/posts-by-user';

const App = () => {
  const users = useSelector(usersSelector);
  const postsByUser = useSelector(userPostsSelector);
  const isSomethingLoading = useSelector(isSomethingLoadingSelector);
  const dispatch = useDispatch();
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
    (userId: number) => dispatch(loadUserPostsAction({ userId })),
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
    <div className="app">
      {isSomethingLoading ? <div>Something Loading...</div> : null}
      <button onClick={onLoadUsers} className="app__load-button">
        Load Users
      </button>
      <button onClick={onForcedLoadUsers} className="app__forced-load-button">
        Forced Load Users
      </button>
      <button onClick={onCancelLoadUsers} className="app__cancel-load-button">
        Cancel Load Users
      </button>
      <ul>
        {users.map(({ id, name }) => (
          <li key={id}>
            {name}
            <ul>
              {postsByUser({ userId: id }).map(({ id, title }) => (
                <li key={id}>{title}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
