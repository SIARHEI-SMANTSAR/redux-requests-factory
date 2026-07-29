export const abortableDelay = (duration: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener('abort', abort);
      resolve();
    };
    const timeout = setTimeout(finish, duration);
    const abort = () => {
      clearTimeout(timeout);
      reject(signal?.reason ?? new Error('Request aborted'));
    };

    if (signal?.aborted) {
      abort();
    } else {
      signal?.addEventListener('abort', abort, { once: true });
    }
  });
