import { BaseComponent } from '@/components/base/base-component';
import { ApiClient } from '@/services/api-client';
import type { OAuthProvider } from '@/types/auth';

export class LoginForm extends BaseComponent {
    private apiClient = new ApiClient();
    private isLoading = false;
    private providers: OAuthProvider[] = [];

    constructor() {
        super();
        this.loadProviders();
    }

    private async loadProviders(): Promise<void> {
        try {
            this.providers = await this.apiClient.request<OAuthProvider[]>('/auth/providers');
            this.render();
        } catch (error) {
            console.error('Failed to load OAuth providers:', error);
            this.renderError('Failed to load authentication providers');
        }
    }

    protected render(): void {
        const template = this.createTemplate(`
            <div class="login-container">
                <div class="login-card">
                    <div class="login-header">
                        <h1>Config Service Admin</h1>
                        <p>Sign in with your account</p>
                    </div>
                    
                    <div class="oauth-providers">
                        ${this.renderProviders()}
                    </div>
                    
                    <div class="error-message" id="errorMessage" style="display: none;"></div>
                    
                    <div class="login-footer">
                        <p class="security-notice">
                            🔒 This is a secure admin interface. All actions are logged and monitored.
                        </p>
                    </div>
                </div>
            </div>
        `, `
            .login-container {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
            }

            .login-card {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                padding: 40px;
                width: 100%;
                max-width: 400px;
            }

            .login-header {
                text-align: center;
                margin-bottom: 30px;
            }

            .login-header h1 {
                color: #333;
                margin: 0 0 10px 0;
                font-size: 28px;
                font-weight: 600;
            }

            .login-header p {
                color: #666;
                margin: 0;
                font-size: 16px;
            }

            .oauth-providers {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 20px;
            }

            .oauth-button {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                padding: 12px 20px;
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                background: white;
                color: #333;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
                position: relative;
            }

            .oauth-button:hover {
                border-color: #667eea;
                background: #f8f9ff;
                transform: translateY(-1px);
            }

            .oauth-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }

            .oauth-icon {
                width: 20px;
                height: 20px;
            }

            .oauth-loading {
                color: #667eea;
            }

            .loading-providers {
                text-align: center;
                padding: 40px 20px;
                color: #666;
            }

            .loading-spinner {
                margin-bottom: 16px;
                color: #667eea;
            }

            .error-message {
                background: #fee;
                border: 1px solid #fcc;
                color: #c33;
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 20px;
                font-size: 14px;
            }

            .error-message.shake {
                animation: shake 0.5s ease-in-out;
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }

            .login-footer {
                text-align: center;
                margin-top: 30px;
            }

            .security-notice {
                color: #666;
                font-size: 14px;
                margin: 0;
            }

            .btn {
                display: inline-block;
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                text-decoration: none;
                transition: all 0.2s ease;
            }

            .btn-primary {
                background: #667eea;
                color: white;
            }

            .btn-primary:hover {
                background: #5a6fd8;
            }

            .btn-full-width {
                width: 100%;
            }
        `);
        this.shadow.innerHTML = '';
        this.shadow.appendChild(template.content.cloneNode(true));
        this.setupEventListeners();
    }

    private renderProviders(): string {
        if (this.providers.length === 0) {
            return `
                <div class="loading-providers">
                    <div class="loading-spinner">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                <animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" values="0 12 12;360 12 12"/>
                            </path>
                        </svg>
                    </div>
                    <p>Loading authentication providers...</p>
                </div>
            `;
        }

        return this.providers
            .filter(provider => provider.isEnabled)
            .map(provider => `
                <button 
                    class="oauth-button oauth-button-${provider.name}" 
                    data-provider="${provider.name}"
                    type="button"
                >
                    <img 
                        src="${provider.iconUrl}" 
                        alt="${provider.displayName}" 
                        class="oauth-icon"
                        onerror="this.style.display='none'"
                    >
                    <span class="oauth-text">Continue with ${provider.displayName}</span>
                    <div class="oauth-loading" style="display: none;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                <animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" values="0 12 12;360 12 12"/>
                            </path>
                        </svg>
                    </div>
                </button>
            `).join('');
    }

    private renderError(message: string): void {
        const template = this.createTemplate(`
            <div class="login-container">
                <div class="login-card">
                    <div class="login-header">
                        <h1>Config Service Admin</h1>
                        <p>Authentication Error</p>
                    </div>
                    
                    <div class="error-message" style="display: block;">
                        ${message}
                    </div>
                    
                    <div class="form-actions">
                        <button 
                            type="button" 
                            class="btn btn-primary btn-full-width"
                            onclick="window.location.reload()"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        `, `
            .login-container {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
            }

            .login-card {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                padding: 40px;
                width: 100%;
                max-width: 400px;
            }

            .login-header {
                text-align: center;
                margin-bottom: 30px;
            }

            .login-header h1 {
                color: #333;
                margin: 0 0 10px 0;
                font-size: 28px;
                font-weight: 600;
            }

            .login-header p {
                color: #666;
                margin: 0;
                font-size: 16px;
            }

            .error-message {
                background: #fee;
                border: 1px solid #fcc;
                color: #c33;
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 20px;
                font-size: 14px;
            }

            .btn {
                display: inline-block;
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                text-decoration: none;
                transition: all 0.2s ease;
            }

            .btn-primary {
                background: #667eea;
                color: white;
            }

            .btn-primary:hover {
                background: #5a6fd8;
            }

            .btn-full-width {
                width: 100%;
            }
        `);
        
        this.shadow.innerHTML = '';
        this.shadow.appendChild(template.content.cloneNode(true));
    }

