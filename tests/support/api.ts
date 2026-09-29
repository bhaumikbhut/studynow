import { expect, type APIRequestContext } from '@playwright/test';
import type { Article, ArticleInput, Credentials, User } from './data';

export class ConduitApi {
  readonly baseURL = (process.env.API_URL ?? 'https://conduit-api.bondaracademy.com/api').replace(/\/$/, '');
  constructor(readonly request: APIRequestContext) {}

  url(path: string) { return `${this.baseURL}${path}`; }
  headers(token: string) { return { Authorization: `Token ${token}` }; }
  articlePath(slug: string) { return `/articles/${encodeURIComponent(slug)}`; }

  register(user: Credentials) {
    return this.request.post(this.url('/users'), { data: { user } });
  }

  async createUser(credentials: Credentials): Promise<User> {
    const response = await this.register(credentials);
    expect(response.status(), 'API fixture registration').toBe(201);
    const { user } = await response.json();
    expect(user).toMatchObject({ username: credentials.username, email: credentials.email });
    expect(typeof user.token).toBe('string');
    expect(user.token.length).toBeGreaterThan(0);
    return user;
  }

  create(token: string, article: ArticleInput) {
    return this.request.post(this.url('/articles'), { headers: this.headers(token), data: { article } });
  }
  read(slug: string) { return this.request.get(this.url(this.articlePath(slug))); }
  update(token: string, slug: string, article: Partial<ArticleInput>) {
    return this.request.put(this.url(this.articlePath(slug)), { headers: this.headers(token), data: { article } });
  }
  delete(token: string, slug: string) {
    return this.request.delete(this.url(this.articlePath(slug)), { headers: this.headers(token) });
  }

  async seedArticle(token: string, input: ArticleInput): Promise<Article> {
    const response = await this.create(token, input);
    expect(response.status(), 'API fixture article creation').toBe(201);
    return (await response.json()).article;
  }
}
