import React, { useCallback } from 'react';
import { NextPage } from 'next';
import { useDispatch, useSelector } from 'react-redux';

import { loadUsersAction, usersSelector } from '../api/users';
import { StoreWithAsyncRequests } from '../store';

const Home: NextPage<{}> = () => {
  const dispatch = useDispatch();
  const onLoadUsers = useCallback(() => dispatch(loadUsersAction()), [
    dispatch,
  ]);
  const users = useSelector(usersSelector);

  return (
    <>
      <h1>Hello world!</h1>
      <button onClick={onLoadUsers}>Load Users</button>
      <ul>{users && users.map(({ id, name }) => <li key={id}>{name}</li>)}</ul>
    </>
  );
};

Home.getInitialProps = async ({ store }) => {
  store.dispatch(loadUsersAction());

  await (store as StoreWithAsyncRequests).asyncRequests();
  return {};
};

export default Home;
