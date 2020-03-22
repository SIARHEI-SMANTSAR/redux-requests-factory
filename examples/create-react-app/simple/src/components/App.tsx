import React, { useCallback, useEffect, FormEvent, MouseEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isSomethingLoadingSelector } from 'redux-requests-factory';

import {
  loadUsersAction,
  forcedLoadUsersAction,
  cancelLoadUsersAction,
  usersSelector,
} from '../api/users';
import './App.css';
import {
  loadUserPostsAction,
  userPostsSelector,
  forcedLoadUserPostsAction,
} from '../api/posts-by-user';
import {
  addPostAction,
  isLoadingAddPostSelector,
  cancelAddPostAction,
} from '../api/add-post';

const App = () => {
  const users = useSelector(usersSelector);
  const postsByUser = useSelector(userPostsSelector);
  const isSomethingLoading = useSelector(isSomethingLoadingSelector);
  const isLoadingAddPost = useSelector(isLoadingAddPostSelector);
  const dispatch = useDispatch();
  const onLoadUsers = useCallback(() => dispatch(loadUsersAction()), [
    dispatch,
  ]);
  const onForcedLoadUsers = useCallback(
    () => dispatch(forcedLoadUsersAction()),
    [dispatch]
  );
  const onCancelLoadUsers = useCallback(
    () => dispatch(cancelLoadUsersAction()),
    [dispatch]
  );
  const onLoadUserPosts = useCallback(
    (userId: number) => dispatch(loadUserPostsAction({ userId })),
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

      dispatch(cancelAddPostAction({ userId }));
      dispatch(
        addPostAction({
          userId,
          title: elements.title.value,
          body: elements.body.value,
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    onLoadUsers();
  }, [onLoadUsers]);

  useEffect(() => {
    if (users) {
      users.forEach(({ id }) => {
        onLoadUserPosts(id);
      });
    }
  }, [users, onLoadUserPosts]);

  return (
    <div className="app">
      <div className="app__loading">
        {isSomethingLoading ? 'Something Loading...' : null}
      </div>

      <button onClick={onLoadUsers} className="app__button app__load-button">
        Load Users
      </button>
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
