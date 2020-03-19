import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  loadUsersAction,
  forcedLoadUsersAction,
  cancelLoadUsersAction,
  usersSelector,
} from '../api/users';
import './App.css';

const App = () => {
  const users = useSelector(usersSelector);
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

  useEffect(() => {
    onLoadUsers();
  }, [onLoadUsers]);

  return (
    <div className="app">
      <button onClick={onLoadUsers} className="app__load-button">
        Load Users
      </button>
      <button onClick={onForcedLoadUsers} className="app__forced-load-button">
        Forced Load Users
      </button>
      <button onClick={onCancelLoadUsers} className="app__cancel-load-button">
        Cancel Load Users
      </button>
      <ul>{users && users.map(({ id, name }) => <li key={id}>{name}</li>)}</ul>
    </div>
  );
};

export default App;
