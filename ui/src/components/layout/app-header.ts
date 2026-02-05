import { BaseComponent } from '../base/base-component';
import { AuthService } from '../../services/auth-service';

export class AppHeader extends BaseComponent {
  private authService = new AuthService();

  protected render(): void {
    const user = this.authService.getUserInfo();
    
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
          <div class="header-user">
            ${this.renderUserProfile(user)}
          </div>
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
        color: #4b5563;
        text-decoration: none;
        font-weight: 500;
        padding: 8px 16px;
        border-radius: 6px;
        position: relative;
        background-color: transparent;
        transition: none;
      }

      .nav-link:hover {
        color: #2563eb !important;
        background-color: #dbeafe !important;
        text-decoration: none !important;
        transition: all 0.15s ease-in-out !important;
      }

      .nav-link.active {
        color: var(--color-primary);
        background-color: var(--color-primary-light);
      }

      .header-user {
        flex-shrink: 0;
        position: relative;
      }

      .user-profile {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius-md);
        cursor: pointer;
        background-color: transparent;
      }

      .user-profile:hover {
        background-color: #f3f4f6;
      }

      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: var(--color-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: var(--font-weight-semibold);
        font-size: var(--font-size-sm);
        overflow: hidden;
      }

      .user-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .user-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }

      .user-name {
        font-weight: var(--font-weight-medium);
        font-size: var(--font-size-sm);
        color: var(--color-text-primary);
        margin: 0;
        line-height: 1.2;
      }

      .user-role {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        margin: 0;
        line-height: 1.2;
      }

      .user-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background-color: var(--color-bg-primary);
        border: var(--border-width) solid var(--color-border);
        border-radius: var(--border-radius-md);
        box-shadow: var(--shadow-lg);
        min-width: 200px;
        z-index: 1000;
        display: none;
        margin-top: var(--spacing-xs);
      }

      .user-dropdown.show {
        display: block;
      }

      .dropdown-header {
        padding: var(--spacing-md);
        border-bottom: var(--border-width) solid var(--color-border-light);
      }

      .dropdown-user-name {
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        margin: 0 0 var(--spacing-xs) 0;
      }

      .dropdown-user-email {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
        margin: 0;
      }

      .dropdown-menu {
        list-style: none;
        margin: 0;
        padding: var(--spacing-xs) 0;
      }

      .dropdown-item {
        margin: 0;
      }

      .dropdown-link {
        display: block;
        padding: var(--spacing-sm) var(--spacing-md);
        color: var(--color-text-primary);
        text-decoration: none;
        font-size: var(--font-size-sm);
        border: none;
        background: transparent;
        width: 100%;
        text-align: left;
        cursor: pointer;
      }

      .dropdown-link:hover {
        background-color: #f3f4f6;
        text-decoration: none;
      }

      .dropdown-link.danger {
        color: var(--color-error);
      }

      .dropdown-link.danger:hover {
        background-color: #fef2f2;
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

        .user-info {
          display: none;
        }

        .user-dropdown {
          min-width: 180px;
        }
      }
      `
    );

    this.shadow.innerHTML = '';
    this.shadow.appendChild(template.content.cloneNode(true));
    this.updateActiveNavLink();
    this.setupUserDropdown();
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
        const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
        if (href) {
          window.location.hash = href.slice(1);
        }
      });
    });

    // Listen for auth events to update user profile
    window.addEventListener('auth:login-success', () => {
      this.render();
    });

    window.addEventListener('auth:logged-out', () => {
      this.render();
    });
  }

  private renderUserProfile(user: any): string {
    if (!user) {
      return '<div class="user-profile">Not logged in</div>';
    }

    // Debug logging
    console.log('User data in header:', user);

    // Handle missing properties with better fallbacks
    const userName = user.name || user.email || user.login || 'User';
    const userRole = user.role || 'User';
    const userEmail = user.email || 'No email';
    const avatarUrl = user.avatarUrl || user.avatar_url;

    console.log('Avatar URL found:', avatarUrl);

    const initials = this.getInitials(userName);
    const avatarContent = avatarUrl 
      ? `<img src="${avatarUrl}" alt="${userName}" onerror="this.style.display='none'; this.parentElement.innerHTML='${initials}'">`
      : initials;

    return `
      <div class="user-profile" id="userProfile">
        <div class="user-avatar">
          ${avatarContent}
        </div>
        <div class="user-info">
          <div class="user-name">${userName}</div>
          <div class="user-role">${userRole}</div>
        </div>
        <div class="user-dropdown" id="userDropdown">
          <div class="dropdown-header">
            <div class="dropdown-user-name">${userName}</div>
            <div class="dropdown-user-email">${userEmail}</div>
          </div>
          <ul class="dropdown-menu">
            <li class="dropdown-item">
              <a href="#/profile" class="dropdown-link">Profile Settings</a>
            </li>
            <li class="dropdown-item">
              <button type="button" class="dropdown-link danger" id="logoutBtn">
                Sign Out
              </button>
            </li>
          </ul>
        </div>
      </div>
    `;
  }

  private getInitials(name: string): string {
    if (!name) return 'U';
    
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  }

  private setupUserDropdown(): void {
    const userProfile = this.$('#userProfile');
    const userDropdown = this.$('#userDropdown');
    const logoutBtn = this.$('#logoutBtn');

    if (userProfile && userDropdown) {
      // Toggle dropdown on profile click
      userProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        // Don't close if clicking the logout button
        if (e.target !== logoutBtn) {
          userDropdown.classList.remove('show');
        }
      });

      // Don't close dropdown when clicking inside it (except logout button)
      userDropdown.addEventListener('click', (e) => {
        if (e.target !== logoutBtn) {
          e.stopPropagation();
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Close dropdown immediately
        if (userDropdown) {
          userDropdown.classList.remove('show');
        }
        
        try {
          await this.authService.logout();
        } catch (error) {
          // Logout errors are handled by the auth service
          // The finally block will still clear session data
        }
      });
    }
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