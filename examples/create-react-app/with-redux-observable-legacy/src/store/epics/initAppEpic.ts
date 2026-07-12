import { ofType, Epic } from 'redux-observable';
import { mapTo } from 'rxjs/operators';

import { initAppAction } from '../actions';
import { loadUsersAction } from '../../requests/users';

const initAppEpic: Epic = action$ =>
  action$.pipe(ofType(initAppAction), mapTo(loadUsersAction()));

export default initAppEpic;
