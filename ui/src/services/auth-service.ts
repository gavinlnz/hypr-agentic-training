import { ApiClient } from './api-client';
import type { 
    LoginResponse, 
    UserInfo, 
    RefreshTokenRequest,
    OAuthProvider
} from '@/types/auth';

export class AuthService {
    private apiClient = new ApiClient();
    private tokenRefreshTimer?: number;

    constructor() {
        this.setupTokenRefresh();
        this.setupStorageListener();
    }

    /**
     * Get available OAuth providers
     */
    async getProviders(): Promise<OAuthProvider[]> {
        return await this.apiClient.request<OAuthProvider[]>('/auth/providers');
    }

    /**
     * Get OAuth authorization URL for a provider
     */
    async getAuthorizationUrl(provider: string, returnUrl?: string): Promise<string> {
        const params = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
        const response = await this.apiClient.request<{ authorizationUrl: string }>(
            `/auth/authorize/${provider}${params}`
        );
        return response.authorizationUrl;
    }

    /**
     * Complete OAuth login after callback
     */
    async completeOAuthLogin(provider: string, code: string, state?: string): Promise<LoginResponse> {
        const response = await this.apiClient.request<LoginResponse>('/auth/callback', {
            method: 'POST',
            body: JSON.stringify({ provider, code, state })
        });

        this.storeAuthData(response);
        this.setupTokenRefresh();
        
        return response;
    }

    /**
     * Logout current user
     */
    async logout(): Promise<void> {
        // Clear local authentication data
        this.clearAuthData();
        this.clearTokenRefresh();
        
        // TODO: Implement server-side logout endpoint
        // For now, we only do client-side logout by clearing session data
        
        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('auth:logged-out'));
    }

    /**
     * Get current user information
     */
    async getCurrentUser(): Promise<UserInfo | null> {
        try {
            if (!this.isAuthenticated()) {
                return null;
            }

            return await this.apiClient.request<UserInfo>('/auth/me');
        } catch (error) {
            console.error('Failed to get current user:', error);
            return null;
        }
    }

    /**
     * Refresh authentication token
     */
    async refreshToken(): Promise<boolean> {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                return false;
            }

            const request: RefreshTokenRequest = { refreshToken };
            const response = await this.apiClient.request<LoginResponse>('/auth/refresh', {
                method: 'POST',
                body: JSON.stringify(request)
            });

            this.storeAuthData(response);
            this.setupTokenRefresh();
            
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearAuthData();
            return false;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        const token = this.getToken();
        const expiresAt = this.getTokenExpirationDate();
        
        if (!token || !expiresAt) {
            return false;
        }

        // Check if token is expired (with 5 minute buffer)
        const now = new Date();
        const expiration = new Date(expiresAt);
        const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        return expiration.getTime() > (now.getTime() + bufferTime);
    }

    /**
     * Get current authentication token
     */
    getToken(): string | null {
        return sessionStorage.getItem('auth_token');
    }

    /**
     * Get current user info from storage
     */
    getUserInfo(): UserInfo | null {
        const userInfoStr = sessionStorage.getItem('user_info');
        
        if (!userInfoStr) {
            return null;
        }

        try {
            return JSON.parse(userInfoStr);
        } catch (error) {
            console.error('Failed to parse user info:', error);
            return null;
        }
    }

    /**
     * Check if current user has specific role
     */
    hasRole(role: string): boolean {
        const userInfo = this.getUserInfo();
        return userInfo?.role === role;
    }

    /**
     * Check if current user is admin
     */
    isAdmin(): boolean {
        return this.hasRole('Admin');
    }

    private getRefreshToken(): string | null {
        return sessionStorage.getItem('refresh_token');
    }

    private getTokenExpirationDate(): string | null {
        return sessionStorage.getItem('token_expires_at');
    }

    private storeAuthData(response: LoginResponse): void {
        sessionStorage.setItem('auth_token', response.token);
        sessionStorage.setItem('refresh_token', response.refreshToken);
        sessionStorage.setItem('user_info', JSON.stringify(response.user));
        sessionStorage.setItem('token_expires_at', response.expiresAt.toString());
    }

    private clearAuthData(): void {
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('user_info');
        sessionStorage.removeItem('token_expires_at');
    }

    private setupTokenRefresh(): void {
        this.clearTokenRefresh();

        const expiresAt = this.getTokenExpirationDate();
        if (!expiresAt) {
            return;
        }

        const expiration = new Date(expiresAt);
        const now = new Date();
        const timeUntilRefresh = expiration.getTime() - now.getTime() - (10 * 60 * 1000); // Refresh 10 minutes before expiry

        if (timeUntilRefresh > 0) {
            this.tokenRefreshTimer = window.setTimeout(async () => {
                const success = await this.refreshToken();
                if (!success) {
                    // Redirect to login if refresh fails
                    window.dispatchEvent(new CustomEvent('auth:token-expired'));
                }
            }, timeUntilRefresh);
        }
    }

    private clearTokenRefresh(): void {
        if (this.tokenRefreshTimer) {
            clearTimeout(this.tokenRefreshTimer);
            this.tokenRefreshTimer = undefined;
        }
    }

    private setupStorageListener(): void {
        // Listen for storage changes (e.g., logout in another tab)
        window.addEventListener('storage', (e) => {
            if (e.key === 'auth_token' && !e.newValue) {
                // Token was removed in another tab
                this.clearAuthData();
                window.dispatchEvent(new CustomEvent('auth:logged-out'));
            }
        });
    }
}