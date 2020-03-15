import React, { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import {
  loadUsersAction,
  forcedLoadUsersAction,
  cancelLoadUsersAction,
} from '../api/users';
import './App.css';

const App = () => {
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
    </div>
  );
};

export default App;
