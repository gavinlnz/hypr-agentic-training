import { BaseComponent } from '../base/base-component';
import { configurationService } from '@/services/configuration-service';
import type { Configuration } from '@/types/api';

export class ConfigurationDetail extends BaseComponent {
  private applicationId: string = '';
  private configurationId: string = '';
  private configuration: Configuration | null = null;
  private isLoading = false;
  private isDeleting = false;
  private error: string | null = null;

  static get observedAttributes() {
    return ['application-id', 'configuration-id'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (newValue === oldValue) return;

    switch (name) {
      case 'application-id':
        this.applicationId = newValue;
        break;
      case 'configuration-id':
        this.configurationId = newValue;
        break;
    }

    if (this.applicationId && this.configurationId) {
      this.loadConfiguration();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.applicationId = this.getAttribute('application-id') || '';
    this.configurationId = this.getAttribute('configuration-id') || '';

    if (this.applicationId && this.configurationId) {
      this.loadConfiguration();
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

  private handleEdit = () => {
    window.location.hash = `#/applications/${this.applicationId}/configurations/${this.configurationId}/edit`;
  };

  private handleDelete = async () => {
    if (!this.configuration) return;

    const confirmMessage = `Are you sure you want to delete the configuration "${this.configuration.name}"?\n\nThis action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    this.isDeleting = true;
    this.render();

    try {
      await configurationService.deleteConfiguration(this.applicationId, this.configurationId);

      // Dispatch success event
      this.dispatchEvent(new CustomEvent('configuration-deleted', {
        detail: { configurationId: this.configurationId },
        bubbles: true
      }));

      // Navigate back to application detail
      window.location.hash = `#/applications/${this.applicationId}`;
    } catch (error) {
      console.error('Failed to delete configuration:', error);
      this.error = 'Failed to delete configuration. Please try again.';
      this.render();
    } finally {
      this.isDeleting = false;
    }
  };

  private handleCopyConfig = async () => {
    if (!this.configuration) return;

    try {
      const configJson = JSON.stringify(this.configuration.config, null, 2);
      await navigator.clipboard.writeText(configJson);
      
      // Show temporary success message
      this.showCopySuccess();
    } catch (error) {
      console.error('Failed to copy configuration:', error);
      // Fallback for browsers that don't support clipboard API
      this.selectConfigText();
    }
  };

  private showCopySuccess() {
    const button = this.$('.copy-button');
    if (button) {
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.classList.add('success');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('success');
      }, 2000);
    }
  }

  private selectConfigText() {
    const configElement = this.$('.config-json');
    if (configElement) {
      const range = document.createRange();
      range.selectNodeContents(configElement);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatJsonForDisplay(config: Record<string, any>): string {
    return JSON.stringify(config, null, 2);
  }

  private getConfigSummary(config: Record<string, any>): string {
    const keys = Object.keys(config);
    if (keys.length === 0) return 'Empty configuration';
    
    const summary = keys.slice(0, 5).join(', ');
    return keys.length > 5 ? `${summary} +${keys.length - 5} more` : summary;
  }

  render() {
    if (this.isLoading) {
      this.innerHTML = '<loading-spinner></loading-spinner>';
      return;
    }

    if (this.error) {
      this.innerHTML = `<error-message message="${this.error}"></error-message>`;
      return;
    }

    if (!this.configuration) {
      this.innerHTML = '<error-message message="Configuration not found"></error-message>';
      return;
    }

    const config = this.configuration;
    const hasConfig = Object.keys(config.config).length > 0;

    this.innerHTML = `
      <div class="configuration-detail">
        <div class="detail-header">
          <div class="breadcrumb">
            <a href="#/applications/${this.applicationId}" class="breadcrumb-link">Application</a>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-current">${config.name}</span>
          </div>
          
          <div class="header-content">
            <div class="title-section">
              <h1 class="config-title">${config.name}</h1>
              <div class="config-meta">
                <span class="meta-item">
                  <span class="meta-label">Keys:</span>
                  <span class="meta-value">${Object.keys(config.config).length}</span>
                </span>
                <span class="meta-separator">•</span>
                <span class="meta-item">
                  <span class="meta-label">Updated:</span>
                  <span class="meta-value">${this.formatDate(config.updated_at)}</span>
                </span>
              </div>
            </div>
            
            <div class="header-actions">
              <button
                class="btn btn-primary"
                ${this.isDeleting ? 'disabled' : ''}
              >
                <span class="btn-icon">✏️</span>
                Edit
              </button>
              <button
                class="btn btn-danger"
                ${this.isDeleting ? 'disabled' : ''}
              >
                <span class="btn-icon">🗑️</span>
                ${this.isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        <div class="detail-content">
          <div class="info-section">
            <h2>Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <label class="info-label">Configuration ID</label>
                <div class="info-value monospace">${config.id}</div>
              </div>
              
              <div class="info-item">
                <label class="info-label">Application ID</label>
                <div class="info-value monospace">${config.application_id}</div>
              </div>
              
              <div class="info-item">
                <label class="info-label">Created</label>
                <div class="info-value">${this.formatDate(config.created_at)}</div>
              </div>
              
              <div class="info-item">
                <label class="info-label">Last Updated</label>
                <div class="info-value">${this.formatDate(config.updated_at)}</div>
              </div>
            </div>

            ${config.comments ? `
              <div class="comments-section">
                <label class="info-label">Comments</label>
                <div class="comments-content">${config.comments}</div>
              </div>
            ` : ''}
          </div>

          <div class="config-section">
            <div class="section-header">
              <h2>Configuration Data</h2>
              ${hasConfig ? `
                <button class="btn btn-sm btn-secondary copy-button">
                  <span class="btn-icon">📋</span>
                  Copy JSON
                </button>
              ` : ''}
            </div>

            ${hasConfig ? `
              <div class="config-summary">
                <strong>Keys:</strong> ${this.getConfigSummary(config.config)}
              </div>
              
              <div class="config-container">
                <pre class="config-json">${this.formatJsonForDisplay(config.config)}</pre>
              </div>
            ` : `
              <div class="empty-config">
                <div class="empty-config-icon">📄</div>
                <h3>Empty Configuration</h3>
                <p>This configuration doesn't contain any data yet.</p>
                <button class="btn btn-primary">
                  <span class="btn-icon">✏️</span>
                  Add Configuration Data
                </button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners() {
    // Edit button
    const editButtons = this.$$('.btn-primary');
    editButtons.forEach(button => {
      if (button.textContent?.includes('Edit') || button.textContent?.includes('Add Configuration Data')) {
        button.addEventListener('click', this.handleEdit);
      }
    });

    // Delete button
    const deleteButton = this.$('.btn-danger');
    if (deleteButton) {
      deleteButton.addEventListener('click', this.handleDelete);
    }

    // Copy button
    const copyButton = this.$('.copy-button');
    if (copyButton) {
      copyButton.addEventListener('click', this.handleCopyConfig);
    }
  }

  static get styles() {
    return `
      .configuration-detail {
        max-width: 1000px;
        margin: 0 auto;
        padding: var(--spacing-lg);
      }

      .detail-header {
        margin-bottom: var(--spacing-xl);
      }

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-lg);
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

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--spacing-lg);
      }

      .title-section {
        flex: 1;
      }

      .config-title {
        margin: 0 0 var(--spacing-sm) 0;
        color: var(--color-text-dark);
        font-size: var(--font-size-xxl);
      }

      .config-meta {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
      }

      .meta-label {
        font-weight: 500;
      }

      .meta-separator {
        opacity: 0.5;
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-sm);
      }

      .detail-content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xl);
      }

      .info-section,
      .config-section {
        background-color: var(--color-white);
        border: var(--border-width) solid var(--color-border);
        border-radius: var(--border-radius);
        padding: var(--spacing-xl);
      }

      .info-section h2,
      .config-section h2 {
        margin: 0 0 var(--spacing-lg) 0;
        color: var(--color-text-dark);
        border-bottom: var(--border-width) solid var(--color-border-light);
        padding-bottom: var(--spacing-sm);
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
      }

      .section-header h2 {
        margin: 0;
        border: none;
        padding: 0;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--spacing-lg);
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .info-label {
        font-weight: 600;
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .info-value {
        font-size: var(--font-size-base);
        color: var(--color-text-dark);
        word-break: break-all;
      }

      .monospace {
        font-family: var(--font-family-mono);
        font-size: var(--font-size-sm);
      }

      .comments-section {
        margin-top: var(--spacing-lg);
        padding-top: var(--spacing-lg);
        border-top: var(--border-width) solid var(--color-border-light);
      }

      .comments-content {
        background-color: var(--color-background-light);
        padding: var(--spacing-md);
        border-radius: var(--border-radius);
        border-left: 4px solid var(--color-primary);
        font-style: italic;
        line-height: 1.5;
      }

      .config-summary {
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-md);
        background-color: var(--color-background-light);
        border-radius: var(--border-radius);
        font-size: var(--font-size-sm);
      }

      .config-container {
        border: var(--border-width) solid var(--color-border);
        border-radius: var(--border-radius);
        overflow: hidden;
      }

      .config-json {
        margin: 0;
        padding: var(--spacing-lg);
        background-color: var(--color-background-dark);
        color: var(--color-text-light);
        font-family: var(--font-family-mono);
        font-size: var(--font-size-sm);
        line-height: 1.5;
        overflow-x: auto;
        white-space: pre;
      }

      .empty-config {
        text-align: center;
        padding: var(--spacing-xxl);
        color: var(--color-text-muted);
      }

      .empty-config-icon {
        font-size: 4rem;
        margin-bottom: var(--spacing-lg);
      }

      .empty-config h3 {
        margin: 0 0 var(--spacing-md) 0;
        color: var(--color-text-dark);
      }

      .empty-config p {
        margin: 0 0 var(--spacing-lg) 0;
      }

      .copy-button.success {
        background-color: var(--color-success);
        border-color: var(--color-success);
      }

      @media (max-width: 768px) {
        .configuration-detail {
          padding: var(--spacing-md);
        }

        .header-content {
          flex-direction: column;
          align-items: stretch;
        }

        .header-actions {
          justify-content: stretch;
        }

        .header-actions .btn {
          flex: 1;
        }

        .info-grid {
          grid-template-columns: 1fr;
        }

        .section-header {
          flex-direction: column;
          align-items: stretch;
          gap: var(--spacing-md);
        }

        .config-json {
          font-size: var(--font-size-xs);
        }
      }
    `;
  }
}

customElements.define('configuration-detail', ConfigurationDetail);