import { apiClient } from './api-client';
import type {
  Configuration,
  ConfigurationCreate,
  ConfigurationUpdate,
} from '@/types/api';

export class ConfigurationService {
  async getConfiguration(id: string): Promise<Configuration> {
    return apiClient.get<Configuration>(`/configurations/${id}`);
  }

  async createConfiguration(data: ConfigurationCreate): Promise<Configuration> {
    return apiClient.post<Configuration>('/configurations', data);
  }

  async updateConfiguration(id: string, data: ConfigurationUpdate): Promise<Configuration> {
    return apiClient.put<Configuration>(`/configurations/${id}`, data);
  }

  async deleteConfiguration(id: string): Promise<void> {
    return apiClient.delete<void>(`/configurations/${id}`);
  }
}

// Global service instance
export const configurationService = new ConfigurationService();