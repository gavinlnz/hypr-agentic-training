import { BaseComponent } from '../base/base-component';
import { configurationService } from '@/services/configuration-service';
import type { Configuration, ConfigurationCreate, ConfigurationUpdate } from '@/types/api';

export class ConfigurationForm extends BaseComponent {
  private applicationId: string = '';
  private configurationId: string | null = null;
  private configuration: Configuration | null = null;
  private isLoading = false;
  private isSaving = false;
  private error: string | null = null;
  private isEditMode = false;

  static get observedAttributes() {
    return ['application-id', 'configuration-id', 'mode'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (newValue === oldValue) return;

    switch (name) {
      case 'application-id':
        this.applicationId = newValue;
        break;
      case 'configuration-id':
        this.configurationId = newValue;
        if (newValue) {
          this.loadConfiguration();
        }
        break;
      case 'mode':
        this.isEditMode = newValue === 'edit';
        break;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.applicationId = this.getAttribute('application-id') || '';
    this.configurationId = this.getAttribute('configuration-id');
    this.isEditMode = this.getAttribute('mode') === 'edit';

    if (this.configurationId && this.applicationId) {
      this.loadConfiguration();
    } else {
      this.render();
    }
  }

  private async loadConfiguration() {
    if (!this.applicationId || !this.configurationId) return;

    this.isLoading = true;
    this.error = null;
    this.render();

    try {
      this.configuration = await configurationService.getConfiguration(
        this.applicationId,
        this.configurationId
      );
    } catch (error) {
      console.error('Failed to load configuration:', error);
      this.error = 'Failed to load configuration. Please try again.';
    } finally {
      this.isLoading = false;
      this.render();
    }
  }

  private handleSubmit = async (event: Event) => {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const name = formData.get('name') as string;
    const comments = formData.get('comments') as string;
    const configJson = formData.get('config') as string;

    // Validate form
    if (!name.trim()) {
      this.error = 'Configuration name is required.';
      this.render();
      return;
    }

    let config: Record<string, any>;
    try {
      config = configJson.trim() ? JSON.parse(configJson) : {};
    } catch (error) {
      this.error = 'Invalid JSON in configuration. Please check your syntax.';
      this.render();
      return;
    }

    this.isSaving = true;
    this.error = null;
    this.render();

    try {
      if (this.isEditMode && this.configurationId) {
        // Update existing configuration
        const updateData: ConfigurationUpdate = {
          name: name.trim(),
          comments: comments.trim() || undefined,
          config
        };

        await configurationService.updateConfiguration(
          this.applicationId,
          this.configurationId,
          updateData
        );

        // Dispatch success event
        this.dispatchEvent(new CustomEvent('configuration-updated', {
          detail: { configurationId: this.configurationId },
          bubbles: true
        }));

        // Navigate back to configuration detail
        window.location.hash = `#/applications/${this.applicationId}/configurations/${this.configurationId}`;
      } else {
        // Create new configuration
        const createData: ConfigurationCreate = {
          application_id: this.applicationId,
          name: name.trim(),
          comments: comments.trim() || undefined,
          config
        };

        const newConfiguration = await configurationService.createConfiguration(
          this.applicationId,
          createData
        );

        // Dispatch success event
        this.dispatchEvent(new CustomEvent('configuration-created', {
          detail: { configuration: newConfiguration },
          bubbles: true
        }));

        // Navigate to new configuration detail
        window.location.hash = `#/applications/${this.applicationId}/configurations/${newConfiguration.id}`;
      }
    } catch (error: any) {
      console.error('Failed to save configuration:', error);
      
      // Handle specific error messages
      if (error.message?.includes('already exists')) {
        this.error = 'A configuration with this name already exists in this application.';
      } else {
        this.error = 'Failed to save configuration. Please try again.';
      }
      this.render();
    } finally {
      this.isSaving = false;
    }
  };

  private handleCancel = () => {
    if (this.isEditMode && this.configurationId) {
      window.location.hash = `#/applications/${this.applicationId}/configurations/${this.configurationId}`;
    } else {
      window.location.hash = `#/applications/${this.applicationId}`;
    }
  };

  private formatJsonForEditing(config: Record<string, any>): string {
    return JSON.stringify(config, null, 2);
  }

  private validateJson = (event: Event) => {
    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value.trim();
    
    if (!value) {
      this.clearJsonError();
      return;
    }

    try {
      JSON.parse(value);
      this.clearJsonError();
    } catch (error) {
      this.showJsonError('Invalid JSON syntax');
    }
  };

  private showJsonError(message: string) {
    const errorElement = this.$('.json-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  private clearJsonError() {
    const errorElement = this.$('.json-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  render() {
    if (this.isLoading) {
      this.innerHTML = '<loading-spinner></loading-spinner>';
      return;
    }

    const title = this.isEditMode ? 'Edit Configuration' : 'New Configuration';
    const submitText = this.isSaving 
      ? (this.isEditMode ? 'Updating...' : 'Creating...')
      : (this.isEditMode ? 'Update Configuration' : 'Create Configuration');

    const defaultValues = this.configuration || {
      name: '',
      comments: '',
      config: {}
    };

    this.innerHTML = `
      <div class="configuration-form">
        <div class="form-header">
          <div class="breadcrumb">
            <a href="#/applications/${this.applicationId}" class="breadcrumb-link">Application</a>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-current">${title}</span>
          </div>
          <h1>${title}</h1>
        </div>

        ${this.error ? `
          <div class="error-banner">
            <span class="error-icon">⚠️</span>
            <span class="error-text">${this.error}</span>
          </div>
        ` : ''}

        <form class="config-form">
          <div class="form-section">
            <h2>Basic Information</h2>
            
            <div class="form-group">
              <label for="name" class="form-label">
                Configuration Name <span class="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                class="form-input"
                value="${defaultValues.name}"
                placeholder="e.g., database-config, api-settings"
                required
                maxlength="256"
                ${this.isSaving ? 'disabled' : ''}
              >
              <div class="form-help">
                A unique name for this configuration within the application.
              </div>
            </div>

            <div class="form-group">
              <label for="comments" class="form-label">Comments</label>
              <textarea
                id="comments"
                name="comments"
                class="form-textarea"
                placeholder="Optional description or notes about this configuration..."
                maxlength="1024"
                rows="3"
                ${this.isSaving ? 'disabled' : ''}
              >${defaultValues.comments || ''}</textarea>
              <div class="form-help">
                Optional comments to describe the purpose or usage of this configuration.
              </div>
            </div>
          </div>

          <div class="form-section">
            <h2>Configuration Data</h2>
            
            <div class="form-group">
              <label for="config" class="form-label">JSON Configuration</label>
              <textarea
                id="config"
                name="config"
                class="form-textarea json-editor"
                placeholder='{\n  "host": "localhost",\n  "port": 5432,\n  "database": "myapp"\n}'
                rows="12"
                ${this.isSaving ? 'disabled' : ''}
              >${this.formatJsonForEditing(defaultValues.config)}</textarea>
              <div class="json-error" style="display: none;"></div>
              <div class="form-help">
                Enter your configuration as valid JSON. Leave empty for an empty configuration object.
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="btn btn-secondary"
              ${this.isSaving ? 'disabled' : ''}
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              ${this.isSaving ? 'disabled' : ''}
            >
              ${submitText}
            </button>
          </div>
        </form>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners() {
    // Form submission
    const form = this.$('.config-form') as HTMLFormElement;
    if (form) {
      form.addEventListener('submit', this.handleSubmit);
    }

    // Cancel button
    const cancelButton = this.$('.btn-secondary');
    if (cancelButton) {
      cancelButton.addEventListener('click', this.handleCancel);
    }

    // JSON validation
    const jsonTextarea = this.$('#config') as HTMLTextAreaElement;
    if (jsonTextarea) {
      jsonTextarea.addEventListener('blur', this.validateJson);
      jsonTextarea.addEventListener('input', this.validateJson);
    }
  }

  static get styles() {
    return `
      .configuration-form {
        max-width: 800px;
        margin: 0 auto;
        padding: var(--spacing-lg);
      }

      .form-header {
        margin-bottom: var(--spacing-xl);
      }

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
        font-size: var(--font-size-sm);
      }

      .breadcrumb-link {
        color: var(--color-primary);
        text-decoration: none;
      }

      .breadcrumb-link:hover {
        text-decoration: underline;
      }

      .breadcrumb-separator {
        color: var(--color-text-muted);
      }

      .breadcrumb-current {
        color: var(--color-text-muted);
      }

      .form-header h1 {
        margin: 0;
        color: var(--color-text-dark);
      }

      .error-banner {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-md);
        background-color: var(--color-danger-light);
        border: var(--border-width) solid var(--color-danger);
        border-radius: var(--border-radius);
        margin-bottom: var(--spacing-lg);
      }

      .error-icon {
        font-size: var(--font-size-lg);
      }

      .error-text {
        color: var(--color-danger-dark);
        font-weight: 500;
      }

      .config-form {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xl);
      }

      .form-section {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .form-section h2 {
        margin: 0;
        padding-bottom: var(--spacing-sm);
        border-bottom: var(--border-width) solid var(--color-border-light);
        color: var(--color-text-dark);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .form-label {
        font-weight: 600;
        color: var(--color-text-dark);
      }

      .required {
        color: var(--color-danger);
      }

      .form-input,
      .form-textarea {
        padding: var(--spacing-md);
        border: var(--border-width) solid var(--color-border);
        border-radius: var(--border-radius);
        font-size: var(--font-size-base);
        font-family: var(--font-family-base);
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .form-input:focus,
      .form-textarea:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px var(--color-primary-light);
      }

      .form-textarea {
        resize: vertical;
        min-height: 80px;
      }

      .json-editor {
        font-family: var(--font-family-mono);
        font-size: var(--font-size-sm);
        line-height: 1.5;
      }

      .json-error {
        color: var(--color-danger);
        font-size: var(--font-size-sm);
        font-weight: 500;
        padding: var(--spacing-xs) var(--spacing-sm);
        background-color: var(--color-danger-light);
        border-radius: var(--border-radius);
        border: var(--border-width) solid var(--color-danger);
      }

      .form-help {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
        line-height: 1.4;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-md);
        padding-top: var(--spacing-lg);
        border-top: var(--border-width) solid var(--color-border-light);
      }

      @media (max-width: 768px) {
        .configuration-form {
          padding: var(--spacing-md);
        }

        .form-actions {
          flex-direction: column-reverse;
        }

        .form-actions .btn {
          width: 100%;
        }
      }
    `;
  }
}

customElements.define('configuration-form', ConfigurationForm);