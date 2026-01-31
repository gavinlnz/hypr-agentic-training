// API data models matching the Config Service API

export interface Application {
  id: string; // ULID
  name: string;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWithConfigs extends Application {
  configuration_ids: string[]; // ULID[]
}

export interface ApplicationCreate {
  name: string;
  comments?: string;
}

export interface ApplicationUpdate {
  name: string;
  comments?: string;
}

export interface Configuration {
  id: string; // ULID
  application_id: string; // ULID
  name: string;
  comments?: string;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConfigurationCreate {
  application_id: string;
  name: string;
  comments?: string;
  config: Record<string, any>;
}

export interface ConfigurationUpdate {
  name?: string;
  comments?: string;
  config?: Record<string, any>;
}

// API response types
export interface ApiError {
  detail: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

// UI state types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface FormState {
  isSubmitting: boolean;
  errors: Record<string, string>;
}