import { expect, type Page } from '@playwright/test';
import type { Credentials, User } from '../support/data';

export class AuthPage {
  constructor(readonly page: Page, readonly baseURL: string) {}

  async signUp(credentials: Credentials) {
    await this.page.goto('/register');
    await this.page.getByPlaceholder('Username', { exact: true }).fill(credentials.username);
    await this.fillCredentials(credentials);
    await this.page.getByRole('button', { name: 'Sign up', exact: true }).click();
    await this.expectSignedIn(credentials.username);
  }

  async signIn(credentials: Credentials) {
    await this.page.goto('/login');
    await this.fillCredentials(credentials);
    await this.page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await this.expectSignedIn(credentials.username);
  }

  private async fillCredentials(credentials: Credentials) {
    await this.page.getByPlaceholder('Email', { exact: true }).fill(credentials.email);
    await this.page.getByPlaceholder('Password', { exact: true }).fill(credentials.password);
  }

  async expectSignedIn(username: string) {
    await expect(this.page.locator('nav').getByRole('link', { name: username, exact: true })).toBeVisible();
    await expect(this.page.locator('nav').getByRole('link', { name: 'Sign in', exact: true })).toHaveCount(0);
  }

  async useApiSession(user: User) {
    await this.page.addInitScript(({ token, origin }) => {
      if (location.origin === origin) localStorage.setItem('jwtToken', token);
    }, { token: user.token, origin: new URL(this.baseURL).origin });
  }
}
