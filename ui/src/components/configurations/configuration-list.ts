import { BaseComponent } from '../base/base-component';
import { configurationService } from '@/services/configuration-service';
import type { Configuration } from '@/types/api';

export class ConfigurationList extends BaseComponent {
  private configurations: Configuration[] = [];
  private applicationId: string = '';
  private isLoading = false;
  private error: string | null = null;
  private searchQuery = '';
  private selectedIds: Set<string> = new Set();
  private isDeleting = false;

  static get observedAttributes() {
    return ['application-id'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'application-id' && newValue !== oldValue) {
      this.applicationId = newValue;
      if (newValue) {
        this.loadConfigurations();
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.applicationId = this.getAttribute('application-id') || '';
    if (this.applicationId) {
      this.loadConfigurations();
    }
  }

  private async loadConfigurations() {
    if (!this.applicationId) return;

    this.isLoading = true;
    this.error = null;
    this.render();

    try {
      this.configurations = await configurationService.getConfigurations(
        this.applicationId,
        this.searchQuery || undefined
      );
      this.selectedIds.clear();
    } catch (error) {
      console.error('Failed to load configurations:', error);
      this.error = 'Failed to load configurations. Please try again.';
    } finally {
      this.isLoading = false;
      this.render();
    }
  }

  private handleSearch = (event: Event) => {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    
    // Debounce search
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadConfigurations();
    }, 300);
  };

  private searchTimeout: number = 0;

