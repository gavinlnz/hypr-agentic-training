import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configurationService } from '@/services/configuration-service';
import { apiClient } from '@/services/api-client';
import type { Configuration, ConfigurationCreate, ConfigurationUpdate } from '@/types/api';

// Mock the API client
vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApiClient = apiClient as any;

describe('ConfigurationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockConfiguration: Configuration = {
    id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    application_id: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
    name: 'test-config',
    comments: 'Test configuration',
    config: { host: 'localhost', port: 5432 },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  describe('getConfigurations', () => {
    it('should fetch configurations for an application', async () => {
      const mockConfigurations = [mockConfiguration];
      mockApiClient.get.mockResolvedValue(mockConfigurations);

      const result = await configurationService.getConfigurations('01ARZ3NDEKTSV4RRFFQ69G5FAW');

      expect(mockApiClient.get).toHaveBeenCalledWith('/applications/01ARZ3NDEKTSV4RRFFQ69G5FAW/configurations');
      expect(result).toEqual(mockConfigurations);
    });

    it('should include search parameter when provided', async () => {
      const mockConfigurations = [mockConfiguration];
      mockApiClient.get.mockResolvedValue(mockConfigurations);

      const result = await configurationService.getConfigurations('01ARZ3NDEKTSV4RRFFQ69G5FAW', 'test');

      expect(mockApiClient.get).toHaveBeenCalledWith('/applications/01ARZ3NDEKTSV4RRFFQ69G5FAW/configurations?search=test');
      expect(result).toEqual(mockConfigurations);
    });

    it('should handle URL encoding in search parameter', async () => {
      const mockConfigurations = [mockConfiguration];
      mockApiClient.get.mockResolvedValue(mockConfigurations);

      const result = await configurationService.getConfigurations('01ARZ3NDEKTSV4RRFFQ69G5FAW', 'test config');

      expect(mockApiClient.get).toHaveBeenCalledWith('/applications/01ARZ3NDEKTSV4RRFFQ69G5FAW/configurations?search=test%20config');
      expect(result).toEqual(mockConfigurations);
    });
  });

  describe('getConfiguration', () => {
    it('should fetch a specific configuration', async () => {
      mockApiClient.get.mockResolvedValue(mockConfiguration);

      const result = await configurationService.getConfiguration('01ARZ3NDEKTSV4RRFFQ69G5FAW', '01ARZ3NDEKTSV4RRFFQ69G5FAV');

      expect(mockApiClient.get).toHaveBeenCalledWith('/applications/01ARZ3NDEKTSV4RRFFQ69G5FAW/configurations/01ARZ3NDEKTSV4RRFFQ69G5FAV');
      expect(result).toEqual(mockConfiguration);
    });
  });

  describe('createConfiguration', () => {
    it('should create a new configuration', async () => {
      const createData: ConfigurationCreate = {
        application_id: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
        name: 'new-config',
        comments: 'New configuration',
        config: { host: 'localhost', port: 3306 },
      };

      mockApiClient.post.mockResolvedValue(mockConfiguration);

      const result = await configurationService.createConfiguration('01ARZ3NDEKTSV4RRFFQ69G5FAW', createData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/applications/01ARZ3NDEKTSV4RRFFQ69G5FAW/configurations', createData);
      expect(result).toEqual(mockConfiguration);
    });
  });

  describe('updateConfiguration', () => {
    it('should update an existing configuration', async () => {
      const updateData: ConfigurationUpdate = {
        name: 'updated-config',
        comments: 'Updated configuration',
        config: { host: 'updated-host', port: 3306 },
      };

      const updatedConfiguration = { ...mockConfiguration, ...updateData };
      mockApiClient.put.mockResolvedValue(updatedConfiguration);

      const result = await configurationService.updateConfiguration('01ARZ3NDEKTSV4RRFFQ69G5FAW', '01ARZ3NDEKTSV4RRFFQ69G5FAV', updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/applications/01ARZ3NDEKTSV4RRFFQ69G5FAW/configurations/01ARZ3NDEKTSV4RRFFQ69G5FAV', updateData);
      expect(result).toEqual(updatedConfiguration);
    });
  });

  describe('deleteConfiguration', () => {
    it('should delete a configuration', async () => {
      mockApiClient.delete.mockResolvedValue(undefined);

      await configurationService.deleteConfiguration('01ARZ3NDEKTSV4RRFFQ69G5FAW', '01ARZ3NDEKTSV4RRFFQ69G5FAV');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/applications/01ARZ3NDEKTSV4RRFFQ69G5FAW/configurations/01ARZ3NDEKTSV4RRFFQ69G5FAV');
    });
  });

  describe('deleteMultipleConfigurations', () => {
    it('should delete multiple configurations', async () => {
      const configurationIds = ['01ARZ3NDEKTSV4RRFFQ69G5FAV', '01ARZ3NDEKTSV4RRFFQ69G5FAX'];
      const deleteResult = { deleted_count: 2 };
      
      mockApiClient.delete.mockResolvedValue(deleteResult);

      const result = await configurationService.deleteMultipleConfigurations('01ARZ3NDEKTSV4RRFFQ69G5FAW', configurationIds);

      expect(mockApiClient.delete).toHaveBeenCalledWith('/applications/01ARZ3NDEKTSV4RRFFQ69G5FAW/configurations', { ids: configurationIds });
      expect(result).toEqual(deleteResult);
    });
  });
});