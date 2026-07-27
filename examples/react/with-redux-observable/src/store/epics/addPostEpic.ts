import { Epic, combineEpics, ofType } from 'redux-observable';
import { ignoreElements, map, mergeMap, tap } from 'rxjs/operators';

import { ADD_USER_POST, addUserPostAction } from '../actions';
import {
  addPostAction,
  addPostFulfilledAction,
  addPostRejectedAction,
  cancelAddPostAction,
} from '../../requests/add-post';
import {
  setUserPostsAction,
  userPostsSelector,
} from '../../requests/posts-by-user';
import { RootState } from '../../types/store';

const addUserPostEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(ADD_USER_POST),
    mergeMap((action: ReturnType<typeof addUserPostAction>) => [
      cancelAddPostAction({ userId: action.payload.userId }),
      addPostAction(action.payload),
    ])
  );

const addUserPostFulfilledEpic: Epic<any, any, RootState> = (
  action$,
  state$
) =>
  action$.pipe(
    ofType(addPostFulfilledAction.type),
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

const addUserPostRejectedEpic: Epic<any, any, RootState> = (action$) =>
  action$.pipe(
    ofType(addPostRejectedAction.type),
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
