import { BaseComponent } from '../base/base-component';
import { applicationService } from '@/services/application-service';
import type { Application, ApplicationCreate, ApplicationUpdate } from '@/types/api';
import type { FormState } from '@/types/api';

export class ApplicationForm extends BaseComponent {
  private application: Application | null = null;
  private formState: FormState = {
    isSubmitting: false,
    errors: {},
  };

  static get observedAttributes(): string[] {
    return ['mode', 'application-id'];
  }

  get mode(): 'create' | 'edit' {
    return (this.getAttribute('mode') as 'create' | 'edit') || 'create';
  }

  get applicationId(): string | null {
    return this.getAttribute('application-id');
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this.mode === 'edit' && this.applicationId) {
      this.loadApplication();
    }
  }

  protected render(): void {
    const isEdit = this.mode === 'edit';
    const title = isEdit ? 'Edit Application' : 'Create Application';

    const template = this.createTemplate(
      `
      <div class="application-form">
        <div class="form-header">
          <h1 class="page-title">${title}</h1>
          <div class="breadcrumb">
            <a href="#/" class="breadcrumb-link">Applications</a>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-current">${title}</span>
          </div>
        </div>

        <div class="form-content">
          ${this.state.isLoading ? this.renderLoading() : ''}
          ${this.state.error ? this.renderError() : ''}
          ${!this.state.isLoading && !this.state.error ? this.renderForm() : ''}
        </div>
      </div>
      `,
      `
      .application-form {
        max-width: 600px;
        margin: 0 auto;
      }

      .form-header {
        margin-bottom: var(--spacing-xl);
      }

      .page-title {
        margin: 0 0 var(--spacing-sm) 0;
        font-size: var(--font-size-3xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
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
        color: var(--color-text-secondary);
      }

      .form-content {
        background-color: var(--color-bg-primary);
        border-radius: var(--border-radius-lg);
        box-shadow: var(--shadow-sm);
        padding: var(--spacing-xl);
      }

      .form-group {
        margin-bottom: var(--spacing-lg);
      }

      .form-label {
        display: block;
        margin-bottom: var(--spacing-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .form-label.required::after {
        content: ' *';
        color: var(--color-error);
      }

      .form-input,
      .form-textarea {
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-md);
        border: var(--border-width) solid var(--color-border);
        border-radius: var(--border-radius-md);
        font-size: var(--font-size-base);
        transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
      }

      .form-input:focus,
      .form-textarea:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px var(--color-primary-light);
      }

      .form-input.error,
      .form-textarea.error {
        border-color: var(--color-error);
      }

      .form-textarea {
        resize: vertical;
        min-height: 100px;
      }

      .form-help {
        margin-top: var(--spacing-xs);
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
      }

      .form-error {
        margin-top: var(--spacing-xs);
        font-size: var(--font-size-sm);
        color: var(--color-error);
      }

      .form-actions {
        display: flex;
        gap: var(--spacing-md);
        justify-content: flex-end;
        margin-top: var(--spacing-xl);
        padding-top: var(--spacing-lg);
        border-top: var(--border-width) solid var(--color-border-light);
      }

      .btn {
        padding: var(--spacing-sm) var(--spacing-lg);
        border: var(--border-width) solid transparent;
        border-radius: var(--border-radius-md);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: all var(--transition-fast);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-primary {
        background-color: var(--color-primary);
        color: var(--color-white);
      }

      .btn-primary:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
      }

      .btn-secondary {
        background-color: var(--color-bg-primary);
        color: var(--color-text-primary);
        border-color: var(--color-border);
      }

      .btn-secondary:hover {
        background-color: var(--color-bg-tertiary);
        text-decoration: none;
      }

      .loading-state {
        text-align: center;
        padding: var(--spacing-2xl);
      }

      .error-state {
        text-align: center;
        padding: var(--spacing-2xl);
        color: var(--color-text-muted);
      }

      @media (max-width: 768px) {
        .application-form {
          margin: 0;
        }

        .form-content {
          padding: var(--spacing-lg);
        }

        .form-actions {
          flex-direction: column-reverse;
        }

        .btn {
          width: 100%;
          justify-content: center;
        }
      }
      `
    );

    this.shadow.innerHTML = '';
    this.shadow.appendChild(template.content.cloneNode(true));
  }

  protected setupEventListeners(): void {
    const form = this.$('.app-form') as HTMLFormElement;
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // Real-time validation
    const nameInput = this.$('.form-input[name="name"]') as HTMLInputElement;
    if (nameInput) {
      nameInput.addEventListener('blur', () => this.validateField('name'));
      nameInput.addEventListener('input', () => this.clearFieldError('name'));
    }
  }

  private async loadApplication(): Promise<void> {
    if (!this.applicationId) return;

    const result = await this.handleAsync(
      () => applicationService.getApplication(this.applicationId!),
      'Failed to load application'
    );

    if (result) {
      this.application = result;
      this.render();
    }
  }

  private async handleSubmit(): Promise<void> {
    if (this.formState.isSubmitting) return;

    const formData = this.getFormData();
    if (!this.validateForm(formData)) {
      this.render();
      return;
    }

    this.formState.isSubmitting = true;
    this.render();

    try {
      if (this.mode === 'create') {
        await applicationService.createApplication(formData as ApplicationCreate);
        this.emit('app-success', { message: 'Application created successfully' });
      } else {
        await applicationService.updateApplication(this.applicationId!, formData as ApplicationUpdate);
        this.emit('app-success', { message: 'Application updated successfully' });
      }

      // Navigate back to applications list
      window.location.hash = '/';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save application';
      this.formState.errors.submit = message;
    } finally {
      this.formState.isSubmitting = false;
      this.render();
    }
  }

  private getFormData(): ApplicationCreate | ApplicationUpdate {
    const nameInput = this.$('.form-input[name="name"]') as HTMLInputElement;
    const commentsInput = this.$('.form-textarea[name="comments"]') as HTMLTextAreaElement;

    return {
      name: nameInput?.value.trim() || '',
      comments: commentsInput?.value.trim() || undefined,
    };
  }

  private validateForm(data: ApplicationCreate | ApplicationUpdate): boolean {
    this.formState.errors = {};

    if (!data.name) {
      this.formState.errors.name = 'Application name is required';
    } else if (data.name.length > 256) {
      this.formState.errors.name = 'Application name must be 256 characters or less';
    }

    if (data.comments && data.comments.length > 1024) {
      this.formState.errors.comments = 'Comments must be 1024 characters or less';
    }

    return Object.keys(this.formState.errors).length === 0;
  }

  private validateField(fieldName: string): void {
    const data = this.getFormData();
    
    if (fieldName === 'name') {
      if (!data.name) {
        this.formState.errors.name = 'Application name is required';
      } else if (data.name.length > 256) {
        this.formState.errors.name = 'Application name must be 256 characters or less';
      }
    }

    this.render();
  }

  private clearFieldError(fieldName: string): void {
    delete this.formState.errors[fieldName];
    this.render();
  }

  private renderLoading(): string {
    return `
      <div class="loading-state">
        <loading-spinner size="large"></loading-spinner>
        <p>Loading application...</p>
      </div>
    `;
  }

  private renderError(): string {
    return `
      <div class="error-state">
        <error-message message="${this.state.error}" type="error"></error-message>
        <button class="btn btn-primary" onclick="this.getRootNode().host.loadApplication()">
          Try Again
        </button>
      </div>
    `;
  }

  private renderForm(): string {
    const app = this.application;
    const errors = this.formState.errors;

    return `
      <form class="app-form">
        <div class="form-group">
          <label for="name" class="form-label required">Application Name</label>
          <input
            type="text"
            id="name"
            name="name"
            class="form-input ${errors.name ? 'error' : ''}"
            value="${app?.name || ''}"
            placeholder="Enter application name"
            maxlength="256"
            required
          >
          <div class="form-help">A unique name for your application (max 256 characters)</div>
          ${errors.name ? `<div class="form-error">${errors.name}</div>` : ''}
        </div>

        <div class="form-group">
          <label for="comments" class="form-label">Comments</label>
          <textarea
            id="comments"
            name="comments"
            class="form-textarea ${errors.comments ? 'error' : ''}"
            placeholder="Optional description or notes about this application"
            maxlength="1024"
          >${app?.comments || ''}</textarea>
          <div class="form-help">Optional description or notes (max 1024 characters)</div>
          ${errors.comments ? `<div class="form-error">${errors.comments}</div>` : ''}
        </div>

        ${errors.submit ? `<error-message message="${errors.submit}" type="error"></error-message>` : ''}

        <div class="form-actions">
          <a href="#/" class="btn btn-secondary">Cancel</a>
          <button 
            type="submit" 
            class="btn btn-primary"
            ${this.formState.isSubmitting ? 'disabled' : ''}
          >
            ${this.formState.isSubmitting ? '<loading-spinner size="small"></loading-spinner>' : ''}
            ${this.mode === 'create' ? 'Create Application' : 'Update Application'}
          </button>
        </div>
      </form>
    `;
  }

  attributeChangedCallback(): void {
    if (this.mode === 'edit' && this.applicationId && !this.application) {
      this.loadApplication();
    } else {
      this.render();
    }
  }
}

customElements.define('application-form', ApplicationForm);