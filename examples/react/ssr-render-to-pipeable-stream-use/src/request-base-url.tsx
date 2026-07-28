import { createContext, type PropsWithChildren, useContext } from 'react';

const RequestBaseUrlContext = createContext('');

type RequestBaseUrlProviderProps = PropsWithChildren<{
  baseUrl: string;
}>;

export function RequestBaseUrlProvider({
  baseUrl,
  children,
}: RequestBaseUrlProviderProps) {
  return (
    <RequestBaseUrlContext value={baseUrl}>
      {children}
    </RequestBaseUrlContext>
  );
}

export const useRequestBaseUrl = () => useContext(RequestBaseUrlContext);
