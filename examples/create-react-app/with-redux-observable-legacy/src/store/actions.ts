import { createAction } from 'redux-actions';

export const initAppAction = createAction('@@APP/INIT');

export const addUserPostAction = createAction<{
  userId: number;
  title: string;
  body: string;
}>('@@APP/ADD_USER_POST');
