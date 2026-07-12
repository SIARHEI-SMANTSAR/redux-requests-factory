import { Epic, ofType } from 'redux-observable';
import { map } from 'rxjs/operators';

import { INIT_APP } from '../actions';
import { loadUsersAction } from '../../requests/users';
import { RootState } from '../../types/store';

const initAppEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(INIT_APP),
    map(() => loadUsersAction())
  );

export default initAppEpic;
