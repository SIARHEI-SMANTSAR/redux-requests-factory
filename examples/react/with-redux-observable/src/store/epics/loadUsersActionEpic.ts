import { Epic, ofType } from 'redux-observable';
import { ignoreElements, tap } from 'rxjs/operators';

import { loadUsersAction } from '../../requests/users';
import { RootState } from '../../types/store';

const loadUsersActionEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(loadUsersAction.type),
    tap(() => {
      console.info('loadUsersAction was forwarded to redux-observable');
    }),
    ignoreElements()
  );

export default loadUsersActionEpic;
