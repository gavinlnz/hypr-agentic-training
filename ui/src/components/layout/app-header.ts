import { BaseComponent } from '../base/base-component';

export class AppHeader extends BaseComponent {
  protected render(): void {
    const template = this.createTemplate(
      `
      <header class="app-header">
        <div class="header-content">
          <div class="header-brand">
            <h1 class="brand-title">
              <a href="#/" class="brand-link">Config Service Admin</a>
            </h1>
          </div>
          <nav class="header-nav" role="navigation" aria-label="Main navigation">
            <ul class="nav-list">
              <li class="nav-item">
                <a href="#/" class="nav-link" data-route="/">Applications</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      `,
      `
      .app-header {
        background-color: var(--color-bg-primary);
        border-bottom: var(--border-width) solid var(--color-border);
        box-shadow: var(--shadow-sm);
        position: sticky;
        top: 0;
        z-index: var(--z-sticky);
      }

      .header-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 var(--spacing-lg);
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 64px;
      }

      .header-brand {
        flex-shrink: 0;
      }

      .brand-title {
        margin: 0;
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-bold);
      }

      .brand-link {
        color: var(--color-text-primary);
        text-decoration: none;
        transition: color var(--transition-fast);
      }

      .brand-link:hover {
        color: var(--color-primary);
        text-decoration: none;
      }

      .header-nav {
        flex: 1;
        margin-left: var(--spacing-xl);
      }

      .nav-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        gap: var(--spacing-lg);
      }

      .nav-item {
        margin: 0;
      }

      .nav-link {
        color: var(--color-text-secondary);
        text-decoration: none;
        font-weight: var(--font-weight-medium);
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius-md);
        transition: all var(--transition-fast);
        position: relative;
      }

      .nav-link:hover {
        color: var(--color-primary);
        background-color: var(--color-primary-light);
        text-decoration: none;
      }

      .nav-link.active {
        color: var(--color-primary);
        background-color: var(--color-primary-light);
      }

      @media (max-width: 768px) {
        .header-content {
          padding: 0 var(--spacing-md);
          height: 56px;
        }

        .brand-title {
          font-size: var(--font-size-lg);
        }

        .header-nav {
          margin-left: var(--spacing-md);
        }

        .nav-list {
          gap: var(--spacing-md);
        }

        .nav-link {
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
    this.$$('.nav-link').forEach(link => {
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
    
    this.$$('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentHash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}

customElements.define('app-header', AppHeader);