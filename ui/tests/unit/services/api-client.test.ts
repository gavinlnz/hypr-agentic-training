import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient, ApiError } from '@/services/api-client';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient();
    mockFetch.mockClear();
  });

  describe('request', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: '1', name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      });

      const result = await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });
      expect(result).toEqual(mockData);
    });

    it('should make successful POST request with data', async () => {
      const requestData = { name: 'New Item' };
      const responseData = { id: '1', ...requestData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(responseData),
      });

      const result = await apiClient.post('/test', requestData);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        credentials: 'same-origin',
      });
      expect(result).toEqual(responseData);
    });

    it('should handle 404 error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ detail: 'Item not found' }),
      });

      try {
        await apiClient.get('/test/999');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
        expect((error as ApiError).message).toBe('Item not found');
      }
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await apiClient.get('/test');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(0);
        expect((error as ApiError).message).toBe('Network error');
      }
    });

    it('should handle 204 No Content response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await apiClient.delete('/test/1');
      expect(result).toBeUndefined();
    });
  });

  describe('HTTP methods', () => {
    it('should call request with correct method for GET', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      spy.mockResolvedValueOnce({});

      await apiClient.get('/test');
      expect(spy).toHaveBeenCalledWith('/test', { method: 'GET' });
    });

    it('should call request with correct method for POST', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      spy.mockResolvedValueOnce({});

      const data = { name: 'test' };
      await apiClient.post('/test', data);
      expect(spy).toHaveBeenCalledWith('/test', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    });

    it('should call request with correct method for PUT', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      spy.mockResolvedValueOnce({});

      const data = { name: 'updated' };
      await apiClient.put('/test/1', data);
      expect(spy).toHaveBeenCalledWith('/test/1', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    });

    it('should call request with correct method for DELETE', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      spy.mockResolvedValueOnce({});

      await apiClient.delete('/test/1');
      expect(spy).toHaveBeenCalledWith('/test/1', { 
        method: 'DELETE',
        body: undefined,
      });
    });

    it('should call request with correct method for DELETE with data', async () => {
      const spy = vi.spyOn(apiClient, 'request');
      spy.mockResolvedValueOnce({});

      const data = { ids: ['1', '2', '3'] };
      await apiClient.delete('/test', data);
      expect(spy).toHaveBeenCalledWith('/test', {
        method: 'DELETE',
        body: JSON.stringify(data),
      });
    });
  });
});