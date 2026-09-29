# Conduit QA — Playwright + TypeScript

Automated tests for the [Conduit app](https://conduit.bondaracademy.com).
See [GSP test strategy](docs/gsp-test-strategy.md) for Part 2 of the assessment.

## Run the tests

Install Node.js 22 or newer, then run:

```bash
npm ci
npx playwright install chromium
npm run typecheck
npm test
npm run report
```

On Linux, use `npx playwright install --with-deps chromium`.

Optional commands:

```bash
npm run test:api       # API tests only
npm run test:ui        # Browser tests only
npm run test:headed    # Watch the browser
```

To use another deployment, export `BASE_URL` and `API_URL` as shown in `.env.example`; `.env` files are not loaded automatically. The frontend must use the same API.

## What is tested?

Five tests cover:

- UI sign-up and sign-in, including sessions after reload.
- UI article creation, editing, saved content and deletion.
- Permissions: user A cannot edit or delete user B’s article.
- API registration and article CRUD, checking status codes and saved data.

The permission test checks that edit/delete controls are hidden, direct API requests return **403**, and B’s article stays unchanged. The article lifecycle also confirms that owners can edit and delete.

## Project structure

```text
tests/ui/          Browser tests
tests/api/         API tests
tests/pages/       Page objects
tests/support/     API helpers, fixtures and unique test data
docs/              GSP strategy
.github/workflows/ GitHub Actions
```

Tests use fresh browser contexts and unique users/articles. Setup uses the API, except when testing UI sign-up. Fixtures clean up tracked articles. Locators and retrying assertions wait for the app; there are no fixed sleeps.

## CI and reports

The GitHub Actions workflow runs on every push and pull request and uploads an HTML report. CI allows one retry: a test that passes on retry lets CI succeed but is marked as flaky in the report. A test that fails both attempts fails CI. Local runs have no retries.

Use `npm run report` to inspect results. Traces are off by default because they can contain credentials; enable locally with `PW_TRACE=1 npm test`.
