import React, { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { loadUsersAction } from '../api/users';
import './App.css';

const App = () => {
  const dispatch = useDispatch();
  const onLoadUsers = useCallback(() => dispatch(loadUsersAction()), [
    dispatch,
  ]);

  useEffect(() => {
    onLoadUsers();
  }, [onLoadUsers]);

  return (
    <div className="app">
      <button onClick={onLoadUsers} className="app__load-button">
        Load Users
      </button>
    </div>
  );
};

export default App;
