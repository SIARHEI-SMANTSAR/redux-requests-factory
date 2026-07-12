import { combineEpics } from 'redux-observable';

import addPostEpic from './epics/addPostEpic';
import initAppEpic from './epics/initAppEpic';
import loadUserPostsEpic from './epics/loadUserPostsEpic';

const rootEpic = combineEpics(initAppEpic, loadUserPostsEpic, addPostEpic);

export default rootEpic;

