import {
  hydrateRequestsAction,
  requestsFactory,
  requestsStateSelector,
  type RequestsState,
} from '../src';
import { createDeferred, createRequestsTestStore } from './helpers';

describe('request workflows', () => {
  it('waits for dependent server requests and reuses their serialized state on the client', async () => {
    const server = createRequestsTestStore();
    const userResponse = createDeferred<{ id: number; name: string }>();
    const postsResponse = createDeferred<string[]>();
    const loadPosts = jest.fn((_userId: number) => postsResponse.promise);
    const posts = requestsFactory({
      stateRequestKey: 'profile-posts',
      request: loadPosts,
      serializeRequestParameters: String,
    });
    const loadUser = jest.fn(() => userResponse.promise);
    const user = requestsFactory({
      stateRequestKey: 'profile-user',
      request: loadUser,
      fulfilledActions: [({ response }) => posts.loadDataAction(response.id)],
    });

    const userLoad = server.store.dispatch(user.loadDataAction());
    const onReady = jest.fn();
    const serverReady = server.toPromise().then(onReady);
    userResponse.resolve({ id: 42, name: 'Ada' });
    await userLoad;

    expect(loadPosts).toHaveBeenCalledWith(42, expect.any(Object));
    expect(onReady).not.toHaveBeenCalled();
    postsResponse.resolve(['First post']);
    await serverReady;
    expect(onReady).toHaveBeenCalledTimes(1);

    const snapshot = JSON.parse(
      JSON.stringify(requestsStateSelector(server.store.getState()))
    ) as RequestsState;
    const client = createRequestsTestStore().store;
    client.dispatch(hydrateRequestsAction(snapshot));

    await Promise.all([
      client.dispatch(user.loadDataAction()),
      client.dispatch(posts.loadDataAction(42)),
    ]);

    expect(user.responseSelector(client.getState())).toEqual({
      id: 42,
      name: 'Ada',
    });
    expect(posts.responseSelector(client.getState())(42)).toEqual([
      'First post',
    ]);
    expect(loadUser).toHaveBeenCalledTimes(1);
    expect(loadPosts).toHaveBeenCalledTimes(1);
  });

  it('updates only the affected cached list after a retried mutation succeeds', async () => {
    const { store } = createRequestsTestStore();
    const loadPosts = jest.fn(async (userId: number) => [`Post by ${userId}`]);
    const posts = requestsFactory({
      stateRequestKey: 'author-posts',
      request: loadPosts,
      serializeRequestParameters: String,
    });
    const unavailable = new Error('temporarily unavailable');
    const savePost = jest
      .fn<Promise<string>, [{ userId: number; title: string }]>()
      .mockRejectedValueOnce(unavailable)
      .mockResolvedValueOnce('New post');
    const updatePosts = jest.fn();
    const createPost = requestsFactory({
      stateRequestKey: 'publish-author-post',
      request: savePost,
      retry: {
        maxRetries: 1,
        shouldRetry: ({ error }) => error === unavailable,
      },
      fulfilledActions: [
        ({ request: { userId }, response, state }) => {
          updatePosts();
          return posts.setResponseAction({
            params: userId,
            response: [
              ...(posts.responseSelector(state)(userId) ?? []),
              response,
            ],
          });
        },
      ],
    });

    await Promise.all([
      store.dispatch(posts.loadDataAction(1)),
      store.dispatch(posts.loadDataAction(2)),
    ]);
    await store.dispatch(
      createPost.doRequestAction({ userId: 1, title: 'New post' })
    );
    await store.dispatch(posts.loadDataAction(1));

    expect(savePost).toHaveBeenCalledTimes(2);
    expect(updatePosts).toHaveBeenCalledTimes(1);
    expect(loadPosts).toHaveBeenCalledTimes(2);
    expect(posts.responseSelector(store.getState())(1)).toEqual([
      'Post by 1',
      'New post',
    ]);
    expect(posts.responseSelector(store.getState())(2)).toEqual(['Post by 2']);
  });
});
