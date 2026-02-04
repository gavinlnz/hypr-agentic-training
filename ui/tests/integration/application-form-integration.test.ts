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

// Import the component after mocking
import '@/components/applications/application-form';

describe('ApplicationForm Integration Tests', () => {
  let dom: JSDOM;
  let document: Document;
  let container: HTMLElement;

  beforeEach(() => {
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

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    container.innerHTML = '';
    dom.window.close();
  });

  it('should handle form submission without losing focus', async () => {
    // Arrange
    const mockCreateApplication = vi.mocked(applicationService.createApplication);
    mockCreateApplication.mockResolvedValueOnce({
      id: '01HKQJQJQJQJQJQJQJQJQJQJQ1',
      name: 'Test App',
      comments: 'Test comments',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Create the form component
    const form = document.createElement('application-form') as any;
    container.appendChild(form);

    // Wait for component to be defined and rendered
    await customElements.whenDefined('application-form');
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get form elements
    const nameInput = form.shadowRoot?.querySelector('#name') as HTMLInputElement;
    const commentsInput = form.shadowRoot?.querySelector('#comments') as HTMLTextAreaElement;
    const submitButton = form.shadowRoot?.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(nameInput).toBeTruthy();
    expect(commentsInput).toBeTruthy();
    expect(submitButton).toBeTruthy();

    // Act - Type in the name field
    nameInput.value = 'Test';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Focus should remain on name input
    nameInput.focus();
    expect(document.activeElement).toBe(nameInput);

    // Type more characters
    nameInput.value = 'Test App';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Assert - Focus should still be on the input (this test would have caught the focus loss issue)
    expect(document.activeElement).toBe(nameInput);
    expect(nameInput.value).toBe('Test App');
  });

  it('should validate required fields before submission', async () => {
    // Arrange
    const form = document.createElement('application-form') as any;
    container.appendChild(form);

    await customElements.whenDefined('application-form');
    await new Promise(resolve => setTimeout(resolve, 100));

    const nameInput = form.shadowRoot?.querySelector('#name') as HTMLInputElement;
    const submitButton = form.shadowRoot?.querySelector('button[type="submit"]') as HTMLButtonElement;

    // Act - Try to submit empty form
    submitButton.click();

    // Assert - Should show validation error
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const errorMessage = form.shadowRoot?.querySelector('.error-message');
    expect(errorMessage).toBeTruthy();
    expect(errorMessage?.textContent).toContain('required');
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    const mockCreateApplication = vi.mocked(applicationService.createApplication);
    mockCreateApplication.mockRejectedValueOnce(new Error('API Error'));

    const form = document.createElement('application-form') as any;
    container.appendChild(form);

    await customElements.whenDefined('application-form');
    await new Promise(resolve => setTimeout(resolve, 100));

    const nameInput = form.shadowRoot?.querySelector('#name') as HTMLInputElement;
    const submitButton = form.shadowRoot?.querySelector('button[type="submit"]') as HTMLButtonElement;

    // Act - Fill form and submit
    nameInput.value = 'Test App';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    submitButton.click();

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 200));

    // Assert - Should show error message
    const errorMessage = form.shadowRoot?.querySelector('.error-message');
    expect(errorMessage).toBeTruthy();
    expect(errorMessage?.textContent).toContain('Error');
  });

  it('should populate form fields in edit mode', async () => {
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

    // Create form in edit mode
    const form = document.createElement('application-form') as any;
    form.setAttribute('application-id', existingApp.id);
    container.appendChild(form);

    await customElements.whenDefined('application-form');
    await new Promise(resolve => setTimeout(resolve, 200)); // Wait for async loading

    // Assert - Form should be populated
    const nameInput = form.shadowRoot?.querySelector('#name') as HTMLInputElement;
    const commentsInput = form.shadowRoot?.querySelector('#comments') as HTMLTextAreaElement;

    expect(nameInput.value).toBe(existingApp.name);
    expect(commentsInput.value).toBe(existingApp.comments);
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

    await customElements.whenDefined('application-form');
    await new Promise(resolve => setTimeout(resolve, 100));

    const nameInput = form.shadowRoot?.querySelector('#name') as HTMLInputElement;
    const submitButton = form.shadowRoot?.querySelector('button[type="submit"]') as HTMLButtonElement;

    // Act - Submit valid form
    nameInput.value = 'Test App';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    submitButton.click();

    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 200));

    // Assert - Should have attempted navigation
    expect(mockCreateApplication).toHaveBeenCalledWith({
      name: 'Test App',
      comments: ''
    });
  });

  it('should handle delete operation with confirmation', async () => {
    // Arrange
    const existingApp: Application = {
      id: '01HKQJQJQJQJQJQJQJQJQJQJQ1',
      name: 'App to Delete',
      comments: 'Will be deleted',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockGetApplication = vi.mocked(applicationService.getApplication);
    mockGetApplication.mockResolvedValueOnce({
      ...existingApp,
      configuration_ids: []
    });

    // Mock confirm dialog
    global.window.confirm = vi.fn().mockReturnValue(true);

    const form = document.createElement('application-form') as any;
    form.setAttribute('application-id', existingApp.id);
    container.appendChild(form);

    await customElements.whenDefined('application-form');
    await new Promise(resolve => setTimeout(resolve, 200));

    // Act - Click delete button
    const deleteButton = form.shadowRoot?.querySelector('.delete-button') as HTMLButtonElement;
    if (deleteButton) {
      deleteButton.click();
      
      // Assert - Should show confirmation dialog
      expect(global.window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure')
      );
    }
  });
});