  private handleSelectAll = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.configurations.forEach(config => this.selectedIds.add(config.id));
    } else {
      this.selectedIds.clear();
    }
    this.render();
  };

  private handleSelectConfiguration = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const configId = target.dataset.configId!;
    
    if (target.checked) {
      this.selectedIds.add(configId);
    } else {
      this.selectedIds.delete(configId);
    }
    this.render();
  };

  private handleCreateConfiguration = () => {
    window.location.hash = `#/applications/${this.applicationId}/configurations/new`;
  };

  private handleViewConfiguration = (configId: string) => {
    window.location.hash = `#/applications/${this.applicationId}/configurations/${configId}`;
  };

  private handleEditConfiguration = (configId: string) => {
    window.location.hash = `#/applications/${this.applicationId}/configurations/${configId}/edit`;
  };

  private handleDeleteSelected = async () => {
    if (this.selectedIds.size === 0) return;

    const configNames = this.configurations
      .filter(config => this.selectedIds.has(config.id))
      .map(config => config.name);

    const confirmMessage = this.selectedIds.size === 1
      ? `Are you sure you want to delete the configuration "${configNames[0]}"?`
      : `Are you sure you want to delete ${this.selectedIds.size} configurations?\n\n${configNames.join('\n')}`;

    if (!confirm(confirmMessage)) return;

    this.isDeleting = true;
    this.render();

    try {
      const result = await configurationService.deleteMultipleConfigurations(
        this.applicationId,
        Array.from(this.selectedIds)
      );

      // Dispatch success event
      this.dispatchEvent(new CustomEvent('configurations-deleted', {
        detail: { count: result.deleted_count },
        bubbles: true
      }));

      // Reload configurations
      await this.loadConfigurations();
    } catch (error) {
      console.error('Failed to delete configurations:', error);
      this.error = 'Failed to delete configurations. Please try again.';
      this.render();
    } finally {
      this.isDeleting = false;
    }
  };

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatConfig(config: Record<string, any>): string {
    const keys = Object.keys(config);
    if (keys.length === 0) return 'Empty configuration';
    if (keys.length <= 3) return keys.join(', ');
    return `${keys.slice(0, 3).join(', ')} +${keys.length - 3} more`;
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

    const hasConfigurations = this.configurations.length > 0;
    const hasSelected = this.selectedIds.size > 0;
    const allSelected = hasConfigurations && this.configurations.every(config => this.selectedIds.has(config.id));
    const someSelected = hasConfigurations && this.configurations.some(config => this.selectedIds.has(config.id));

    this.innerHTML = `
      <div class="configurations-list">
        <div class="list-header">
          <div class="header-actions">
            <div class="search-container">
              <input
                type="text"
                class="search-input"
                placeholder="Search configurations..."
                value="${this.searchQuery}"
                ${this.isDeleting ? 'disabled' : ''}
              >
            </div>
            <button
              class="btn btn-primary"
              ${this.isDeleting ? 'disabled' : ''}
            >
              <span class="btn-icon">+</span>
              New Configuration
            </button>
          </div>
          
          ${hasSelected ? `
            <div class="bulk-actions">
              <span class="selection-count">${this.selectedIds.size} selected</span>
              <button
                class="btn btn-danger btn-sm"
                ${this.isDeleting ? 'disabled' : ''}
              >
                ${this.isDeleting ? 'Deleting...' : `Delete Selected (${this.selectedIds.size})`}
              </button>
            </div>
          ` : ''}
        </div>

        ${hasConfigurations ? `
          <div class="table-container">
            <table class="configurations-table">
              <thead>
                <tr>
                  <th class="select-column">
                    <input
                      type="checkbox"
                      class="select-all-checkbox"
                      ${allSelected ? 'checked' : ''}
                      ${someSelected && !allSelected ? 'indeterminate' : ''}
                      ${this.isDeleting ? 'disabled' : ''}
                    >
                  </th>
                  <th>Name</th>
                  <th>Configuration Keys</th>
                  <th>Comments</th>
                  <th>Updated</th>
                  <th class="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.configurations.map(config => `
                  <tr class="${this.selectedIds.has(config.id) ? 'selected' : ''}">
                    <td class="select-column">
                      <input
                        type="checkbox"
                        class="select-checkbox"
                        data-config-id="${config.id}"
                        ${this.selectedIds.has(config.id) ? 'checked' : ''}
                        ${this.isDeleting ? 'disabled' : ''}
                      >
                    </td>
                    <td class="config-name">
                      <strong>${config.name}</strong>
                    </td>
                    <td class="config-keys">
                      ${this.formatConfig(config.config)}
                    </td>
                    <td class="config-comments">
                      ${config.comments || '<em>No comments</em>'}
                    </td>
                    <td class="config-updated">
                      ${this.formatDate(config.updated_at)}
                    </td>
                    <td class="actions-column">
                      <div class="action-buttons">
                        <button
                          class="btn btn-sm btn-secondary"
                          data-config-id="${config.id}"
                          ${this.isDeleting ? 'disabled' : ''}
                        >
                          View
                        </button>
                        <button
                          class="btn btn-sm btn-primary"
                          data-config-id="${config.id}"
                          ${this.isDeleting ? 'disabled' : ''}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">⚙️</div>
            <h3>No Configurations</h3>
            <p>This application doesn't have any configurations yet.</p>
            <button class="btn btn-primary">
              <span class="btn-icon">+</span>
              Create First Configuration
            </button>
          </div>
        `}
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners() {
    // Search input
    const searchInput = this.$('.search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', this.handleSearch);
    }

    // Create button
    const createButtons = this.$$('.btn:not(.btn-danger):not(.btn-sm)');
    createButtons.forEach(button => {
      if (button.textContent?.includes('New Configuration') || button.textContent?.includes('Create First Configuration')) {
        button.addEventListener('click', this.handleCreateConfiguration);
      }
    });

    // Select all checkbox
    const selectAllCheckbox = this.$('.select-all-checkbox') as HTMLInputElement;
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', this.handleSelectAll);
      
      // Set indeterminate state
      const someSelected = this.configurations.some(config => this.selectedIds.has(config.id));
      const allSelected = this.configurations.every(config => this.selectedIds.has(config.id));
      selectAllCheckbox.indeterminate = someSelected && !allSelected;
    }

    // Individual checkboxes
    const checkboxes = this.$$('.select-checkbox') as NodeListOf<HTMLInputElement>;
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', this.handleSelectConfiguration);
    });

    // Action buttons
    const viewButtons = this.$$('.btn-secondary[data-config-id]') as NodeListOf<HTMLButtonElement>;
    viewButtons.forEach(button => {
      button.addEventListener('click', () => {
        const configId = button.dataset.configId!;
        this.handleViewConfiguration(configId);
      });
    });

    const editButtons = this.$$('.btn-primary[data-config-id]') as NodeListOf<HTMLButtonElement>;
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const configId = button.dataset.configId!;
        this.handleEditConfiguration(configId);
      });
    });

    // Delete selected button
    const deleteButton = this.$('.btn-danger');
    if (deleteButton) {
      deleteButton.addEventListener('click', this.handleDeleteSelected);
    }
  }

  static get styles() {
    return `
      .configurations-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .list-header {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .header-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--spacing-md);
      }

      .search-container {
        flex: 1;
        max-width: 400px;
      }

      .search-input {
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-md);
        border: var(--border-width) solid var(--color-border);
        border-radius: var(--border-radius);
        font-size: var(--font-size-base);
      }

      .search-input:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px var(--color-primary-light);
      }

      .bulk-actions {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-sm) var(--spacing-md);
        background-color: var(--color-primary-light);
        border-radius: var(--border-radius);
      }

      .selection-count {
        font-weight: 500;
        color: var(--color-primary-dark);
      }

      .table-container {
        overflow-x: auto;
        border: var(--border-width) solid var(--color-border);
        border-radius: var(--border-radius);
      }

      .configurations-table {
        width: 100%;
        border-collapse: collapse;
        background-color: var(--color-white);
      }

      .configurations-table th,
      .configurations-table td {
        padding: var(--spacing-md);
        text-align: left;
        border-bottom: var(--border-width) solid var(--color-border-light);
      }

      .configurations-table th {
        background-color: var(--color-background-light);
        font-weight: 600;
        color: var(--color-text-dark);
      }

      .configurations-table tbody tr:hover {
        background-color: var(--color-background-light);
      }

      .configurations-table tbody tr.selected {
        background-color: var(--color-primary-light);
      }

      .select-column {
        width: 40px;
        text-align: center;
      }

      .actions-column {
        width: 140px;
      }

      .config-name strong {
        color: var(--color-text-dark);
      }

      .config-keys {
        font-family: var(--font-family-mono);
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
      }

      .config-comments em {
        color: var(--color-text-muted);
      }

      .config-updated {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
      }

      .action-buttons {
        display: flex;
        gap: var(--spacing-xs);
      }

      .empty-state {
        text-align: center;
        padding: var(--spacing-xxl);
        color: var(--color-text-muted);
      }

      .empty-state-icon {
        font-size: 4rem;
        margin-bottom: var(--spacing-lg);
      }

      .empty-state h3 {
        margin: 0 0 var(--spacing-md) 0;
        color: var(--color-text-dark);
      }

      .empty-state p {
        margin: 0 0 var(--spacing-lg) 0;
      }

      @media (max-width: 768px) {
        .header-actions {
          flex-direction: column;
          align-items: stretch;
        }

        .search-container {
          max-width: none;
        }

        .bulk-actions {
          flex-direction: column;
          align-items: stretch;
          text-align: center;
        }

        .configurations-table {
          font-size: var(--font-size-sm);
        }

        .configurations-table th,
        .configurations-table td {
          padding: var(--spacing-sm);
        }

        .action-buttons {
          flex-direction: column;
        }
      }
    `;
  }
}

customElements.define('configuration-list', ConfigurationList);