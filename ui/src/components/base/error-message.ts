import { BaseComponent } from './base-component';

export class ErrorMessage extends BaseComponent {
  static get observedAttributes(): string[] {
    return ['message', 'type'];
  }

  get message(): string {
    return this.getAttribute('message') || '';
  }

  get type(): string {
    return this.getAttribute('type') || 'error';
  }

  protected render(): void {
    if (!this.message) {
      this.shadow.innerHTML = '';
      return;
    }

    const template = this.createTemplate(
      `
      <div class="error-message" role="alert" aria-live="polite">
        <div class="error-icon">
          ${this.getIcon()}
        </div>
        <div class="error-content">
          <p class="error-text">${this.message}</p>
        </div>
        <button class="error-close" aria-label="Close error message">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      `,
      `
      .error-message {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid var(--error-border);
        background-color: var(--error-bg);
        color: var(--error-text);
        margin: 16px 0;
      }

      .error-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        margin-top: 2px;
      }

      .error-content {
        flex: 1;
      }

      .error-text {
        margin: 0;
        font-size: 14px;
        line-height: 1.4;
      }

      .error-close {
        flex-shrink: 0;
        background: none;
        border: none;
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        color: var(--error-text);
        opacity: 0.7;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .error-close:hover {
        opacity: 1;
      }

      :host {
        --error-bg: var(--color-error-bg, #fef2f2);
        --error-border: var(--color-error-border, #fecaca);
        --error-text: var(--color-error-text, #dc2626);
      }

      :host([type="warning"]) {
        --error-bg: var(--color-warning-bg, #fffbeb);
        --error-border: var(--color-warning-border, #fed7aa);
        --error-text: var(--color-warning-text, #d97706);
      }

      :host([type="info"]) {
        --error-bg: var(--color-info-bg, #eff6ff);
        --error-border: var(--color-info-border, #bfdbfe);
        --error-text: var(--color-info-text, #2563eb);
      }
      `
    );

    this.shadow.innerHTML = '';
    this.shadow.appendChild(template.content.cloneNode(true));
  }

  protected setupEventListeners(): void {
    const closeButton = this.$('.error-close');
    closeButton?.addEventListener('click', () => {
      this.remove();
    });
  }

  private getIcon(): string {
    switch (this.type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'error':
      default:
        return '❌';
    }
  }

  attributeChangedCallback(): void {
    this.render();
  }
}

customElements.define('error-message', ErrorMessage);