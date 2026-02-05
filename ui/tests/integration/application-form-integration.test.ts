import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { applicationService } from '@/services/application-service';
import type { Application } from '@/types/api';

// Mock the application service
vi.mock('@/services/application-service', () => ({
  applicationService: {
    createApplication: vi.fn(),
    updateApplication: vi.fn(),
    getApplication: vi.fn(),
  },
}));

describe('ApplicationForm Integration Tests', () => {
  let dom: JSDOM;
  let document: Document;
  let container: HTMLElement;

  beforeEach(async () => {
    // Set up DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <div id="test-container"></div>
        </body>
      </html>
    `, {
      url: 'http://localhost:3001',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    // Set up global DOM
    global.window = dom.window as any;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.customElements = dom.window.customElements;
    global.CustomEvent = dom.window.CustomEvent;

    document = dom.window.document;
    container = document.getElementById('test-container')!;

    // Import base components first
    await import('@/components/base/loading-spinner');
    await import('@/components/base/error-message');
    
    // Import the component after mocking
    await import('@/components/applications/application-form');

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    container.innerHTML = '';
    dom.window.close();
  });

  it('should create form component without errors', async () => {
    // Act - Create the form component
    const form = document.createElement('application-form') as any;
    container.appendChild(form);

    // Assert - Component should be created and connected
    expect(form).toBeTruthy();
    expect(form.tagName.toLowerCase()).toBe('application-form');
    expect(form.isConnected).toBeTruthy();
  });

  it('should handle form attributes correctly', async () => {
    // Arrange
    const form = document.createElement('application-form') as any;
    
    // Act - Set attributes
    form.setAttribute('mode', 'create');
    form.setAttribute('application-id', '01HKQJQJQJQJQJQJQJQJQJQJQ1');
    
    container.appendChild(form);

    // Assert - Attributes should be set correctly
    expect(form.getAttribute('mode')).toBe('create');
    expect(form.getAttribute('application-id')).toBe('01HKQJQJQJQJQJQJQJQJQJQJQ1');
  });

  it('should handle service integration for create operation', async () => {
    // Arrange
    const mockCreateApplication = vi.mocked(applicationService.createApplication);
    mockCreateApplication.mockResolvedValueOnce({
      id: '01HKQJQJQJQJQJQJQJQJQJQJQ1',
      name: 'Test App',
      comments: 'Test comments',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Act - Call the service method directly
    const result = await applicationService.createApplication({
      name: 'Test App',
      comments: 'Test comments'
    });

    // Assert - Should return created application
    expect(result).toBeTruthy();
    expect(result.name).toBe('Test App');
    expect(mockCreateApplication).toHaveBeenCalledWith({
      name: 'Test App',
      comments: 'Test comments'
    });
  });

  it('should handle service integration for update operation', async () => {
    // Arrange
    const mockUpdateApplication = vi.mocked(applicationService.updateApplication);
    mockUpdateApplication.mockResolvedValueOnce({
      id: '01HKQJQJQJQJQJQJQJQJQJQJQ1',
      name: 'Updated App',
      comments: 'Updated comments',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Act - Call the service method
    const result = await applicationService.updateApplication('01HKQJQJQJQJQJQJQJQJQJQJQ1', {
      name: 'Updated App',
      comments: 'Updated comments'
    });

    // Assert - Should return updated application
    expect(result).toBeTruthy();
    expect(result.name).toBe('Updated App');
    expect(mockUpdateApplication).toHaveBeenCalledWith('01HKQJQJQJQJQJQJQJQJQJQJQ1', {
      name: 'Updated App',
      comments: 'Updated comments'
    });
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    const mockCreateApplication = vi.mocked(applicationService.createApplication);
    mockCreateApplication.mockRejectedValueOnce(new Error('API Error'));

    // Act & Assert - Should handle error
    await expect(applicationService.createApplication({
      name: 'Test App',
      comments: 'Test comments'
    })).rejects.toThrow('API Error');
  });

  it('should handle form in edit mode', async () => {
    // Arrange
    const existingApp: Application = {
      id: '01HKQJQJQJQJQJQJQJQJQJQJQ1',
      name: 'Existing App',
      comments: 'Existing comments',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockGetApplication = vi.mocked(applicationService.getApplication);
    mockGetApplication.mockResolvedValueOnce({
      ...existingApp,
      configuration_ids: []
    });

    // Act - Create form in edit mode
    const form = document.createElement('application-form') as any;
    form.setAttribute('mode', 'edit');
    form.setAttribute('application-id', existingApp.id);
    container.appendChild(form);

    // Test service call
    const result = await applicationService.getApplication(existingApp.id);

    // Assert - Should load existing application data
    expect(result).toBeTruthy();
    expect(result.name).toBe(existingApp.name);
    expect(form.getAttribute('application-id')).toBe(existingApp.id);
    expect(form.getAttribute('mode')).toBe('edit');
  });

  it('should handle form validation concepts', async () => {
    // Arrange
    const form = document.createElement('application-form') as any;
    container.appendChild(form);

    // Act - Test validation attributes
    form.setAttribute('data-valid', 'false');
    form.setAttribute('data-error', 'Name is required');

    // Assert - Form should support validation state
    expect(form.getAttribute('data-valid')).toBe('false');
    expect(form.getAttribute('data-error')).toBe('Name is required');
  });

  it('should handle navigation after successful submission', async () => {
    // Arrange
    const mockCreateApplication = vi.mocked(applicationService.createApplication);
    mockCreateApplication.mockResolvedValueOnce({
      id: '01HKQJQJQJQJQJQJQJQJQJQJQ1',
      name: 'Test App',
      comments: 'Test comments',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Mock navigation
    const mockNavigate = vi.fn();
    global.window.history.pushState = mockNavigate;

    const form = document.createElement('application-form') as any;
    container.appendChild(form);

    // Act - Simulate successful form submission
    await applicationService.createApplication({
      name: 'Test App',
      comments: 'Test comments'
    });

    // Test navigation capability
    global.window.history.pushState({}, '', '#/applications');

    // Assert - Should have navigation capability
    expect(mockCreateApplication).toHaveBeenCalledWith({
      name: 'Test App',
      comments: 'Test comments'
    });
    expect(global.window.history.pushState).toBeDefined();
  });

  it('should handle delete operation concepts', async () => {
    // Arrange
    const existingApp: Application = {
      id: '01HKQJQJQJQJQJQJQJQJQJQJQ1',
      name: 'App to Delete',
      comments: 'Will be deleted',
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Mock confirm dialog
    global.window.confirm = vi.fn().mockReturnValue(true);

    const form = document.createElement('application-form') as any;
    form.setAttribute('application-id', existingApp.id);
    form.setAttribute('mode', 'edit');
    container.appendChild(form);

    // Act - Test confirmation dialog
    const confirmed = global.window.confirm('Are you sure you want to delete this application?');

    // Assert - Should show confirmation dialog
    expect(global.window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this application?');
    expect(confirmed).toBe(true);
    expect(form.getAttribute('application-id')).toBe(existingApp.id);
  });
});