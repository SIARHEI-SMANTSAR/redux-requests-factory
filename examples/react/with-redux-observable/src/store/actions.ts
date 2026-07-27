export const INIT_APP = '@@APP/INIT';
export const ADD_USER_POST = '@@APP/ADD_USER_POST';

export const initAppAction = () => ({
  type: INIT_APP,
});

export const addUserPostAction = (payload: {
  userId: number;
  title: string;
  body: string;
}) => ({
  type: ADD_USER_POST,
  payload,
});
