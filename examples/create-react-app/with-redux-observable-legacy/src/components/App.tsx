import React, { useCallback, useEffect, FormEvent, MouseEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isSomethingLoadingSelector } from 'redux-requests-factory';

import {
  forcedLoadUsersAction,
  cancelLoadUsersAction,
  usersSelector,
} from '../requests/users';
import './App.css';
import {
  userPostsSelector,
  forcedLoadUserPostsAction,
} from '../requests/posts-by-user';
import {
  isLoadingAddPostSelector,
  addPostErrorSelector,
} from '../requests/add-post';
import { initAppAction, addUserPostAction } from '../store/actions';

const App = () => {
  const users = useSelector(usersSelector);
  const postsByUser = useSelector(userPostsSelector);
  const isSomethingLoading = useSelector(isSomethingLoadingSelector);
  const isLoadingAddPost = useSelector(isLoadingAddPostSelector);
  const addPostError = useSelector(addPostErrorSelector);
  const dispatch = useDispatch();
  const onInitApp = useCallback(() => dispatch(initAppAction()), [dispatch]);

  const onForcedLoadUsers = useCallback(
    () => dispatch(forcedLoadUsersAction()),
    [dispatch]
  );
  const onCancelLoadUsers = useCallback(
    () => dispatch(cancelLoadUsersAction()),
    [dispatch]
  );
  const onForcedLoadUserPosts = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      dispatch(
        forcedLoadUserPostsAction({
          userId: (event.currentTarget.dataset as any).userId as number,
        })
      );
    },
    [dispatch]
  );
  const onAddPost = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const elements: {
        title: { value: string };
        body: { value: string };
      } = form.elements as any;
      const userId = (form.dataset as any).userId as number;

      dispatch(
        addUserPostAction({
          userId,
          title: elements.title.value,
          body: elements.body.value,
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    onInitApp();
  }, [onInitApp]);

  return (
    <div className="app">
      <div className="app__loading">
        {isSomethingLoading ? 'Something Loading...' : null}
      </div>

      <button
        onClick={onForcedLoadUsers}
        className="app__button app__forced-load-button"
      >
        Forced Load Users
      </button>
      <button
        onClick={onCancelLoadUsers}
        className="app__button app__cancel-load-button"
      >
        Cancel Load Users
      </button>

      <ul>
        {users.map(({ id, name }) => (
          <li key={id}>
            {name}
            <ul>
              {postsByUser({ userId: id }).map(({ id, title }, index) => (
                <li key={`${id}_${index}`}>{title}</li>
              ))}
              <button
                className="app__button app__forced-load-user-posts-button"
                data-user-id={id}
                onClick={onForcedLoadUserPosts}
              >
                Forced Load User Posts With Debounce 500ms
              </button>
              <form
                className="app__form"
                data-user-id={id}
                onSubmit={onAddPost}
              >
                <h3>Add new post </h3>
                <label className="app__input-label">
                  Title
                  <input id={`title_${id}`} name="title" />
                </label>
                <label className="app__input-label">
                  Body
                  <textarea name="body" />
                </label>
                <div>{addPostError({ userId: id })}</div>
                <button
                  type="submit"
                  disabled={isLoadingAddPost({ userId: id })}
                >
                  {isLoadingAddPost({ userId: id }) ? 'Loading...' : 'Add'}
                </button>
              </form>
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
