import { test, expect } from '../support/fixtures';
import { newUser } from '../support/data';

test('new user can sign up through the UI and retain a session', async ({ page, authPage, api }) => {
  const credentials = newUser();
  await authPage.signUp(credentials);
  await page.reload();
  await authPage.expectSignedIn(credentials.username);
  const token = await page.evaluate(() => localStorage.getItem('jwtToken'));
  expect(typeof token).toBe('string');
  const response = await api.request.get(api.url('/user'), { headers: api.headers(token!) });
  expect(response.status()).toBe(200);
  const { user } = await response.json();
  expect(user).toMatchObject({ username: credentials.username, email: credentials.email });
});

test('existing API-created user can sign in through the UI', async ({ page, account, authPage }) => {
  await authPage.signIn(account.credentials);
  await page.reload();
  await authPage.expectSignedIn(account.user.username);
  await page.goto('/editor');
  await expect(page.getByPlaceholder('Article Title', { exact: true })).toBeVisible();
});
