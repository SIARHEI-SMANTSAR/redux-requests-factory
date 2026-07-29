import http from 'node:http';

import { expect, test } from '@playwright/test';

const readStreamedResponse = (url: string) =>
  new Promise<{ chunks: string[]; statusCode?: number }>((resolve, reject) => {
    http
      .get(url, (response) => {
        const chunks: string[] = [];

        response.setEncoding('utf8');
        response.on('data', (chunk: string) => chunks.push(chunk));
        response.on('end', () =>
          resolve({ chunks, statusCode: response.statusCode })
        );
        response.on('error', reject);
      })
      .on('error', reject);
  });

test('streams the shell and resolves independent boundaries in API order', async ({
  baseURL,
}) => {
  const { chunks, statusCode } = await readStreamedResponse(
    `${baseURL}/batch`
  );
  const shell = chunks[0] ?? '';
  const html = chunks.join('');

  expect(statusCode).toBe(200);
  expect(chunks.length).toBeGreaterThan(1);
  expect(shell).toContain('Streamed dashboard');
  expect(shell).toContain('Streaming activity');
  expect(shell).not.toContain('Production deployment completed');

  const activityChunk = chunks.findIndex((chunk) =>
    chunk.includes('Production deployment completed')
  );
  const usersChunk = chunks.findIndex((chunk) =>
    chunk.includes('<strong>3</strong>')
  );
  const statsChunk = chunks.findIndex((chunk) =>
    chunk.includes('<strong>12</strong>')
  );

  expect(activityChunk).toBeGreaterThan(0);
  expect(usersChunk).toBeGreaterThan(activityChunk);
  expect(statsChunk).toBeGreaterThan(usersChunk);
  expect(html).toContain('window.__SSR_DATA__=');
});

test('hydrates without duplicate requests and supports navigation and reloads', async ({
  page,
}) => {
  const browserApiRequests: string[] = [];
  const runtimeErrors: string[] = [];

  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/')) {
      browserApiRequests.push(new URL(request.url()).pathname);
    }
  });
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  await page.goto('/batch');

  await expect(
    page.getByRole('heading', { name: 'Streamed dashboard' })
  ).toBeVisible();
  await expect(page.getByText('Production deployment completed')).toBeVisible();
  await expect(page.getByText('99.8%')).toBeVisible();
  expect(browserApiRequests).toEqual([]);

  await page.getByRole('link', { name: 'Single request' }).click();
  await expect(page).toHaveURL(/\/single$/);
  await expect(
    page.getByRole('heading', { name: 'Single streamed request' })
  ).toBeVisible();
  await expect(page.getByText('Ada Lovelace')).toBeVisible();
  expect(browserApiRequests).toEqual([]);

  await page.getByRole('button', { name: 'Force reload users' }).click();
  await expect(page.getByText('Streaming users…')).toBeVisible();
  await expect(page.getByText('Ada Lovelace')).toBeVisible();
  expect(browserApiRequests).toEqual(['/api/users']);

  await page.getByRole('link', { name: 'Request batch' }).click();
  await page.getByRole('button', { name: 'Force reload stats' }).click();
  await expect(page.locator('article[aria-busy="true"]')).toHaveCount(2);
  await expect(page.getByText('99.8%')).toBeVisible();
  expect(browserApiRequests.filter((path) => path === '/api/stats')).toHaveLength(
    1
  );
  expect(runtimeErrors).toEqual([]);
});
