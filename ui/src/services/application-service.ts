import { apiClient } from './api-client';
import type {
  Application,
  ApplicationWithConfigs,
  ApplicationCreate,
  ApplicationUpdate,
} from '@/types/api';

export class ApplicationService {
  async getApplications(): Promise<Application[]> {
    return apiClient.get<Application[]>('/applications');
  }

  async getApplication(id: string): Promise<ApplicationWithConfigs> {
    return apiClient.get<ApplicationWithConfigs>(`/applications/${id}`);
  }

  async createApplication(data: ApplicationCreate): Promise<Application> {
    return apiClient.post<Application>('/applications', data);
  }

  async updateApplication(id: string, data: ApplicationUpdate): Promise<Application> {
    return apiClient.put<Application>(`/applications/${id}`, data);
  }

  async deleteApplication(id: string): Promise<void> {
    return apiClient.delete<void>(`/applications/${id}`);
  }

  async deleteApplications(ids: string[]): Promise<void> {
    return apiClient.delete<void>('/applications', { ids });
  }
}

// Global service instance
export const applicationService = new ApplicationService();