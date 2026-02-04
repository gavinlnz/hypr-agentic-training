export interface OAuthProvider {
    name: string;
    displayName: string;
    authorizeUrl: string;
    iconUrl: string;
    isEnabled: boolean;
}

export interface OAuthCallbackRequest {
    provider: string;
    code: string;
    state?: string;
}

export interface LoginResponse {
    token: string;
    refreshToken: string;
    expiresAt: Date;
    user: UserInfo;
}

export interface UserInfo {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role: string;
    provider: string;
    providerId: string;
    createdAt: Date;
    lastLoginAt: Date;
}

export interface ExternalUserProfile {
    providerId: string;
    email: string;
    name: string;
    avatarUrl?: string;
    username?: string;
    additionalClaims: Record<string, any>;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface UpdateUserRoleRequest {
    role: string;
}