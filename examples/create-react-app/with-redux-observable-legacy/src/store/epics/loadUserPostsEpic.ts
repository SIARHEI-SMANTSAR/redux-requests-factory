import { ofType, Epic } from 'redux-observable';
import { mergeMap } from 'rxjs/operators';

import { loadUsersFulfilledAction, usersSelector } from '../../requests/users';
import { loadUserPostsAction } from '../../requests/posts-by-user';

const loadUserPostsEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(loadUsersFulfilledAction),
    mergeMap(() => {
      const users = usersSelector(state$.value);

      return users.map(({ id }) => loadUserPostsAction({ userId: id }));
    })
  );

export default loadUserPostsEpic;
