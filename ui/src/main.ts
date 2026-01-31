// Import all components to register them
import './components/base/loading-spinner';
import './components/base/error-message';
import './components/layout/app-layout';
import './components/layout/app-header';
import './components/layout/app-navigation';
import './components/applications/application-list';
import './components/applications/application-form';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  console.log('Config Service Admin UI loaded');
  
  // Handle global navigation events
  document.addEventListener('app-navigate', (event: CustomEvent) => {
    const { path } = event.detail;
    window.location.hash = path;
  });
  
  // Handle global error events
  document.addEventListener('app-error', (event: CustomEvent) => {
    const { message } = event.detail;
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
  document.addEventListener('app-success', (event: CustomEvent) => {
    const { message } = event.detail;
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