    protected setupEventListeners(): void {
        // OAuth provider buttons
        this.$$('.oauth-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const target = e.currentTarget as HTMLButtonElement;
                const provider = target.dataset.provider;
                if (provider) {
                    await this.handleOAuthLogin(provider);
                }
            });
        });

        // Handle OAuth callback if we're returning from provider
        this.handleOAuthCallback();
    }

    private async handleOAuthLogin(provider: string): Promise<void> {
        if (this.isLoading) return;

        this.setProviderLoading(provider, true);
        this.hideError();

        try {
            // Get authorization URL from backend
            const response = await this.apiClient.request<{ authorizationUrl: string }>(
                `/auth/authorize/${provider}?returnUrl=${encodeURIComponent(window.location.origin)}`
            );

            // Redirect to OAuth provider
            window.location.href = response.authorizationUrl;
            
        } catch (error: any) {
            console.error('OAuth login failed:', error);
            
            if (error.status === 404) {
                this.showError(`${provider} authentication is not available`);
            } else if (error.status >= 500) {
                this.showError('Server error. Please try again later.');
            } else {
                this.showError('Authentication failed. Please try again.');
            }
        } finally {
            this.setProviderLoading(provider, false);
        }
    }

    private handleOAuthCallback(): void {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const provider = urlParams.get('provider') || this.detectProviderFromUrl();

        if (error) {
            this.showError(`Authentication failed: ${error}`);
            this.cleanupUrl();
            return;
        }

        if (code && provider) {
            this.completeOAuthLogin(provider, code, state);
        }
    }

    private async completeOAuthLogin(provider: string, code: string, state: string | null): Promise<void> {
        this.setProviderLoading(provider, true);
        this.hideError();

        try {
            const response = await this.apiClient.request<any>('/auth/callback', {
                method: 'POST',
                body: JSON.stringify({
                    provider,
                    code,
                    state
                })
            });

            // Store authentication data
            this.storeAuthData(response);
            
            // Clean up URL and redirect to app
            this.cleanupUrl();
            this.redirectToApp();
            
        } catch (error: any) {
            console.error('OAuth callback failed:', error);
            
            if (error.status === 401) {
                this.showError('Authentication failed. Please try again.');
            } else if (error.status >= 500) {
                this.showError('Server error. Please try again later.');
            } else {
                this.showError('Authentication failed. Please try again.');
            }
            
            this.cleanupUrl();
        } finally {
            this.setProviderLoading(provider, false);
        }
    }

    private detectProviderFromUrl(): string {
        // Try to detect provider from referrer or URL patterns
        const referrer = document.referrer.toLowerCase();
        
        if (referrer.includes('github.com')) return 'github';
        if (referrer.includes('google.com')) return 'google';
        if (referrer.includes('microsoft.com') || referrer.includes('live.com')) return 'microsoft';
        if (referrer.includes('apple.com')) return 'apple';
        if (referrer.includes('twitter.com') || referrer.includes('x.com')) return 'twitter';
        if (referrer.includes('facebook.com')) return 'facebook';
        
        // Default to first enabled provider
        return this.providers.find(p => p.isEnabled)?.name || 'github';
    }

    private setProviderLoading(provider: string, loading: boolean): void {
        this.isLoading = loading;
        const button = this.$(`[data-provider="${provider}"]`) as HTMLButtonElement;
        if (!button) return;

        const text = button.querySelector('.oauth-text') as HTMLSpanElement;
        const spinner = button.querySelector('.oauth-loading') as HTMLDivElement;

        button.disabled = loading;
        if (text) text.style.display = loading ? 'none' : 'inline';
        if (spinner) spinner.style.display = loading ? 'inline' : 'none';
    }

    private showError(message: string): void {
        const errorElement = this.$('#errorMessage') as HTMLDivElement;
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Add shake animation
            errorElement.classList.add('shake');
            setTimeout(() => errorElement.classList.remove('shake'), 500);
        }
    }

    private hideError(): void {
        const errorElement = this.$('#errorMessage') as HTMLDivElement;
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    private storeAuthData(response: any): void {
        // Store in sessionStorage for security (not localStorage)
        sessionStorage.setItem('auth_token', response.token);
        sessionStorage.setItem('refresh_token', response.refreshToken);
        sessionStorage.setItem('user_info', JSON.stringify(response.user));
        sessionStorage.setItem('token_expires_at', response.expiresAt.toString());
    }

    private cleanupUrl(): void {
        // Remove OAuth parameters from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        url.searchParams.delete('error');
        url.searchParams.delete('provider');
        
        window.history.replaceState({}, document.title, url.toString());
    }

    private redirectToApp(): void {
        // Dispatch custom event to notify app of successful login
        window.dispatchEvent(new CustomEvent('auth:login-success'));
        
        // Or redirect to main app
        window.location.href = '/';
    }
}

// Define the custom element
customElements.define('login-form', LoginForm);