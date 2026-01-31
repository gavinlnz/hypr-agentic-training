// Component-specific types and interfaces

export interface ComponentState {
  isLoading: boolean;
  error?: string;
}

export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface NavigationItem {
  path: string;
  label: string;
  icon?: string;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

// Custom event types
export interface CustomEventMap {
  'app-navigate': CustomEvent<{ path: string }>;
  'app-error': CustomEvent<{ message: string }>;
  'app-success': CustomEvent<{ message: string }>;
  'form-submit': CustomEvent<{ data: any }>;
  'form-cancel': CustomEvent<void>;
  'confirm-dialog': CustomEvent<{ confirmed: boolean }>;
}

// Extend HTMLElement to include custom events
declare global {
  interface HTMLElement {
    addEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: (this: HTMLElement, ev: CustomEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ): void;
    
    dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): boolean;
  }
}