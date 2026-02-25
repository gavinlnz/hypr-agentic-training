import { test, expect } from '@playwright/test';

test.describe('Applications CRUD Flow', () => {
    test.beforeEach(async ({ page, context }) => {
        // Authenticate
        await context.addInitScript(() => {
            window.sessionStorage.setItem('auth_token', 'mock_token');
            window.sessionStorage.setItem('user_info', JSON.stringify({ name: 'Admin', email: 'admin@example.com' }));
            window.sessionStorage.setItem('token_expires_at', new Date(Date.now() + 3600000).toISOString());
        });
    });

    test('should list applications', async ({ page }) => {
        await page.route('**/api/v1/applications', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 'app-1',
                        name: 'Test Application 1',
                        comments: 'First mock app',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ])
            });
        });

        await page.goto('/#/applications');

        const appList = page.locator('application-list');
        await expect(appList).toBeVisible();

        // Verify the mock app is rendered
        await expect(page.locator('.app-name').first()).toHaveText('Test Application 1');
        await expect(page.locator('.app-comments').first()).toHaveText('First mock app');
    });

    test('should create a new application', async ({ page }) => {
        // Mock APIs
        await page.route('**/api/v1/applications', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'app-new',
                        name: 'New Playwright App',
                        comments: 'Created via E2E test',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });
            } else {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            }
        });

        await page.goto('/#/applications/new');

        const form = page.locator('application-form');
        await expect(form).toBeVisible();

        // Fill the form
        await page.fill('input[name="name"]', 'New Playwright App');
        await page.fill('textarea[name="comments"]', 'Created via E2E test');

        // Submit the form
        await page.click('button[type="submit"]');

        // Upon success, it should navigate back to the list
        await expect(page).toHaveURL(/.*#\/applications$/);
    });

    test('should update an existing application', async ({ page }) => {
        const mockApp = {
            id: 'app-1',
            name: 'Existing App',
            comments: 'Existing comments',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Note: The UI fetches the app via GET /api/v1/applications/:id
        // But since the configClient wraps responses in `{ data }` vs bare, we match what client expects.
        await page.route('**/api/v1/applications/app-1', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockApp) });
            } else if (route.request().method() === 'PUT') {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...mockApp, name: 'Updated App' }) });
            }
        });

        await page.goto('/#/applications/app-1/edit');

        const form = page.locator('application-form');
        await expect(form).toBeVisible();

        // Verify it loaded the existing data
        await expect(page.locator('input[name="name"]')).toHaveValue('Existing App');

        // Modify the name
        await page.fill('input[name="name"]', 'Updated App');
        await page.click('button[type="submit"]');

        // Upon success, it should navigate back to the list
        await expect(page).toHaveURL(/.*#\/applications$/);
    });

    test('should delete an application', async ({ page }) => {
        const mockApp = {
            id: 'app-1',
            name: 'App to Delete',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        await page.route('**/api/v1/applications/app-1', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockApp) });
            } else if (route.request().method() === 'DELETE') {
                await route.fulfill({ status: 204 });
            }
        });

        await page.goto('/#/applications/app-1/edit');

        // Handle the browser confirm dialog silently returning true
        page.on('dialog', dialog => dialog.accept());

        // Click Delete Application
        await page.click('button:has-text("Delete Application")');

        // Upon success, it should navigate back to the list
        await expect(page).toHaveURL(/.*#\/applications$/);
    });
});
