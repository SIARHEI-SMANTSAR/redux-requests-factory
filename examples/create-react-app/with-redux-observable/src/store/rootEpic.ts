import { combineEpics } from 'redux-observable';

import initAppEpic from './epics/initAppEpic';
import loadUserPostsEpic from './epics/loadUserPostsEpic';
import addPostEpic from './epics/addPostEpic';

const rootEpic = combineEpics(initAppEpic, loadUserPostsEpic, addPostEpic);

export default rootEpic;
