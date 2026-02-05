import { BaseComponent } from '@/components/base/base-component';

export class OAuthCallback extends BaseComponent {
    constructor() {
        super();
        this.handleCallback();
    }

    protected render(): void {
        const template = this.createTemplate(`
            <div class="oauth-callback-container">
                <div class="oauth-callback-card">
                    <div class="loading-spinner">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                <animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" values="0 12 12;360 12 12"/>
                            </path>
                        </svg>
                    </div>
                    <h2>Completing sign in...</h2>
                    <p>Please wait while we complete your authentication.</p>
                </div>
            </div>
        `, `
            .oauth-callback-container {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
            }

            .oauth-callback-card {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                padding: 40px;
                text-align: center;
                max-width: 400px;
            }

            .loading-spinner {
                color: #667eea;
                margin-bottom: 20px;
            }

            .error-icon {
                font-size: 48px;
                margin-bottom: 20px;
            }

            h2 {
                color: #333;
                margin: 0 0 10px 0;
                font-size: 24px;
                font-weight: 600;
            }

            p {
                color: #666;
                margin: 0;
                font-size: 16px;
                line-height: 1.5;
            }
        `);
        this.shadow.innerHTML = '';
        this.shadow.appendChild(template.content.cloneNode(true));
    }

    private async handleCallback(): Promise<void> {
        this.render();

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            const refreshToken = urlParams.get('refresh_token');
            const expiresAt = urlParams.get('expires_at');
            const userInfoParam = urlParams.get('user');
            const error = urlParams.get('error');

            if (error) {
                this.showError(`Authentication failed: ${error}`);
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
                return;
            }

            if (token && refreshToken && expiresAt && userInfoParam) {
                // Parse and normalize user info
                const userInfo = JSON.parse(decodeURIComponent(userInfoParam));
                
                // Debug logging
                console.log('Raw user info from OAuth callback:', userInfo);
                
                // Convert PascalCase to camelCase for frontend compatibility
                const normalizedUserInfo = {
                    id: userInfo.Id || userInfo.id,
                    email: userInfo.Email || userInfo.email,
                    name: userInfo.Name || userInfo.name,
                    avatarUrl: userInfo.AvatarUrl || userInfo.avatar_url || userInfo.avatarUrl,
                    role: userInfo.Role || userInfo.role,
                    provider: userInfo.Provider || userInfo.provider,
                    providerId: userInfo.ProviderId || userInfo.provider_id || userInfo.providerId,
                    createdAt: userInfo.CreatedAt || userInfo.created_at || userInfo.createdAt,
                    lastLoginAt: userInfo.LastLoginAt || userInfo.last_login_at || userInfo.lastLoginAt
                };

                console.log('Normalized user info:', normalizedUserInfo);

                // Store authentication data
                sessionStorage.setItem('auth_token', token);
                sessionStorage.setItem('refresh_token', refreshToken);
                sessionStorage.setItem('token_expires_at', expiresAt);
                sessionStorage.setItem('user_info', JSON.stringify(normalizedUserInfo));

                // Clean up URL
                window.history.replaceState({}, document.title, '/');

                // Dispatch success event
                window.dispatchEvent(new CustomEvent('auth:login-success'));

                // Redirect to main app
                window.location.href = '/';
            } else {
                this.showError('Invalid authentication response');
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
            }
        } catch (error) {
            console.error('OAuth callback error:', error);
            this.showError('Authentication failed');
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
        }
    }

    private showError(message: string): void {
        const template = this.createTemplate(`
            <div class="oauth-callback-container">
                <div class="oauth-callback-card">
                    <div class="error-icon">❌</div>
                    <h2>Authentication Failed</h2>
                    <p>${message}</p>
                    <p>Redirecting to login page...</p>
                </div>
            </div>
        `, `
            .oauth-callback-container {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
            }

            .oauth-callback-card {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                padding: 40px;
                text-align: center;
                max-width: 400px;
            }

            .error-icon {
                font-size: 48px;
                margin-bottom: 20px;
            }

            h2 {
                color: #333;
                margin: 0 0 10px 0;
                font-size: 24px;
                font-weight: 600;
            }

            p {
                color: #666;
                margin: 0;
                font-size: 16px;
                line-height: 1.5;
            }
        `);
        
        this.shadow.innerHTML = '';
        this.shadow.appendChild(template.content.cloneNode(true));
    }
}

// Define the custom element
customElements.define('oauth-callback', OAuthCallback);