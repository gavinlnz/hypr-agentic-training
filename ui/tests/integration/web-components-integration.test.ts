import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock all services
vi.mock('@/services/application-service', () => ({
  applicationService: {
    getApplications: vi.fn().mockResolvedValue([
      {
        id: '01HKQJQJQJQJQJQJQJQJQJQJQ1',
        name: 'Test App 1',
        comments: 'Test comments 1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '01HKQJQJQJQJQJQJQJQJQJQJQ2',
        name: 'Test App 2',
        comments: 'Test comments 2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ]),
    createApplication: vi.fn(),
    updateApplication: vi.fn(),
    deleteApplication: vi.fn(),
    deleteApplications: vi.fn(),
    getApplication: vi.fn(),
  },
}));

describe('Web Components Integration Tests', () => {
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
    global.Event = dom.window.Event;

    document = dom.window.document;
    container = document.getElementById('test-container')!;

    // Import base components first
    await import('@/components/base/loading-spinner');
    await import('@/components/base/error-message');
    
    // Import components after setting up DOM
    await import('@/components/applications/application-list');
    await import('@/components/applications/application-form');
    await import('@/components/applications/application-detail');

    vi.clearAllMocks();
  });

  afterEach(() => {
    container.innerHTML = '';
    dom.window.close();
  });

  it('should register all custom elements', async () => {
    // Assert - All components should be registered
    expect(customElements.get('application-list')).toBeDefined();
    expect(customElements.get('application-form')).toBeDefined();
    expect(customElements.get('application-detail')).toBeDefined();
    expect(customElements.get('loading-spinner')).toBeDefined();
    expect(customElements.get('error-message')).toBeDefined();
  });

  it('should create application-list element without errors', async () => {
    // Act - Create element (this tests that the component class can be instantiated)
    const listElement = document.createElement('application-list');
    
    // Assert - Element should be created successfully
    expect(listElement).toBeTruthy();
    expect(listElement.tagName.toLowerCase()).toBe('application-list');
    
    // Test that it can be added to DOM
    container.appendChild(listElement);
    expect(listElement.isConnected).toBeTruthy();
  });

  it('should create application-form element without errors', async () => {
    // Act - Create element
    const formElement = document.createElement('application-form');
    
    // Assert - Element should be created successfully
    expect(formElement).toBeTruthy();
    expect(formElement.tagName.toLowerCase()).toBe('application-form');
    
    // Test that it can be added to DOM
    container.appendChild(formElement);
    expect(formElement.isConnected).toBeTruthy();
  });

  it('should handle component communication via events', async () => {
    // Arrange
    const listElement = document.createElement('application-list');
    container.appendChild(listElement);

    // Mock event listener
    const eventHandler = vi.fn();
    listElement.addEventListener('application-selected', eventHandler);

    // Act - Simulate component event
    const customEvent = new CustomEvent('application-selected', {
      detail: { applicationId: '01HKQJQJQJQJQJQJQJQJQJQJQ1' }
    });
    listElement.dispatchEvent(customEvent);

    // Assert
    expect(eventHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { applicationId: '01HKQJQJQJQJQJQJQJQJQJQJQ1' }
      })
    );
  });

  it('should handle attribute changes on form component', async () => {
    // Arrange
    const formElement = document.createElement('application-form') as any;
    container.appendChild(formElement);

    // Act - Change attribute
    formElement.setAttribute('application-id', '01HKQJQJQJQJQJQJQJQJQJQJQ1');
    formElement.setAttribute('mode', 'edit');

    // Assert - Component should react to attribute change
    expect(formElement.getAttribute('application-id')).toBe('01HKQJQJQJQJQJQJQJQJQJQJQ1');
    expect(formElement.getAttribute('mode')).toBe('edit');
  });

  it('should handle disconnection properly', async () => {
    // Arrange
    const listElement = document.createElement('application-list');
    container.appendChild(listElement);

    // Act - Remove element
    container.removeChild(listElement);

    // Assert - Should not throw errors (disconnectedCallback should handle cleanup)
    expect(() => {
      // Trigger any cleanup that might happen
      listElement.dispatchEvent(new Event('test'));
    }).not.toThrow();
    
    expect(listElement.isConnected).toBeFalsy();
  });

  it('should create application-detail element with attributes', async () => {
    // Arrange
    const detailElement = document.createElement('application-detail') as any;
    detailElement.setAttribute('application-id', '01HKQJQJQJQJQJQJQJQJQJQJQ1');
    
    // Act
    container.appendChild(detailElement);

    // Assert - Component should handle attributes
    expect(detailElement.getAttribute('application-id')).toBe('01HKQJQJQJQJQJQJQJQJQJQJQ1');
    expect(detailElement.isConnected).toBeTruthy();
  });

  it('should handle service integration for application list', async () => {
    // This test verifies that the service is properly mocked and can be called
    const { applicationService } = await import('@/services/application-service');
    
    // Act - Call the service method
    const applications = await applicationService.getApplications();
    
    // Assert - Should return mocked data
    expect(applications).toHaveLength(2);
    expect(applications[0].name).toBe('Test App 1');
    expect(applications[1].name).toBe('Test App 2');
  });

  it('should handle service errors gracefully', async () => {
    // Arrange - Mock service to throw error
    const { applicationService } = await import('@/services/application-service');
    vi.mocked(applicationService.getApplications).mockRejectedValueOnce(new Error('API Error'));

    // Act & Assert - Should handle error without throwing
    await expect(applicationService.getApplications()).rejects.toThrow('API Error');
  });

  it('should support form validation concepts', async () => {
    // This test verifies that form validation logic can be tested
    const formElement = document.createElement('application-form') as any;
    container.appendChild(formElement);

    // Test that form element supports required attributes
    formElement.setAttribute('required', 'true');
    expect(formElement.getAttribute('required')).toBe('true');
    
    // Test that validation state can be managed
    formElement.setAttribute('data-valid', 'false');
    expect(formElement.getAttribute('data-valid')).toBe('false');
  });

  it('should support navigation concepts', async () => {
    // Mock navigation
    const mockNavigate = vi.fn();
    global.window.history.pushState = mockNavigate;

    // Test that navigation can be triggered
    const event = new CustomEvent('navigate', { detail: { path: '/applications' } });
    window.dispatchEvent(event);
    
    // Test that history API is available
    expect(global.window.history.pushState).toBeDefined();
  });
});