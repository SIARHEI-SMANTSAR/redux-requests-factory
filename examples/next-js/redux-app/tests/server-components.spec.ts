import { expect, test, type Page } from '@playwright/test';

type StreamChunk = {
  elapsed: number;
  text: string;
};

const readStream = async (url: string) => {
  const startedAt = Date.now();
  const response = await fetch(url, {
    headers: { 'Accept-Encoding': 'identity' },
  });
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error('The response does not expose a readable body');
  }

  const chunks: StreamChunk[] = [];
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      const remainingText = decoder.decode();

      if (remainingText) {
        chunks.push({ elapsed: Date.now() - startedAt, text: remainingText });
      }
      break;
    }

    chunks.push({
      elapsed: Date.now() - startedAt,
      text: decoder.decode(value, { stream: true }),
    });
  }

  return { chunks, response };
};

const firstChunkContaining = (chunks: StreamChunk[], text: string) => {
  let received = '';

  for (const [index, chunk] of chunks.entries()) {
    received += chunk.text;

    if (received.includes(text)) {
      return index;
    }
  }

  return -1;
};

const observeBrowser = (page: Page) => {
  const apiRequests: string[] = [];
  const runtimeErrors: string[] = [];

  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;

    if (pathname.startsWith('/api/')) {
      apiRequests.push(pathname);
    }
  });
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  return { apiRequests, runtimeErrors };
};

test('streams independent Server Components in data completion order', async ({
  baseURL,
}) => {
  const { chunks, response } = await readStream(
    `${baseURL}/server-redux-streams`
  );
  const html = chunks.map((chunk) => chunk.text).join('');

  expect(response.status).toBe(200);
  expect(chunks.length).toBeGreaterThan(1);
  expect(html).toContain('Independent Server Components');

  const fallbackChunk = firstChunkContaining(chunks, 'Loading settings…');
  const settingsChunk = firstChunkContaining(chunks, 'English');
  const usersChunk = firstChunkContaining(chunks, 'Ada Lovelace');
  const postsChunk = firstChunkContaining(
    chunks,
    'Using Redux with React Server Components'
  );

  expect(fallbackChunk).toBeGreaterThanOrEqual(0);
  expect(settingsChunk).toBeGreaterThan(fallbackChunk);
  expect(usersChunk).toBeGreaterThan(settingsChunk);
  expect(postsChunk).toBeGreaterThan(usersChunk);
  expect(chunks[settingsChunk]?.elapsed).toBeLessThan(
    chunks[usersChunk]?.elapsed ?? Number.POSITIVE_INFINITY
  );
  expect(chunks[usersChunk]?.elapsed).toBeLessThan(
    chunks[postsChunk]?.elapsed ?? Number.POSITIVE_INFINITY
  );
});

const serverRoutes = [
  {
    heading: 'Async Server Component + Redux',
    path: '/server-redux',
    texts: ['Ada Lovelace'],
  },
  {
    heading: 'Streaming a requests-state promise',
    path: '/server-redux-use',
    texts: ['Ada Lovelace'],
  },
  {
    heading: 'Batched server loading',
    path: '/server-redux-batch',
    texts: [
      'Ada Lovelace',
      'Using Redux with React Server Components',
      'English',
    ],
  },
  {
    heading: 'Independent Server Components',
    path: '/server-redux-streams',
    texts: [
      'Ada Lovelace',
      'Using Redux with React Server Components',
      'English',
    ],
  },
] as const;

for (const route of serverRoutes) {
  test(`${route.path} hydrates server state without repeating API requests`, async ({
    page,
  }) => {
    const { apiRequests, runtimeErrors } = observeBrowser(page);

    await page.goto(route.path);
    await expect(
      page.getByRole('heading', { name: route.heading })
    ).toBeVisible();

    for (const text of route.texts) {
      await expect(page.getByText(text, { exact: true })).toBeVisible();
    }

    await page.getByRole('button', { name: 'Try cached load' }).click();
    await expect(
      page.getByRole('button', { name: 'Force reload' })
    ).toBeEnabled();

    expect(apiRequests).toEqual([]);
    expect(runtimeErrors).toEqual([]);
  });
}

test('a hydrated Server Component supports a forced client reload', async ({
  page,
}) => {
  const { apiRequests, runtimeErrors } = observeBrowser(page);

  await page.goto('/server-redux');
  await expect(page.getByText('Ada Lovelace', { exact: true })).toBeVisible();
  expect(apiRequests).toEqual([]);

  await page.getByRole('button', { name: 'Force reload' }).click();
  await expect(page.getByRole('button', { name: 'Loading…' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Force reload' })
  ).toBeVisible();

  expect(apiRequests).toEqual(['/api/users']);
  expect(runtimeErrors).toEqual([]);
});

test('client navigation consumes RSC payloads and keeps hydrated requests', async ({
  page,
}) => {
  const { apiRequests, runtimeErrors } = observeBrowser(page);

  await page.goto('/server-redux-streams');
  await expect(page.getByText('Ada Lovelace', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Async component' }).click();
  await expect(page).toHaveURL(/\/server-redux$/);
  await expect(
    page.getByRole('heading', { name: 'Async Server Component + Redux' })
  ).toBeVisible();
  await expect(page.getByText('Ada Lovelace', { exact: true })).toBeVisible();

  expect(apiRequests).toEqual([]);
  expect(runtimeErrors).toEqual([]);
});
