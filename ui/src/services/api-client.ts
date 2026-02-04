export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;

  constructor() {
    // Use environment variable in production, fallback to localhost for development
    const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';
    this.baseUrl = `${apiBaseUrl}/api/v1`;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Add authentication token if available
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'same-origin', // Include cookies for CSRF protection
    };

    try {
      const response = await fetch(url, config);
      
      // Handle authentication errors
      if (response.status === 401) {
        this.handleUnauthorized();
        throw new ApiError('Unauthorized', 401);
      }

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network or other errors
      console.error('API request failed:', error);
      throw new ApiError('Network error', 0, error);
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || errorMessage;
        errorDetails = errorData;
      } catch {
        // If response is not JSON, use status text
      }
      
      throw new ApiError(errorMessage, response.status, errorDetails);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  }

  private getAuthToken(): string | null {
    return sessionStorage.getItem('auth_token');
  }

  private handleUnauthorized(): void {
    // Clear stored auth data
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_info');
    sessionStorage.removeItem('token_expires_at');
    
    // Dispatch event for app to handle
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { 
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Global API client instance
export const apiClient = new ApiClient();