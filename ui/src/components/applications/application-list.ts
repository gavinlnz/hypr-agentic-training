import { BaseComponent } from '../base/base-component';
import { applicationService } from '@/services/application-service';
import type { Application } from '@/types/api';

export class ApplicationList extends BaseComponent {
  private applications: Application[] = [];
  private searchTerm = '';
  private selectedIds: Set<string> = new Set();
  private isDeleting = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.loadApplications();
  }

  protected render(): void {
    const filteredApplications = this.filterApplications();

    const template = this.createTemplate(
      `
      <div class="application-list">
        <div class="list-header">
          <div class="header-content">
            <h1 class="page-title">Applications</h1>
            <div class="header-actions">
              <a href="#/applications/new" class="btn btn-primary">
                <span class="btn-icon">➕</span>
                New Application
              </a>
            </div>
          </div>
          
          <div class="list-controls">
            <div class="search-box">
              <input 
                type="search" 
                class="search-input" 
                placeholder="Search applications..." 
                value="${this.searchTerm}"
                aria-label="Search applications"
              >
            </div>
            ${this.selectedIds.size > 0 ? `
              <button 
                class="btn btn-danger bulk-delete-btn"
                onclick="this.getRootNode().host.handleBulkDelete()"
                ${this.isDeleting ? 'disabled' : ''}
              >
                ${this.isDeleting ? '<loading-spinner size="small"></loading-spinner>' : '🗑️'}
                Delete Selected (${this.selectedIds.size})
              </button>
            ` : ''}
          </div>
        </div>

        <div class="list-content">
          ${this.state.isLoading ? this.renderLoading() : ''}
          ${this.state.error ? this.renderError() : ''}
          ${!this.state.isLoading && !this.state.error ? this.renderApplications(filteredApplications) : ''}
        </div>
      </div>
      `,
      `
      .application-list {
        max-width: 100%;
      }

      .list-header {
        margin-bottom: var(--spacing-xl);
      }

      .header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--spacing-lg);
      }

      .page-title {
        margin: 0;
        font-size: var(--font-size-3xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
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

      .btn-icon {
        font-size: var(--font-size-base);
      }

      .list-controls {
        display: flex;
        gap: var(--spacing-md);
        align-items: center;
      }

      .search-box {
        flex: 1;
        max-width: 400px;
      }

      .bulk-delete-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm) var(--spacing-md);
        border: var(--border-width) solid transparent;
        border-radius: var(--border-radius-md);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: all var(--transition-fast);
        font-size: var(--font-size-sm);
        background-color: var(--color-danger);
        color: var(--color-white);
      }

      .bulk-delete-btn:hover:not(:disabled) {
        background-color: var(--color-danger-hover);
      }

      .bulk-delete-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .search-input {
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-md);
        border: var(--border-width) solid var(--color-border);
        border-radius: var(--border-radius-md);
        font-size: var(--font-size-base);
      }

      .list-content {
        background-color: var(--color-bg-primary);
        border-radius: var(--border-radius-lg);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
      }

      .applications-table {
        width: 100%;
        border-collapse: collapse;
      }

      .applications-table th,
      .applications-table td {
        padding: var(--spacing-md);
        text-align: left;
        border-bottom: var(--border-width) solid var(--color-border-light);
      }

      .applications-table th {
        background-color: var(--color-bg-tertiary);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .applications-table tbody tr:hover {
        background-color: var(--color-bg-secondary);
      }

      .applications-table tbody tr.selected {
        background-color: var(--color-primary-light);
      }

      .applications-table tbody tr.selected:hover {
        background-color: var(--color-primary-light);
      }

      .select-column {
        width: 40px;
        text-align: center;
      }

      .select-checkbox {
        cursor: pointer;
      }

      .app-name {
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .app-comments {
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .app-date {
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
      }

      .app-actions {
        display: flex;
        gap: var(--spacing-sm);
      }

      .action-btn {
        padding: var(--spacing-xs) var(--spacing-sm);
        font-size: var(--font-size-sm);
        border-radius: var(--border-radius-sm);
        text-decoration: none;
        font-weight: var(--font-weight-medium);
        transition: all var(--transition-fast);
      }

      .action-btn-view {
        color: var(--color-primary);
        background-color: var(--color-primary-light);
      }

      .action-btn-view:hover {
        background-color: var(--color-primary);
        color: var(--color-white);
        text-decoration: none;
      }

      .action-btn-edit {
        color: var(--color-secondary);
        background-color: var(--color-secondary-light);
      }

      .action-btn-edit:hover {
        background-color: var(--color-secondary);
        color: var(--color-white);
        text-decoration: none;
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

        .page-title {
          font-size: var(--font-size-2xl);
        }

        .applications-table {
          font-size: var(--font-size-sm);
        }

        .applications-table th,
        .applications-table td {
          padding: var(--spacing-sm);
        }

        .app-comments {
          max-width: 200px;
        }
      }
      `
    );

    this.shadow.innerHTML = '';
    this.shadow.appendChild(template.content.cloneNode(true));
  }

  protected setupEventListeners(): void {
    const searchInput = this.$('.search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = (e.target as HTMLInputElement).value;
        this.render();
      });
    }
  }

  private async loadApplications(): Promise<void> {
    const result = await this.handleAsync(
      () => applicationService.getApplications(),
      'Failed to load applications'
    );

    if (result) {
      this.applications = result;
      this.render();
    }
  }

  private filterApplications(): Application[] {
    if (!this.searchTerm) {
      return this.applications;
    }

    const term = this.searchTerm.toLowerCase();
    return this.applications.filter(app =>
      app.name.toLowerCase().includes(term) ||
      (app.comments && app.comments.toLowerCase().includes(term))
    );
  }

  private renderLoading(): string {
    return `
      <div class="empty-state">
        <loading-spinner size="large"></loading-spinner>
        <p>Loading applications...</p>
      </div>
    `;
  }

  private renderError(): string {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <h3 class="empty-state-title">Error Loading Applications</h3>
        <p class="empty-state-description">${this.state.error}</p>
        <button class="btn btn-primary" onclick="this.getRootNode().host.loadApplications()">
          Try Again
        </button>
      </div>
    `;
  }

  private renderApplications(applications: Application[]): string {
    if (applications.length === 0) {
      return this.renderEmptyState();
    }

    const allSelected = applications.length > 0 && applications.every(app => this.selectedIds.has(app.id));
    const someSelected = applications.some(app => this.selectedIds.has(app.id));

    return `
      <table class="applications-table">
        <thead>
          <tr>
            <th class="select-column">
              <input 
                type="checkbox" 
                class="select-checkbox select-all-checkbox"
                ${allSelected ? 'checked' : ''}
                ${someSelected && !allSelected ? 'indeterminate' : ''}
                onchange="this.getRootNode().host.handleSelectAll(this.checked)"
                aria-label="Select all applications"
              >
            </th>
            <th>Name</th>
            <th>Comments</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${applications.map(app => `
            <tr class="${this.selectedIds.has(app.id) ? 'selected' : ''}">
              <td class="select-column">
                <input 
                  type="checkbox" 
                  class="select-checkbox"
                  ${this.selectedIds.has(app.id) ? 'checked' : ''}
                  onchange="this.getRootNode().host.handleSelectRow('${app.id}', this.checked)"
                  aria-label="Select ${app.name}"
                >
              </td>
              <td>
                <div class="app-name">${app.name}</div>
              </td>
              <td>
                <div class="app-comments" title="${app.comments || ''}">${app.comments || '—'}</div>
              </td>
              <td>
                <div class="app-date">${this.formatDate(app.created_at)}</div>
              </td>
              <td>
                <div class="app-actions">
                  <a href="#/applications/${app.id}" class="action-btn action-btn-view">View</a>
                  <a href="#/applications/${app.id}/edit" class="action-btn action-btn-edit">Edit</a>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  private renderEmptyState(): string {
    const message = this.searchTerm
      ? `No applications found matching "${this.searchTerm}"`
      : 'No applications found';

    return `
      <div class="empty-state">
        <div class="empty-state-icon">📱</div>
        <h3 class="empty-state-title">${message}</h3>
        <p class="empty-state-description">
          ${this.searchTerm
            ? 'Try adjusting your search terms.'
            : 'Get started by creating your first application.'
          }
        </p>
        ${!this.searchTerm ? '<a href="#/applications/new" class="btn btn-primary">Create Application</a>' : ''}
      </div>
    `;
  }

  handleSelectRow(appId: string, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(appId);
    } else {
      this.selectedIds.delete(appId);
    }
    this.render();
  }

  handleSelectAll(checked: boolean): void {
    const filteredApplications = this.filterApplications();
    
    if (checked) {
      filteredApplications.forEach(app => this.selectedIds.add(app.id));
    } else {
      filteredApplications.forEach(app => this.selectedIds.delete(app.id));
    }
    this.render();
  }

  async handleBulkDelete(): Promise<void> {
    if (this.selectedIds.size === 0) return;

    const selectedApps = this.applications.filter(app => this.selectedIds.has(app.id));
    const appNames = selectedApps.map(app => app.name).join(', ');
    
    const confirmed = confirm(
      `Are you sure you want to delete ${this.selectedIds.size} application(s)?\n\n${appNames}\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    this.isDeleting = true;
    this.render();

    try {
      await applicationService.deleteApplications(Array.from(this.selectedIds));

      // Dispatch success event
      this.dispatchEvent(new CustomEvent('app-success', {
        bubbles: true,
        detail: { message: `${this.selectedIds.size} application(s) deleted successfully` }
      }));

      // Clear selection and reload
      this.selectedIds.clear();
      await this.loadApplications();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete applications';
      
      // Dispatch error event
      this.dispatchEvent(new CustomEvent('app-error', {
        bubbles: true,
        detail: { message }
      }));
    } finally {
      this.isDeleting = false;
      this.render();
    }
  }
}

customElements.define('application-list', ApplicationList);