import { BaseComponent } from '../base/base-component';
import { getAllTimezones, getUserTimezone, setUserTimezone } from '../../utils/timezone';

export class UserProfile extends BaseComponent {
  private selectedTimezone: string = getUserTimezone();

  protected render(): void {
    const template = this.createTemplate(
      `
      <div class="profile-container">
        <h1 class="page-title">Profile Settings</h1>
        
        <div class="settings-card">
          <h2 class="card-title">Preferences</h2>
          
          <form id="profile-form" class="settings-form">
            <div class="form-group">
              <label for="timezone-select" class="form-label">Timezone Display</label>
              <select id="timezone-select" class="form-select">
                ${getAllTimezones().map(tz =>
        `<option value="${tz.value}" ${this.selectedTimezone === tz.value ? 'selected' : ''}>
                    ${tz.label}
                  </option>`
      ).join('')}
              </select>
              <div class="form-help">Choose how dates and times are displayed throughout the application.</div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Save Preferences</button>
            </div>
          </form>
        </div>
      </div>
      `,
      `
      .profile-container {
        max-width: 800px;
        margin: 0 auto;
      }

      .page-title {
        margin: 0 0 var(--spacing-xl) 0;
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .settings-card {
        background-color: var(--color-bg-primary);
        border: var(--border-width) solid var(--color-border);
        border-radius: var(--border-radius-lg);
        padding: var(--spacing-xl);
        box-shadow: var(--shadow-sm);
      }

      .card-title {
        margin: 0 0 var(--spacing-lg) 0;
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        border-bottom: var(--border-width) solid var(--color-border-light);
        padding-bottom: var(--spacing-sm);
      }

      .settings-form {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .form-label {
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
      }

      .form-select {
        padding: var(--spacing-sm);
        border: var(--border-width) solid var(--color-border);
        border-radius: var(--border-radius-md);
        font-size: var(--font-size-base);
        background-color: var(--color-bg-primary);
        color: var(--color-text-primary);
        max-width: 400px;
      }

      .form-select:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px var(--color-primary-light);
      }

      .form-help {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
      }

      .form-actions {
        margin-top: var(--spacing-md);
      }

      .btn {
        padding: var(--spacing-sm) var(--spacing-xl);
        border: none;
        border-radius: var(--border-radius-md);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: background-color var(--transition-fast);
      }

      .btn-primary {
        background-color: var(--color-primary);
        color: white;
      }

      .btn-primary:hover {
        background-color: var(--color-primary-hover);
      }
      `
    );

    this.shadow.innerHTML = '';
    this.shadow.appendChild(template.content.cloneNode(true));
  }

  protected setupEventListeners(): void {
    const form = this.$('#profile-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const select = this.$('#timezone-select') as HTMLSelectElement;
        const newTimezone = select.value;

        setUserTimezone(newTimezone);
        this.selectedTimezone = newTimezone;

        // Notify application that timezone changed to trigger re-renders
        this.emit('app-timezone-changed', { timezone: newTimezone });

        // Show success notification
        this.emit('app-success', { message: 'Preferences saved successfully' });
      });
    }
  }
}

customElements.define('user-profile', UserProfile);
