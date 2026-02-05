import { apiClient } from './api-client';
import type {
  Configuration,
  ConfigurationCreate,
  ConfigurationUpdate,
} from '@/types/api';

export class ConfigurationService {
  async getConfigurations(applicationId: string, search?: string): Promise<Configuration[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiClient.get<Configuration[]>(`/applications/${applicationId}/configurations${params}`);
  }

  async getConfiguration(applicationId: string, configurationId: string): Promise<Configuration> {
    return apiClient.get<Configuration>(`/applications/${applicationId}/configurations/${configurationId}`);
  }

  async createConfiguration(applicationId: string, data: ConfigurationCreate): Promise<Configuration> {
    return apiClient.post<Configuration>(`/applications/${applicationId}/configurations`, data);
  }

  async updateConfiguration(applicationId: string, configurationId: string, data: ConfigurationUpdate): Promise<Configuration> {
    return apiClient.put<Configuration>(`/applications/${applicationId}/configurations/${configurationId}`, data);
  }

  async deleteConfiguration(applicationId: string, configurationId: string): Promise<void> {
    return apiClient.delete<void>(`/applications/${applicationId}/configurations/${configurationId}`);
  }

  async deleteMultipleConfigurations(applicationId: string, configurationIds: string[]): Promise<{ deleted_count: number }> {
    return apiClient.delete<{ deleted_count: number }>(`/applications/${applicationId}/configurations`, { ids: configurationIds });
  }
}

// Global service instance
export const configurationService = new ConfigurationService();