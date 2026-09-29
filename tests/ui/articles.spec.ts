import { test, expect } from '../support/fixtures';
import { newArticle } from '../support/data';

test('author creates, edits, verifies and deletes an article through the UI', async ({
  page, account, api, authPage, editorPage, articlePage, trackArticle,
}) => {
  await authPage.useApiSession(account.user);
  const original = newArticle();
  const track = (slug: string) => trackArticle(account.user.token, slug);
  await editorPage.open();
  await editorPage.fill(original);
  await editorPage.addTag(original.tagList[0]);
  const created = await editorPage.publish('POST', track);
  await articlePage.expectContent(original);

  const updated = { ...original, title: `${original.title} edited`, description: 'Updated description', body: 'Updated body persisted through the UI.' };
  await articlePage.startEdit();
  await expect(page.getByPlaceholder('Article Title', { exact: true })).toHaveValue(original.title);
  await editorPage.fill(updated);
  const edited = await editorPage.publish('PUT', track);
  await page.reload();
  await articlePage.expectContent(updated);
  const persisted = await api.read(edited.slug);
  expect(persisted.status()).toBe(200);
  expect((await persisted.json()).article).toMatchObject({ ...updated, author: { username: account.user.username } });
  expect(created.author.username).toBe(account.user.username);

  await articlePage.delete(edited.slug);
  expect((await api.read(edited.slug)).status()).toBe(404);
});
