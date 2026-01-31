import type { ComponentState } from '@/types/components';

export abstract class BaseComponent extends HTMLElement {
  protected shadow: ShadowRoot;
  protected state: ComponentState = {
    isLoading: false,
    error: undefined,
  };

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback(): void {
    this.cleanup();
  }

  protected abstract render(): void;
  
  protected setupEventListeners(): void {
    // Override in subclasses
  }

  protected cleanup(): void {
    // Override in subclasses for cleanup
  }

  protected setState(newState: Partial<ComponentState>): void {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  protected createTemplate(html: string, styles?: string): HTMLTemplateElement {
    const template = document.createElement('template');
    template.innerHTML = `
      ${styles ? `<style>${styles}</style>` : ''}
      ${html}
    `;
    return template;
  }

  protected $(selector: string): Element | null {
    return this.shadow.querySelector(selector);
  }

  protected $$(selector: string): NodeListOf<Element> {
    return this.shadow.querySelectorAll(selector);
  }

  protected emit<T>(eventName: string, detail?: T): void {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  protected async handleAsync<T>(
    asyncFn: () => Promise<T>,
    errorMessage = 'An error occurred'
  ): Promise<T | null> {
    try {
      this.setState({ isLoading: true, error: undefined });
      const result = await asyncFn();
      this.setState({ isLoading: false });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : errorMessage;
      this.setState({ isLoading: false, error: message });
      this.emit('app-error', { message });
      return null;
    }
  }

  protected formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}