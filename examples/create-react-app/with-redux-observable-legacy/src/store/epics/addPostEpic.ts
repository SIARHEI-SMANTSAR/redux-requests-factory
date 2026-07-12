import { ofType, Epic, combineEpics } from 'redux-observable';
import { mergeMap, map, ignoreElements, tap } from 'rxjs/operators';

import { addUserPostAction } from '../actions';
import {
  cancelAddPostAction,
  addPostAction,
  addPostFulfilledAction,
  addPostRejectedAction,
} from '../../requests/add-post';
import {
  setUserPostsAction,
  userPostsSelector,
} from '../../requests/posts-by-user';

const addUserPostEpic: Epic = action$ =>
  action$.pipe(
    ofType(addUserPostAction),
    mergeMap((action: ReturnType<typeof addUserPostAction>) => {
      return [
        cancelAddPostAction({ userId: action.payload.userId }),
        addPostAction(action.payload),
      ];
    })
  );

const addUserPostFulfilledEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(addPostFulfilledAction),
    map((action: ReturnType<typeof addPostFulfilledAction>) => {
      console.info('Post added successfully');

      return setUserPostsAction({
        response: [
          ...userPostsSelector(state$.value)({
            userId: action.payload.params.userId,
          }),
          action.payload.response,
        ],
        params: { userId: action.payload.params.userId },
      });
    })
  );

const addUserPostRejectedEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(addPostRejectedAction),
    tap((action: ReturnType<typeof addPostRejectedAction>) => {
      alert(`Post for user ${action.payload.params.userId} not added`);
    }),
    ignoreElements()
  );

export default combineEpics(
  addUserPostEpic,
  addUserPostFulfilledEpic,
  addUserPostRejectedEpic
);
