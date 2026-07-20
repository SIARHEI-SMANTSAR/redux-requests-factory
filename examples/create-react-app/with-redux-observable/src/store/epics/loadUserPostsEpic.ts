import { Epic, ofType } from 'redux-observable';
import { mergeMap } from 'rxjs/operators';

import { loadUserPostsAction } from '../../requests/posts-by-user';
import { loadUsersFulfilledAction, usersSelector } from '../../requests/users';
import { RootState } from '../../types/store';

const loadUserPostsEpic: Epic<any, any, RootState> = (action$, state$) =>
  action$.pipe(
    ofType(loadUsersFulfilledAction.type),
    mergeMap(() => {
      const users = usersSelector(state$.value);

      return users.map(({ id }) => loadUserPostsAction({ userId: id }));
    })
  );

export default loadUserPostsEpic;
