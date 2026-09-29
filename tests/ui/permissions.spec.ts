import { test, expect } from '../support/fixtures';
import { newArticle, newUser } from '../support/data';

test('user A cannot edit or delete user B’s article', async ({
  account: userA, api, authPage, articlePage, trackArticle,
}) => {
  const userB = await api.createUser(newUser());
  const input = newArticle();
  const article = await api.seedArticle(userB.token, input);
  trackArticle(userB.token, article.slug);
  await authPage.useApiSession(userA.user);
  await articlePage.open(article.slug);
  await authPage.expectSignedIn(userA.user.username);
  await articlePage.expectContent(input);
  await expect(articlePage.edit).toHaveCount(0);
  await expect(articlePage.remove).toHaveCount(0);

  // Attempt both operations even when one is incorrectly allowed. Soft checks
  // preserve all evidence and the final read proves the owner's data survived.
  const edit = await api.update(userA.user.token, article.slug, { body: 'Unauthorized overwrite' });
  expect.soft(edit.status(), 'Authenticated non-owner update must be forbidden').toBe(403);
  const afterEdit = await api.read(article.slug);
  expect.soft(afterEdit.status()).toBe(200);
  if (afterEdit.ok()) expect.soft((await afterEdit.json()).article).toMatchObject(input);

  const deletion = await api.delete(userA.user.token, article.slug);
  expect.soft(deletion.status(), 'Authenticated non-owner deletion must be forbidden').toBe(403);
  const afterDelete = await api.read(article.slug);
  expect(afterDelete.status(), 'Owner article must still exist').toBe(200);
  expect((await afterDelete.json()).article).toMatchObject({ ...input, author: { username: userB.username } });
});
