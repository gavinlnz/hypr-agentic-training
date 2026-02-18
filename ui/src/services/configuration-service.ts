import { configClient } from './client';
import type {
  Configuration,
  ConfigurationCreate,
  ConfigurationUpdate,
} from '@/lib/client/types';

export class ConfigurationService {
  async getConfigurations(_applicationId: string, search?: string): Promise<Configuration[]> {
    return configClient.configurations.list(_applicationId, search);
  }

  async getConfiguration(_applicationId: string, configurationId: string): Promise<Configuration> {
    return configClient.configurations.get(configurationId);
  }

  async createConfiguration(_applicationId: string, data: ConfigurationCreate): Promise<Configuration> {
    return configClient.configurations.create(data);
  }

  async updateConfiguration(_applicationId: string, configurationId: string, data: ConfigurationUpdate): Promise<Configuration> {
    return configClient.configurations.update(configurationId, data);
  }

  async deleteConfiguration(_applicationId: string, configurationId: string): Promise<void> {
    return configClient.configurations.delete(configurationId);
  }

  async deleteMultipleConfigurations(applicationId: string, configurationIds: string[]): Promise<{ deleted_count: number }> {
    return configClient.configurations.deleteMultiple(applicationId, configurationIds);
  }
}

// Global service instance
export const configurationService = new ConfigurationService();