import { BaseComponent } from '../base/base-component';
import { applicationService } from '@/services/application-service';
import type { ApplicationComplete } from '@/types/api';

export class ApplicationDetail extends BaseComponent {
  private application: ApplicationComplete | null = null;
  private applicationId: string = '';

  static get observedAttributes(): string[] {
    return ['application-id'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (name === 'application-id' && newValue !== oldValue) {
      this.applicationId = newValue;
      if (this.isConnected) {
        this.loadApplication();
      }
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this.applicationId) {
      this.loadApplication();
    }
  }

  protected render(): void {
    const template = this.createTemplate(
      `
      <div class="application-detail">
        <div class="detail-header">
          <div class="header-content">
            <div class="breadcrumb">
              <a href="#/applications" class="breadcrumb-link">Applications</a>
              <span class="breadcrumb-separator">›</span>
              <span class="breadcrumb-current">${this.application?.name || 'Loading...'}</span>
            </div>
            <div class="header-actions">
              <a href="#/applications/${this.applicationId}/edit" class="btn btn-secondary">
                <span class="btn-icon">✏️</span>
                Edit Application
              </a>
              <button class="btn btn-danger" onclick="this.getRootNode().host.handleDelete()">
                <span class="btn-icon">🗑️</span>
                Delete Application
              </button>
            </div>
          </div>
        </div>

        <div class="detail-content">
          ${this.state.isLoading ? this.renderLoading() : ''}
          ${this.state.error ? this.renderError() : ''}
          ${!this.state.isLoading && !this.state.error && this.application ? this.renderApplication() : ''}
        </div>
      </div>
      `,
      `
      .application-detail {
        max-width: 100%;
      }

      .detail-header {
        margin-bottom: var(--spacing-xl);
      }

      .header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--spacing-lg);
      }

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
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
        color: var(--color-text-primary);
        font-weight: var(--font-weight-semibold);
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-md);
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm) var(--spacing-md);
        border: var(--border-width) solid transparent;
        border-radius: var(--border-radius-md);
        font-weight: var(--font-weight-medium);
        text-decoration: none;
        cursor: pointer;
        transition: all var(--transition-fast);
        font-size: var(--font-size-sm);
      }

      .btn-primary {
        background-color: var(--color-primary);
        color: var(--color-white);
      }

      .btn-primary:hover {
        background-color: var(--color-primary-hover);
        text-decoration: none;
      }

      .btn-secondary {
        background-color: var(--color-secondary);
        color: var(--color-white);
      }

      .btn-secondary:hover {
        background-color: var(--color-secondary-hover);
        text-decoration: none;
      }

      .btn-danger {
        background-color: var(--color-danger);
        color: var(--color-white);
        border: none;
      }

      .btn-danger:hover {
        background-color: var(--color-danger-hover);
      }

      .btn-icon {
        font-size: var(--font-size-base);
      }

      .detail-content {
        background-color: var(--color-bg-primary);
        border-radius: var(--border-radius-lg);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
      }

      .app-info {
        padding: var(--spacing-xl);
      }

      .app-title {
        margin: 0 0 var(--spacing-md) 0;
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .app-meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-xl);
      }

      .meta-item {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .meta-label {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .meta-value {
        font-size: var(--font-size-base);
        color: var(--color-text-primary);
      }

      .meta-value.empty {
        color: var(--color-text-muted);
        font-style: italic;
      }

      .app-comments {
        margin-top: var(--spacing-lg);
        padding-top: var(--spacing-lg);
        border-top: var(--border-width) solid var(--color-border-light);
      }

      .comments-label {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: var(--spacing-sm);
      }

      .comments-content {
        font-size: var(--font-size-base);
        color: var(--color-text-primary);
        line-height: 1.6;
        white-space: pre-wrap;
      }

      .configurations-section {
        border-top: var(--border-width) solid var(--color-border-light);
        padding: var(--spacing-xl);
      }

      .section-title {
        margin: 0 0 var(--spacing-lg) 0;
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .empty-state {
        text-align: center;
        padding: var(--spacing-2xl);
        color: var(--color-text-muted);
      }

      .empty-state-icon {
        font-size: 48px;
        margin-bottom: var(--spacing-md);
      }

      .empty-state-title {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--spacing-sm);
        color: var(--color-text-secondary);
      }

      .empty-state-description {
        margin-bottom: var(--spacing-lg);
      }

      @media (max-width: 768px) {
        .header-content {
          flex-direction: column;
          align-items: stretch;
          gap: var(--spacing-md);
        }

        .app-meta {
          grid-template-columns: 1fr;
          gap: var(--spacing-md);
        }

        .app-info,
        .configurations-section {
          padding: var(--spacing-lg);
        }
      }
      `
    );

    this.shadow.innerHTML = '';
    this.shadow.appendChild(template.content.cloneNode(true));
  }

  private async loadApplication(): Promise<void> {
    if (!this.applicationId) return;

    const result = await this.handleAsync(
      () => applicationService.getApplication(this.applicationId),
      'Failed to load application'
    );

    if (result) {
      this.application = result;
      this.render();
    }
  }

  private renderLoading(): string {
    return `
      <div class="empty-state">
        <loading-spinner size="large"></loading-spinner>
        <p>Loading application...</p>
      </div>
    `;
  }

  private renderError(): string {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <h3 class="empty-state-title">Error Loading Application</h3>
        <p class="empty-state-description">${this.state.error}</p>
        <button class="btn btn-primary" onclick="this.getRootNode().host.loadApplication()">
          Try Again
        </button>
      </div>
    `;
  }

  private renderApplication(): string {
    if (!this.application) return '';

    return `
      <div class="app-info">
        <h1 class="app-title">${this.application.name}</h1>
        
        <div class="app-meta">
          <div class="meta-item">
            <div class="meta-label">Application ID</div>
            <div class="meta-value">${this.application.id}</div>
          </div>
          
          <div class="meta-item">
            <div class="meta-label">Created</div>
            <div class="meta-value">${this.formatDate(this.application.created_at)}</div>
          </div>
          
          <div class="meta-item">
            <div class="meta-label">Last Updated</div>
            <div class="meta-value">${this.formatDate(this.application.updated_at)}</div>
          </div>
        </div>

        ${this.application.comments ? `
          <div class="app-comments">
            <div class="comments-label">Comments</div>
            <div class="comments-content">${this.application.comments}</div>
          </div>
        ` : ''}
      </div>

      <div class="configurations-section">
        <h2 class="section-title">Configurations</h2>
        ${this.renderConfigurations()}
      </div>
    `;
  }

  private renderConfigurations(): string {
    if (!this.application) return '';
    
    return `<configuration-list application-id="${this.application.id}"></configuration-list>`;
  }

  async handleDelete(): Promise<void> {
    if (!this.application) return;

    const confirmed = confirm(
      `Are you sure you want to delete the application "${this.application.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await applicationService.deleteApplication(this.applicationId);

      // Dispatch success event
      this.dispatchEvent(new CustomEvent('app-success', {
        bubbles: true,
        detail: { message: `Application "${this.application.name}" deleted successfully` }
      }));

      // Navigate back to applications list
      window.location.hash = '#/applications';
    } catch (error) {
      // Handle error through the base component's error handling
      this.setState({ error: error instanceof Error ? error.message : 'Failed to delete application' });
    }
  }
}

customElements.define('application-detail', ApplicationDetail);