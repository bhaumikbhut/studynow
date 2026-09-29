import { expect, type Page } from '@playwright/test';
import type { Article, ArticleInput } from '../support/data';

export class EditorPage {
  constructor(readonly page: Page) {}
  async open() { await this.page.goto('/editor'); }
  async fill(article: ArticleInput) {
    await this.page.getByPlaceholder('Article Title', { exact: true }).fill(article.title);
    await this.page.getByPlaceholder("What's this article about?", { exact: true }).fill(article.description);
    await this.page.getByPlaceholder('Write your article (in markdown)', { exact: true }).fill(article.body);
  }
  async addTag(tag: string) {
    const input = this.page.getByPlaceholder('Enter tags', { exact: true });
    await input.fill(tag);
    await input.press('Enter');
  }
  async publish(method: 'POST' | 'PUT', track: (slug: string) => void): Promise<Article> {
    const responsePromise = this.page.waitForResponse(response =>
      response.request().method() === method && /\/api\/articles(?:\/[^/?]+)?\/?$/.test(new URL(response.url()).pathname));
    await this.page.getByRole('button', { name: 'Publish Article', exact: true }).click();
    const response = await responsePromise;
    if (response.ok()) {
      const { article } = await response.json();
      track(article.slug);
      expect(response.status()).toBe(method === 'POST' ? 201 : 200);
      await expect(this.page).toHaveURL(new RegExp(`/article/${encodeURIComponent(article.slug)}$`));
      return article;
    }
    throw new Error(`Article ${method} failed: HTTP ${response.status()}`);
  }
}

export class ArticlePage {
  constructor(readonly page: Page) {}
  // Icon-font glyphs are included in these controls' accessible names.
  get edit() { return this.page.getByRole('link', { name: /Edit Article$/ }); }
  get remove() { return this.page.getByRole('button', { name: /Delete Article$/ }); }
  async open(slug: string) { await this.page.goto(`/article/${encodeURIComponent(slug)}`); }
  async expectContent(article: ArticleInput) {
    await expect(this.page.getByRole('heading', { name: article.title, exact: true })).toBeVisible();
    await expect(this.page.locator('.article-content')).toContainText(article.body);
    for (const tag of article.tagList) await expect(this.page.locator('.article-content')).toContainText(tag);
  }
  async startEdit() { await this.edit.first().click(); }
  async delete(slug: string) {
    const responsePromise = this.page.waitForResponse(response =>
      response.request().method() === 'DELETE' && new URL(response.url()).pathname.endsWith(`/articles/${encodeURIComponent(slug)}`));
    await this.remove.first().click();
    expect((await responsePromise).status()).toBe(204);
    await expect(this.page).toHaveURL(/\/$/);
  }
}
