import type { ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import type { AsyncRequestFactoryAction } from 'redux-requests-factory';

import { useRequestBaseUrl } from '../request-base-url';
import type { AppDispatch } from '../store';

type ForceLoadAction = (params?: {
  baseUrl?: string;
}) => AsyncRequestFactoryAction;

type ForceReloadButtonProps = {
  action: ForceLoadAction;
  children: ReactNode;
};

export function ForceReloadButton({
  action,
  children,
}: ForceReloadButtonProps) {
  const dispatch = useDispatch<AppDispatch>();
  const baseUrl = useRequestBaseUrl();

  return (
    <button
      type="button"
      onClick={() => void dispatch(action({ baseUrl }))}
    >
      {children}
    </button>
  );
}
