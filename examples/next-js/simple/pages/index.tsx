import React from "react";
import { NextPage } from "next";

import { loadUsersAction } from "../api/users";

const Home: NextPage<{ userAgent: string }> = ({ userAgent }) => {
  return <h1>Hello world! - user agent: {userAgent}</h1>;
};

Home.getInitialProps = async ({ req, store }) => {
  const userAgent = req ? req.headers["user-agent"] || "" : navigator.userAgent;

  store.dispatch(loadUsersAction());

  return { userAgent };
};

export default Home;
