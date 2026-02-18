import { ConfigServiceClient } from '@/lib/client';

// Use environment variable in production, fallback to localhost for development
const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

export const configClient = new ConfigServiceClient({
    baseUrl: `${apiBaseUrl}/api/v1`,
    tokenProvider: () => sessionStorage.getItem('auth_token'),
    onError: (error) => {
        console.error('API Error:', error);
        // Optionally dispatch global error event here if needed, 
        // though the client library throws errors that services can catch.
    }
});
