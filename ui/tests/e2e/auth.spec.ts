import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Mock the auth providers endpoint
        await page.route('**/api/v1/auth/providers', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        name: 'github',
                        displayName: 'GitHub',
                        iconUrl: 'https://github.com/favicon.ico',
                        isEnabled: true
                    }
                ]),
            });
        });

        // We can also intercept the authorization endpoint or callback,
        // but the main UI test is just ensuring the login form renders
        // and reacts.
    });

    test('should display login form when not authenticated', async ({ page }) => {
        // Navigating to the app when unauthenticated should show the login form
        await page.goto('/');

        // Wait for the login form component to be rendered
        const loginForm = page.locator('login-form');
        await expect(loginForm).toBeVisible();

        // Provider should be loaded and displayed
        const githubBtn = loginForm.locator('button[data-provider="github"]');
        await expect(githubBtn).toBeVisible();
        await expect(githubBtn).toContainText('Continue with GitHub');
    });

    test('should simulate successful login and redirect to main app', async ({ page, context }) => {
        // Set mock authentication state in sessionStorage before navigation
        await context.addInitScript(() => {
            window.sessionStorage.setItem('auth_token', 'mock_token');
            window.sessionStorage.setItem('user_info', JSON.stringify({ name: 'Admin User', email: 'admin@example.com' }));
            window.sessionStorage.setItem('token_expires_at', new Date(Date.now() + 3600000).toISOString());
        });

        // Mock applications endpoint assuming main app loads it
        await page.route('**/api/v1/applications', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        await page.goto('/');

        // App should bypass login and show the main layout
        const appLayout = page.locator('app-layout');
        await expect(appLayout).toBeVisible();

        // Verify header is visible
        const appHeader = page.locator('app-header');
        await expect(appHeader).toBeVisible();
    });
});
