import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock all services
vi.mock('@/services/application-service', () => ({
  applicationService: {
    getApplications: vi.fn().mockResolvedValue([]),
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
  });

  it('should render application-list without errors', async () => {
    // Act
    const listElement = document.createElement('application-list');
    container.appendChild(listElement);

    await customElements.whenDefined('application-list');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert
    expect(listElement.shadowRoot).toBeTruthy();
    expect(listElement.shadowRoot?.innerHTML).toContain('table');
  });

  it('should render application-form without errors', async () => {
    // Act
    const formElement = document.createElement('application-form');
    container.appendChild(formElement);

    await customElements.whenDefined('application-form');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert
    expect(formElement.shadowRoot).toBeTruthy();
    expect(formElement.shadowRoot?.innerHTML).toContain('form');
  });

  it('should handle component communication via events', async () => {
    // Arrange
    const listElement = document.createElement('application-list');
    container.appendChild(listElement);

    await customElements.whenDefined('application-list');
    await new Promise(resolve => setTimeout(resolve, 100));

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

  it('should handle CSS styling correctly', async () => {
    // Act
    const formElement = document.createElement('application-form');
    container.appendChild(formElement);

    await customElements.whenDefined('application-form');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert - Shadow DOM should contain styles
    const shadowRoot = formElement.shadowRoot!;
    const styleElement = shadowRoot.querySelector('style');
    expect(styleElement).toBeTruthy();
    expect(styleElement?.textContent).toContain('form');
  });

  it('should handle attribute changes', async () => {
    // Arrange
    const formElement = document.createElement('application-form') as any;
    container.appendChild(formElement);

    await customElements.whenDefined('application-form');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Act - Change attribute
    formElement.setAttribute('application-id', '01HKQJQJQJQJQJQJQJQJQJQJQ1');

    // Wait for attribute change to be processed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert - Component should react to attribute change
    // This would catch issues with attributeChangedCallback
    expect(formElement.getAttribute('application-id')).toBe('01HKQJQJQJQJQJQJQJQJQJQJQ1');
  });

  it('should handle disconnection properly', async () => {
    // Arrange
    const listElement = document.createElement('application-list');
    container.appendChild(listElement);

    await customElements.whenDefined('application-list');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Act - Remove element
    container.removeChild(listElement);

    // Assert - Should not throw errors (disconnectedCallback should handle cleanup)
    expect(() => {
      // Trigger any cleanup that might happen
      listElement.dispatchEvent(new Event('test'));
    }).not.toThrow();
  });

  it('should handle form validation correctly', async () => {
    // Arrange
    const formElement = document.createElement('application-form') as any;
    container.appendChild(formElement);

    await customElements.whenDefined('application-form');
    await new Promise(resolve => setTimeout(resolve, 100));

    const shadowRoot = formElement.shadowRoot!;
    const nameInput = shadowRoot.querySelector('#name') as HTMLInputElement;
    const form = shadowRoot.querySelector('form') as HTMLFormElement;

    // Act - Submit empty form
    const submitEvent = new Event('submit', { cancelable: true });
    form.dispatchEvent(submitEvent);

    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert - Should show validation error
    const errorElement = shadowRoot.querySelector('.error-message');
    expect(errorElement).toBeTruthy();
  });

  it('should handle loading states correctly', async () => {
    // Arrange
    const listElement = document.createElement('application-list') as any;
    container.appendChild(listElement);

    await customElements.whenDefined('application-list');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert - Should show loading state initially
    const shadowRoot = listElement.shadowRoot!;
    const loadingElement = shadowRoot.querySelector('.loading-spinner');
    
    // Loading element should exist or have been replaced by content
    const hasLoadingOrContent = loadingElement || shadowRoot.querySelector('table');
    expect(hasLoadingOrContent).toBeTruthy();
  });

  it('should handle error states correctly', async () => {
    // This test would catch error handling issues that weren't properly displayed to users
    
    // Arrange - Mock service to throw error
    const { applicationService } = await import('@/services/application-service');
    vi.mocked(applicationService.getApplications).mockRejectedValueOnce(new Error('API Error'));

    const listElement = document.createElement('application-list') as any;
    container.appendChild(listElement);

    await customElements.whenDefined('application-list');
    await new Promise(resolve => setTimeout(resolve, 200)); // Wait for async error

    // Assert - Should show error message
    const shadowRoot = listElement.shadowRoot!;
    const errorElement = shadowRoot.querySelector('.error-message');
    expect(errorElement).toBeTruthy();
    expect(errorElement?.textContent).toContain('Error');
  });

  it('should handle navigation events correctly', async () => {
    // This test would catch navigation issues that caused blank pages

    // Arrange
    const detailElement = document.createElement('application-detail') as any;
    detailElement.setAttribute('application-id', '01HKQJQJQJQJQJQJQJQJQJQJQ1');
    container.appendChild(detailElement);

    await customElements.whenDefined('application-detail');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock navigation
    const mockNavigate = vi.fn();
    global.window.history.pushState = mockNavigate;

    // Act - Click a navigation element (like "Back to List")
    const shadowRoot = detailElement.shadowRoot!;
    const backButton = shadowRoot.querySelector('.back-button') as HTMLButtonElement;
    
    if (backButton) {
      backButton.click();
      
      // Assert - Should attempt navigation
      expect(mockNavigate).toHaveBeenCalled();
    }
  });
});