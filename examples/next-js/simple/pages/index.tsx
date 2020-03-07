import React, { useCallback } from "react";
import { NextPage } from "next";
import { useDispatch } from "react-redux";

import { loadUsersAction } from "../api/users";

const Home: NextPage<{}> = () => {
  const dispatch = useDispatch();
  const onLoadUsers = useCallback(() => dispatch(loadUsersAction()), [
    dispatch
  ]);

  return (
    <>
      <h1>Hello world!</h1>
      <button onClick={onLoadUsers}>Load Users</button>
    </>
  );
};

Home.getInitialProps = async ({ store }) => {
  store.dispatch(loadUsersAction());

  return {};
};

export default Home;
