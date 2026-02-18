import { configClient } from './client';
import type {
  Application,
  ApplicationWithConfigs,
  ApplicationCreate,
  ApplicationUpdate,
} from '@/lib/client/types';

export class ApplicationService {
  async getApplications(): Promise<Application[]> {
    return configClient.applications.list();
  }

  async getApplication(id: string): Promise<ApplicationWithConfigs> {
    return configClient.applications.get(id);
  }

  async createApplication(data: ApplicationCreate): Promise<Application> {
    return configClient.applications.create(data);
  }

  async updateApplication(id: string, data: ApplicationUpdate): Promise<Application> {
    return configClient.applications.update(id, data);
  }

  async deleteApplication(id: string): Promise<void> {
    return configClient.applications.delete(id);
  }

  async deleteApplications(ids: string[]): Promise<void> {
    return configClient.applications.deleteMultiple(ids);
  }
}

// Global service instance
export const applicationService = new ApplicationService();