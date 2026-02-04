// Import all components to register them
import './components/base/loading-spinner';
import './components/base/error-message';
import './components/layout/app-layout';
import './components/layout/app-header';
import './components/layout/app-navigation';
import './components/applications/application-list';
import './components/applications/application-form';
import './components/applications/application-detail';
import './components/auth/login-form';
import './components/auth/oauth-callback';

import { AuthService } from './services/auth-service';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  console.log('Config Service Admin UI loaded');
  
  const authService = new AuthService();
  
  // Handle OAuth callback route
  if (window.location.pathname === '/auth/callback') {
    showOAuthCallback();
    return;
  }
  
  // Check authentication status and show appropriate UI
  if (authService.isAuthenticated()) {
    showMainApp();
  } else {
    showLoginForm();
  }
  
  // Handle authentication events
  window.addEventListener('auth:login-success', () => {
    showMainApp();
  });
  
  window.addEventListener('auth:logged-out', () => {
    showLoginForm();
  });
  
  window.addEventListener('auth:token-expired', () => {
    showLoginForm();
  });
  
  // Handle global navigation events
  document.addEventListener('app-navigate', (event: Event) => {
    const customEvent = event as CustomEvent;
    const { path } = customEvent.detail;
    window.location.hash = path;
  });
  
  // Handle global error events
  document.addEventListener('app-error', (event: Event) => {
    const customEvent = event as CustomEvent;
    const { message } = customEvent.detail;
    console.error('Application error:', message);
    
    // Show error notification (could be enhanced with a toast system)
    const errorElement = document.createElement('error-message');
    errorElement.setAttribute('message', message);
    errorElement.setAttribute('type', 'error');
    
    // Add to top of body temporarily
    document.body.insertBefore(errorElement, document.body.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      errorElement.remove();
    }, 5000);
  });
  
  // Handle global success events
  document.addEventListener('app-success', (event: Event) => {
    const customEvent = event as CustomEvent;
    const { message } = customEvent.detail;
    console.log('Application success:', message);
    
    // Show success notification
    const successElement = document.createElement('error-message');
    successElement.setAttribute('message', message);
    successElement.setAttribute('type', 'info');
    
    document.body.insertBefore(successElement, document.body.firstChild);
    
    setTimeout(() => {
      successElement.remove();
    }, 3000);
  });
});

function showLoginForm() {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = '<login-form></login-form>';
  }
}

function showMainApp() {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = '<app-layout></app-layout>';
  }
}

function showOAuthCallback() {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = '<oauth-callback></oauth-callback>';
  }
}