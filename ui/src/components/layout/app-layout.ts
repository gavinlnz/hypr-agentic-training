import { BaseComponent } from '../base/base-component';

export class AppLayout extends BaseComponent {
  private currentRoute = '';

  connectedCallback(): void {
    super.connectedCallback();
    this.handleRouteChange();
    window.addEventListener('hashchange', () => this.handleRouteChange());
  }

  protected render(): void {
    const template = this.createTemplate(
      `
      <div class="app-layout">
        <app-header></app-header>
        <div class="app-body">
          <app-navigation></app-navigation>
          <main class="app-main" role="main">
            <div class="main-content">
              ${this.renderCurrentRoute()}
            </div>
          </main>
        </div>
      </div>
      `,
      `
      .app-layout {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background-color: var(--color-bg-secondary);
      }

      .app-body {
        flex: 1;
        display: flex;
      }

      .app-main {
        flex: 1;
        padding: var(--spacing-lg);
        overflow-y: auto;
      }

      .main-content {
        max-width: 1200px;
        margin: 0 auto;
      }

      @media (max-width: 768px) {
        .app-body {
          flex-direction: column;
        }
        
        .app-main {
          padding: var(--spacing-md);
        }
      }
      `
    );

    this.shadow.innerHTML = '';
    this.shadow.appendChild(template.content.cloneNode(true));
  }

  private handleRouteChange(): void {
    const hash = window.location.hash.slice(1) || '/';
    if (hash !== this.currentRoute) {
      this.currentRoute = hash;
      this.render();
    }
  }

  private renderCurrentRoute(): string {
    const route = this.currentRoute;
    
    if (route === '/' || route === '/applications') {
      return '<application-list></application-list>';
    }
    
    if (route.startsWith('/applications/new')) {
      return '<application-form mode="create"></application-form>';
    }
    
    if (route.startsWith('/applications/') && route.endsWith('/edit')) {
      const id = route.split('/')[2];
      return `<application-form mode="edit" application-id="${id}"></application-form>`;
    }
    
    // Configuration routes
    if (route.match(/^\/applications\/[^\/]+\/configurations\/new$/)) {
      const applicationId = route.split('/')[2];
      return `<configuration-form application-id="${applicationId}" mode="create"></configuration-form>`;
    }
    
    if (route.match(/^\/applications\/[^\/]+\/configurations\/[^\/]+\/edit$/)) {
      const parts = route.split('/');
      const applicationId = parts[2];
      const configurationId = parts[4];
      return `<configuration-form application-id="${applicationId}" configuration-id="${configurationId}" mode="edit"></configuration-form>`;
    }
    
    if (route.match(/^\/applications\/[^\/]+\/configurations\/[^\/]+$/)) {
      const parts = route.split('/');
      const applicationId = parts[2];
      const configurationId = parts[4];
      return `<configuration-detail application-id="${applicationId}" configuration-id="${configurationId}"></configuration-detail>`;
    }
    
    if (route.startsWith('/applications/')) {
      const id = route.split('/')[2];
      return `<application-detail application-id="${id}"></application-detail>`;
    }
    
    // Default/404
    return `
      <div class="not-found">
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="#/">Go back to Applications</a>
      </div>
    `;
  }
}

customElements.define('app-layout', AppLayout);