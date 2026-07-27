import { combineEpics } from 'redux-observable';

import addPostEpic from './epics/addPostEpic';
import initAppEpic from './epics/initAppEpic';
import loadUsersActionEpic from './epics/loadUsersActionEpic';
import loadUserPostsEpic from './epics/loadUserPostsEpic';

const rootEpic = combineEpics(
  initAppEpic,
  loadUsersActionEpic,
  loadUserPostsEpic,
  addPostEpic
);

export default rootEpic;
