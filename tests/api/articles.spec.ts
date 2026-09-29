import { test, expect } from '../support/fixtures';
import { newArticle, newUser } from '../support/data';

test('REST API registers a user and performs the full article CRUD cycle', async ({ api, trackArticle }) => {
  const credentials = newUser();
  const registration = await api.register(credentials);
  expect(registration.status()).toBe(201);
  const { user } = await registration.json();
  expect(user).toMatchObject({ username: credentials.username, email: credentials.email });
  expect(typeof user.token).toBe('string');
  expect(user.token.length).toBeGreaterThan(0);
  expect(user).not.toHaveProperty('password');

  const input = newArticle();
  const creation = await api.create(user.token, input);
  expect(creation.status()).toBe(201);
  const { article } = await creation.json();
  trackArticle(user.token, article.slug);
  expect(article).toMatchObject({ ...input, author: { username: credentials.username }, favoritesCount: 0, favorited: false });
  expect(article.slug).toEqual(expect.any(String));
  expect(article.slug.length).toBeGreaterThan(0);
  expect(Number.isNaN(Date.parse(article.createdAt))).toBe(false);

  const read = await api.read(article.slug);
  expect(read.status()).toBe(200);
  expect((await read.json()).article).toMatchObject({ ...input, slug: article.slug });

  const updated = { ...input, title: `${input.title} updated`, description: 'API updated description', body: 'API updated body.' };
  const update = await api.update(user.token, article.slug, updated);
  expect(update.status()).toBe(200);
  const { article: edited } = await update.json();
  trackArticle(user.token, edited.slug);
  expect(edited).toMatchObject({ ...updated, author: { username: credentials.username } });
  expect(Date.parse(edited.updatedAt)).toBeGreaterThanOrEqual(Date.parse(article.createdAt));
  const persisted = await api.read(edited.slug);
  expect(persisted.status()).toBe(200);
  expect((await persisted.json()).article).toMatchObject(updated);

  const deletion = await api.delete(user.token, edited.slug);
  expect(deletion.status()).toBe(204);
  expect(await deletion.text()).toBe('');
  expect((await api.read(edited.slug)).status()).toBe(404);
});
