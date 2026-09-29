import { randomUUID } from 'node:crypto';

export function newUser() {
  const id = randomUUID().replaceAll('-', '');
  // The hosted app limits usernames and passwords to 20 characters.
  return { username: `qa${id.slice(0, 16)}`, email: `qa${id}@example.com`, password: `Qa!${randomUUID().replaceAll('-', '').slice(0, 16)}` };
}

export function newArticle() {
  const id = randomUUID();
  return {
    title: `QA lifecycle ${id}`,
    description: `Isolated automation article ${id}`,
    body: `Original article body for ${id}.`,
    tagList: ['qa-automation'],
  };
}

export type Credentials = ReturnType<typeof newUser>;
export type ArticleInput = ReturnType<typeof newArticle>;
export type User = { username: string; email: string; token: string };
export type Article = ArticleInput & {
  slug: string;
  author: { username: string };
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
};
