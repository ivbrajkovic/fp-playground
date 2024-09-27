import { EitherTaskLazy } from '../EitherTaskLazy';

export const eitherTaskLazyTest = () => {
  // Mock API functions for demonstration purposes
  const fetchUserById = (id: number): Promise<{ id: number; name: string }> => {
    return id === 1
      ? Promise.resolve({ id: 1, name: 'John Doe' })
      : Promise.reject(new Error('User not found'));
  };

  const fetchPostsByUser = (
    userId: number
  ): Promise<{ id: number; title: string }[]> => {
    return userId === 1
      ? Promise.resolve([
          { id: 1, title: 'First Post' },
          { id: 2, title: 'Second Post' },
        ])
      : Promise.reject(new Error('Posts not found'));
  };

  const fetchCommentsByPost = (
    postId: number
  ): Promise<{ id: number; comment: string }[]> => {
    return postId === 1
      ? Promise.resolve([{ id: 1, comment: 'Nice post!' }])
      : Promise.reject(new Error('Comments not found'));
  };

  // Wrapping API functions in lazy EitherTask
  const getUserByIdTask = (id: number) =>
    EitherTaskLazy.from(() => fetchUserById(id));
  const getPostsByUserTask = (userId: number) =>
    EitherTaskLazy.from(() => fetchPostsByUser(userId));
  const getCommentsByPostTask = (postId: number) =>
    EitherTaskLazy.from(() => fetchCommentsByPost(postId));

  // Now let's chain these lazily
  const lazyTask = getUserByIdTask(1)
    .chain((user) => {
      console.log('Fetching posts for user:', user);
      return getPostsByUserTask(user.id); // Fetch posts for the user
    })
    .chain((posts) => {
      console.log('Fetching comments for post:', posts[0]);
      return getCommentsByPostTask(posts[0].id); // Fetch comments for the first post
    });

  // Nothing happens yet because it's lazy!
  // To execute the task, we call `run()`

  lazyTask.fold(
    (error) => console.error('Error occurred:', error.message),
    (comments) => console.log('Fetched comments:', comments)
  );
};
