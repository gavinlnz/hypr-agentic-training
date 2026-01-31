import { BaseComponent } from '../base/base-component';

export class AppNavigation extends BaseComponent {
  protected render(): void {
    const template = this.createTemplate(
      `
      <nav class="app-navigation" role="navigation" aria-label="Sidebar navigation">
        <div class="nav-section">
          <h3 class="nav-section-title">Management</h3>
          <ul class="nav-menu">
            <li class="nav-menu-item">
              <a href="#/" class="nav-menu-link" data-route="/">
                <span class="nav-icon">📱</span>
                <span class="nav-text">Applications</span>
              </a>
            </li>
          </ul>
        </div>
        
        <div class="nav-section">
          <h3 class="nav-section-title">Quick Actions</h3>
          <ul class="nav-menu">
            <li class="nav-menu-item">
              <a href="#/applications/new" class="nav-menu-link" data-route="/applications/new">
                <span class="nav-icon">➕</span>
                <span class="nav-text">New Application</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>
      `,
      `
      .app-navigation {
        width: 240px;
        background-color: var(--color-bg-primary);
        border-right: var(--border-width) solid var(--color-border);
        padding: var(--spacing-lg);
        overflow-y: auto;
        flex-shrink: 0;
      }

      .nav-section {
        margin-bottom: var(--spacing-xl);
      }

      .nav-section:last-child {
        margin-bottom: 0;
      }

      .nav-section-title {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0 0 var(--spacing-md) 0;
        padding: 0 var(--spacing-sm);
      }

      .nav-menu {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .nav-menu-item {
        margin-bottom: var(--spacing-xs);
      }

      .nav-menu-link {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm);
        color: var(--color-text-secondary);
        text-decoration: none;
        border-radius: var(--border-radius-md);
        transition: all var(--transition-fast);
        font-weight: var(--font-weight-medium);
      }

      .nav-menu-link:hover {
        color: var(--color-primary);
        background-color: var(--color-primary-light);
        text-decoration: none;
      }

      .nav-menu-link.active {
        color: var(--color-primary);
        background-color: var(--color-primary-light);
      }

      .nav-icon {
        font-size: var(--font-size-base);
        width: 20px;
        text-align: center;
        flex-shrink: 0;
      }

      .nav-text {
        flex: 1;
      }

      @media (max-width: 768px) {
        .app-navigation {
          width: 100%;
          border-right: none;
          border-bottom: var(--border-width) solid var(--color-border);
          padding: var(--spacing-md);
        }

        .nav-section {
          margin-bottom: var(--spacing-lg);
        }

        .nav-menu {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
        }

        .nav-menu-item {
          margin-bottom: 0;
        }

        .nav-menu-link {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: var(--font-size-sm);
        }
      }
      `
    );

    this.shadow.innerHTML = '';
    this.shadow.appendChild(template.content.cloneNode(true));
    this.updateActiveNavLink();
  }

  protected setupEventListeners(): void {
    // Update active nav link on hash change
    window.addEventListener('hashchange', () => {
      this.updateActiveNavLink();
    });

    // Handle nav link clicks
    this.$$('.nav-menu-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = (e.target as HTMLAnchorElement).getAttribute('href');
        if (href) {
          window.location.hash = href.slice(1);
        }
      });
    });
  }

  private updateActiveNavLink(): void {
    const currentHash = window.location.hash || '#/';
    
    this.$$('.nav-menu-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentHash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}

customElements.define('app-navigation', AppNavigation);