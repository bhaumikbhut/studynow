import { test as base, expect } from '@playwright/test';
import { ConduitApi } from './api';
import { newUser, type Credentials, type User } from './data';
import { AuthPage } from '../pages/auth.page';
import { EditorPage, ArticlePage } from '../pages/article.page';

type Fixtures = {
  api: ConduitApi;
  account: { credentials: Credentials; user: User };
  authPage: AuthPage;
  editorPage: EditorPage;
  articlePage: ArticlePage;
  trackArticle: (token: string, slug: string) => void;
};

export const test = base.extend<Fixtures>({
  api: async ({ request }, use) => { await use(new ConduitApi(request)); },
  account: async ({ api }, use) => {
    const credentials = newUser();
    await use({ credentials, user: await api.createUser(credentials) });
  },
  authPage: async ({ page, baseURL }, use) => { await use(new AuthPage(page, baseURL!)); },
  editorPage: async ({ page }, use) => { await use(new EditorPage(page)); },
  articlePage: async ({ page }, use) => { await use(new ArticlePage(page)); },
  trackArticle: async ({ api }, use) => {
    const articles = new Map<string, string>();
    await use((token, slug) => articles.set(slug, token));
    // Track old and new slugs: title edits can change the slug.
    const failures: string[] = [];
    for (const [slug, token] of articles) {
      try {
        const response = await api.delete(token, slug);
        if (![204, 404].includes(response.status())) failures.push(`${slug}: HTTP ${response.status()}`);
      } catch { failures.push(`${slug}: cleanup request failed`); }
    }
    expect(failures, 'Article cleanup failures').toEqual([]);
  },
});

export { expect } from '@playwright/test';
