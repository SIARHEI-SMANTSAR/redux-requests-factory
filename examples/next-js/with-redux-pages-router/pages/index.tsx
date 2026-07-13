import type { FormEvent, MouseEvent } from "react";
import { useCallback, useEffect } from "react";
import type { NextPage } from "next";
import { useDispatch, useSelector } from "react-redux";
import type { Dispatch } from "redux";
import { isSomethingLoadingSelector } from "redux-requests-factory";
import {
  addPostAction,
  cancelAddPostAction,
  isLoadingAddPostSelector,
} from "../requests/add-post";
import {
  forcedLoadUserPostsAction,
  loadUserPostsAction,
  userPostsSelector,
} from "../requests/posts-by-user";
import {
  cancelLoadUsersAction,
  forcedLoadUsersAction,
  loadUsersAction,
  usersSelector,
} from "../requests/users";
import { wrapper } from "../store";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  const users = useSelector(usersSelector);
  const postsByUser = useSelector(userPostsSelector);
  const isSomethingLoading = useSelector(isSomethingLoadingSelector);
  const isLoadingAddPost = useSelector(isLoadingAddPostSelector);
  const dispatch = useDispatch<Dispatch<any>>();

  const onLoadUsers = useCallback(() => {
    dispatch(loadUsersAction());
  }, [dispatch]);

  const onForcedLoadUsers = useCallback(() => {
    dispatch(forcedLoadUsersAction());
  }, [dispatch]);

  const onCancelLoadUsers = useCallback(() => {
    dispatch(cancelLoadUsersAction());
  }, [dispatch]);

  const onLoadUserPosts = useCallback(
    (userId: number) => {
      dispatch(loadUserPostsAction({ userId }));
    },
    [dispatch]
  );

  const onForcedLoadUserPosts = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      dispatch(
        forcedLoadUserPostsAction({
          userId: Number(event.currentTarget.dataset.userId),
        })
      );
    },
    [dispatch]
  );

  const onAddPost = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const form = event.currentTarget;
      const elements = form.elements as typeof form.elements & {
        title: HTMLInputElement;
        body: HTMLTextAreaElement;
      };
      const userId = Number(form.dataset.userId);

      dispatch(cancelAddPostAction({ userId }));
      dispatch(
        addPostAction({
          userId,
          title: elements.title.value,
          body: elements.body.value,
        })
      );

      form.reset();
    },
    [dispatch]
  );

  useEffect(() => {
    users.forEach(({ id }) => {
      onLoadUserPosts(id);
    });
  }, [users, onLoadUserPosts]);

  return (
    <main className={styles.app}>
      <h1>redux-requests-factory with Pages Router</h1>
      <div className={styles.loading}>
        {isSomethingLoading ? "Something Loading..." : null}
      </div>

      <div className={styles.toolbar}>
        <button onClick={onLoadUsers}>Load Users</button>
        <button onClick={onForcedLoadUsers}>Forced Load Users</button>
        <button onClick={onCancelLoadUsers}>Cancel Load Users</button>
      </div>

      <ul className={styles.users}>
        {users.map(({ id, name }) => (
          <li className={styles.user} key={id}>
            <h2>{name}</h2>
            <ul className={styles.posts}>
              {postsByUser({ userId: id }).map((post, index) => (
                <li key={`${post.id}_${index}`}>{post.title}</li>
              ))}
            </ul>
            <button data-user-id={id} onClick={onForcedLoadUserPosts}>
              Forced Load User Posts With Debounce 500ms
            </button>
            <form
              className={styles.form}
              data-user-id={id}
              onSubmit={onAddPost}
            >
              <h3>Add new post</h3>
              <label className={styles.inputLabel}>
                Title
                <input id={`title_${id}`} name="title" />
              </label>
              <label className={styles.inputLabel}>
                Body
                <textarea name="body" />
              </label>
              <button type="submit" disabled={isLoadingAddPost({ userId: id })}>
                {isLoadingAddPost({ userId: id }) ? "Loading..." : "Add"}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
};

export const getServerSideProps = wrapper.getServerSideProps(
  (store) => async () => {
    store.dispatch(loadUsersAction());

    await store.asyncRequests();

    const users = usersSelector(store.getState());

    users.forEach(({ id }) => {
      store.dispatch(loadUserPostsAction({ userId: id }));
    });

    await store.asyncRequests();

    return {
      props: {},
    };
  }
);

export default Home;
