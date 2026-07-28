import { createContext, type PropsWithChildren, useContext } from 'react';

type RequestEnvironment = {
  serverBaseUrl: string | null;
};

const RequestEnvironmentContext = createContext<RequestEnvironment>({
  serverBaseUrl: null,
});

type RequestEnvironmentProviderProps = PropsWithChildren<{
  serverBaseUrl: string;
}>;

export function RequestEnvironmentProvider({
  children,
  serverBaseUrl,
}: RequestEnvironmentProviderProps) {
  return (
    <RequestEnvironmentContext value={{ serverBaseUrl }}>
      {children}
    </RequestEnvironmentContext>
  );
}

export const useRequestEnvironment = () =>
  useContext(RequestEnvironmentContext);
