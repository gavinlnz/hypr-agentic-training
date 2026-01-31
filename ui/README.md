# Config Service Admin UI

A modern admin web interface for the Config Service API built with native Web Components and TypeScript.

## Features

- **Zero External Frameworks**: Built with native Web Components and TypeScript
- **Responsive Design**: Mobile-first design that works on all devices
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA labels and keyboard navigation
- **Type Safety**: Full TypeScript implementation with strict mode
- **Modern Tooling**: Vite for development, ESLint/Prettier for code quality
- **Comprehensive Testing**: Unit tests with Vitest, E2E tests with Playwright

## Technology Stack

- **TypeScript 5.3+**: Type-safe development
- **Web Components**: Native browser component system
- **Vite**: Fast development server and build tool
- **Vitest**: Unit testing framework
- **Playwright**: End-to-end testing
- **ESLint + Prettier**: Code quality and formatting

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open browser to http://localhost:3000
```

### Development

```bash
# Start development server with hot reload
pnpm dev

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

### Testing

```bash
# Run unit tests
pnpm test

# Run unit tests with UI
pnpm test:ui

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

### Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── components/          # Web Components
│   ├── base/           # Base components (loading, error, etc.)
│   ├── layout/         # Layout components (header, nav, etc.)
│   └── applications/   # Application-specific components
├── services/           # API services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── styles/             # Global styles and CSS variables
```

## Architecture

### Component System

The UI is built using native Web Components with a base class that provides:

- Shadow DOM encapsulation
- State management
- Event handling
- Async operation handling
- Common utilities

### Service Layer

API communication is handled through service classes that:

- Provide type-safe API methods
- Handle errors consistently
- Abstract HTTP details from components

### Styling

CSS is organized using:

- CSS custom properties for theming
- Shadow DOM for component encapsulation
- Responsive design with CSS Grid/Flexbox
- Utility classes for common patterns

### Routing

Simple hash-based routing without external dependencies:

- Client-side navigation
- Route parameter extraction
- Navigation state management

## API Integration

The UI connects to the Config Service API at `/api/v1` with endpoints for:

- **Applications**: CRUD operations for applications
- **Configurations**: CRUD operations for configurations (when implemented)

## Accessibility

The UI follows WCAG 2.1 AA guidelines:

- Semantic HTML structure
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Ensure accessibility compliance
4. Update documentation as needed

## License

MIT