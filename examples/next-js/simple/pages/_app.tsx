import { AppProps, AppContext } from "next/app";
import withRedux, { ReduxWrapperAppProps } from "next-redux-wrapper";
import { Provider } from "react-redux";

import makeStore, { RootState } from "../store";

const MyApp = ({
  Component,
  pageProps,
  store
}: AppProps & ReduxWrapperAppProps<RootState>) => {
  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  );
};

MyApp.getInitialProps = async ({ Component, ctx }: AppContext) => {
  const pageProps = Component.getInitialProps
    ? await Component.getInitialProps(ctx)
    : {};

  return { pageProps };
};

export default withRedux(makeStore)(MyApp);
