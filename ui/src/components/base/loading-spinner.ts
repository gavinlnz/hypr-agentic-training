import { BaseComponent } from './base-component';

export class LoadingSpinner extends BaseComponent {
  static get observedAttributes(): string[] {
    return ['size', 'color'];
  }

  get size(): string {
    return this.getAttribute('size') || 'medium';
  }

  get color(): string {
    return this.getAttribute('color') || 'primary';
  }

  protected render(): void {
    const template = this.createTemplate(
      `
      <div class="spinner" role="status" aria-label="Loading">
        <div class="spinner-circle"></div>
        <span class="sr-only">Loading...</span>
      </div>
      `,
      `
      .spinner {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .spinner-circle {
        width: var(--spinner-size);
        height: var(--spinner-size);
        border: 2px solid var(--color-border);
        border-top: 2px solid var(--spinner-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      :host {
        --spinner-size: ${this.getSizeValue()};
        --spinner-color: var(--color-${this.color});
      }
      `
    );

    this.shadow.innerHTML = '';
    this.shadow.appendChild(template.content.cloneNode(true));
  }

  private getSizeValue(): string {
    switch (this.size) {
      case 'small':
        return '16px';
      case 'large':
        return '48px';
      case 'medium':
      default:
        return '24px';
    }
  }

  attributeChangedCallback(): void {
    this.render();
  }
}

customElements.define('loading-spinner', LoadingSpinner);