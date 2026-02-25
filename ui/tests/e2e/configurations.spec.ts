import { test, expect } from '@playwright/test';

test.describe('Configurations Flow', () => {
    test.beforeEach(async ({ page, context }) => {
        // Authenticate
        await context.addInitScript(() => {
            window.sessionStorage.setItem('auth_token', 'mock_token');
            window.sessionStorage.setItem('user_info', JSON.stringify({ name: 'Admin', email: 'admin@example.com' }));
            window.sessionStorage.setItem('token_expires_at', new Date(Date.now() + 3600000).toISOString());
        });
    });

    test('should list configurations for an application', async ({ page }) => {
        const mockApp = {
            id: 'app-1',
            name: 'Test Application',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            configurations: [
                {
                    id: 'config-1',
                    name: 'Production Config',
                    environment: 'production',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]
        };


        await page.route('**/api/v1/applications/app-1', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockApp) });
        });

        await page.route('**/api/v1/applications/app-1/configurations', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockApp.configurations) });
        });

        await page.goto('/#/applications/app-1');

        const configList = page.locator('configuration-list');
        await expect(configList).toBeVisible();

        // Setup verification for rendering the production config (which is handled inside the application detail or configuration list)
        await expect(page.locator('tbody tr').first()).toContainText('Production Config', { timeout: 2000 });
    });
});
