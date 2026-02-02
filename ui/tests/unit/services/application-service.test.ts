import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applicationService } from '@/services/application-service';
import { apiClient } from '@/services/api-client';

// Mock the API client
vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ApplicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteApplication', () => {
    it('should call API client delete with correct endpoint', async () => {
      const mockDelete = vi.mocked(apiClient.delete);
      mockDelete.mockResolvedValueOnce(undefined);

      const appId = '01HKQJQJQJQJQJQJQJQJQJQJQJ';
      await applicationService.deleteApplication(appId);

      expect(mockDelete).toHaveBeenCalledWith(`/applications/${appId}`);
    });

    it('should handle delete errors', async () => {
      const mockDelete = vi.mocked(apiClient.delete);
      const error = new Error('Delete failed');
      mockDelete.mockRejectedValueOnce(error);

      const appId = '01HKQJQJQJQJQJQJQJQJQJQJQJ';

      await expect(applicationService.deleteApplication(appId)).rejects.toThrow('Delete failed');
      expect(mockDelete).toHaveBeenCalledWith(`/applications/${appId}`);
    });
  });

  describe('deleteApplications', () => {
    it('should call API client delete with correct endpoint and data', async () => {
      const mockDelete = vi.mocked(apiClient.delete);
      mockDelete.mockResolvedValueOnce(undefined);

      const appIds = [
        '01HKQJQJQJQJQJQJQJQJQJQJQ1',
        '01HKQJQJQJQJQJQJQJQJQJQJQ2',
        '01HKQJQJQJQJQJQJQJQJQJQJQ3'
      ];

      await applicationService.deleteApplications(appIds);

      expect(mockDelete).toHaveBeenCalledWith('/applications', { ids: appIds });
    });

    it('should handle bulk delete with single ID', async () => {
      const mockDelete = vi.mocked(apiClient.delete);
      mockDelete.mockResolvedValueOnce(undefined);

      const appIds = ['01HKQJQJQJQJQJQJQJQJQJQJQJ'];

      await applicationService.deleteApplications(appIds);

      expect(mockDelete).toHaveBeenCalledWith('/applications', { ids: appIds });
    });

    it('should handle bulk delete with empty array', async () => {
      const mockDelete = vi.mocked(apiClient.delete);
      mockDelete.mockResolvedValueOnce(undefined);

      const appIds: string[] = [];

      await applicationService.deleteApplications(appIds);

      expect(mockDelete).toHaveBeenCalledWith('/applications', { ids: appIds });
    });

    it('should handle bulk delete errors', async () => {
      const mockDelete = vi.mocked(apiClient.delete);
      const error = new Error('Bulk delete failed');
      mockDelete.mockRejectedValueOnce(error);

      const appIds = [
        '01HKQJQJQJQJQJQJQJQJQJQJQ1',
        '01HKQJQJQJQJQJQJQJQJQJQJQ2'
      ];

      await expect(applicationService.deleteApplications(appIds)).rejects.toThrow('Bulk delete failed');
      expect(mockDelete).toHaveBeenCalledWith('/applications', { ids: appIds });
    });
  });

  describe('existing methods', () => {
    it('should call getApplications correctly', async () => {
      const mockGet = vi.mocked(apiClient.get);
      const mockData = [{ id: '1', name: 'Test App' }];
      mockGet.mockResolvedValueOnce(mockData);

      const result = await applicationService.getApplications();

      expect(mockGet).toHaveBeenCalledWith('/applications');
      expect(result).toEqual(mockData);
    });

    it('should call getApplication correctly', async () => {
      const mockGet = vi.mocked(apiClient.get);
      const mockData = { id: '1', name: 'Test App', configuration_ids: [] };
      mockGet.mockResolvedValueOnce(mockData);

      const appId = '01HKQJQJQJQJQJQJQJQJQJQJQJ';
      const result = await applicationService.getApplication(appId);

      expect(mockGet).toHaveBeenCalledWith(`/applications/${appId}`);
      expect(result).toEqual(mockData);
    });

    it('should call createApplication correctly', async () => {
      const mockPost = vi.mocked(apiClient.post);
      const requestData = { name: 'New App', comments: 'Test comments' };
      const responseData = { id: '1', ...requestData, created_at: new Date(), updated_at: new Date() };
      mockPost.mockResolvedValueOnce(responseData);

      const result = await applicationService.createApplication(requestData);

      expect(mockPost).toHaveBeenCalledWith('/applications', requestData);
      expect(result).toEqual(responseData);
    });

    it('should call updateApplication correctly', async () => {
      const mockPut = vi.mocked(apiClient.put);
      const requestData = { name: 'Updated App', comments: 'Updated comments' };
      const responseData = { id: '1', ...requestData, created_at: new Date(), updated_at: new Date() };
      mockPut.mockResolvedValueOnce(responseData);

      const appId = '01HKQJQJQJQJQJQJQJQJQJQJQJ';
      const result = await applicationService.updateApplication(appId, requestData);

      expect(mockPut).toHaveBeenCalledWith(`/applications/${appId}`, requestData);
      expect(result).toEqual(responseData);
    });
  });
});