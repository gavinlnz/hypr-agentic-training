# Admin UI Implementation Prompt

Create an implementation plan for an admin web interface that provides comprehensive management features for applications and their configurations.

## Requirements

### Core Features
- **Application Management**: Create, read, update, and list applications
- **Configuration Management**: Create, read, update configurations with key-value pairs
- **Relationship Management**: View and manage configurations associated with each application

### API Endpoints Available
Based on the Config Service API with `/api/v1` prefix:

**Applications:**
- `POST /applications` - Create application (name, comments)
- `GET /applications` - List all applications  
- `GET /applications/{id}` - Get application with related configuration IDs
- `PUT /applications/{id}` - Update application (name, comments)

**Configurations (to be implemented):**
- `POST /configurations` - Create configuration (application_id, name, comments, config)
- `GET /configurations/{id}` - Get configuration
- `PUT /configurations/{id}` - Update configuration (name, comments, config)

### Data Models
**Application:**
- `id`: ULID (primary key)
- `name`: string (1-256 chars, unique)
- `comments`: string (0-1024 chars, optional)
- `created_at`, `updated_at`: timestamps

**Configuration:**
- `id`: ULID (primary key)
- `application_id`: ULID (foreign key)
- `name`: string (1-256 chars, unique per application)
- `comments`: string (0-1024 chars, optional)
- `config`: JSON object with key-value pairs
- `created_at`, `updated_at`: timestamps

## Technical Constraints

### Technology Stack
- **Package Manager**: pnpm for dependency management and scripts
- **Languages**: TypeScript, HTML, CSS only (no JavaScript directly)
- **Framework**: Web Components (native browser functionality)
- **HTTP Client**: Native `fetch` API only
- **Styling**: CSS and Shadow DOM only (no external CSS frameworks)
- **Testing**: 
  - Unit testing with Vitest
  - Integration testing with Playwright

### Architecture Requirements
- **No External UI Frameworks**: No React, Vue, Angular, etc.
- **Native Web Standards**: Use only built-in browser APIs
- **Component-Based**: Leverage Web Components for modularity
- **Type Safety**: Full TypeScript implementation
- **Responsive Design**: Mobile-friendly interface

## User Experience Requirements

### Application Management UI
- List view showing all applications with search/filter
- Create form for new applications
- Edit form for existing applications
- Delete confirmation dialogs
- View application details with associated configurations

### Configuration Management UI
- List view of configurations for each application
- Create form for new configurations with dynamic key-value editor
- Edit form for existing configurations
- JSON editor for complex configuration values
- Validation for required fields and data types

### General UX
- Loading states and error handling
- Form validation with clear error messages
- Confirmation dialogs for destructive actions
- Breadcrumb navigation
- Responsive layout for mobile and desktop

## Development Requirements

### Project Structure
- Clear separation of components, services, and utilities
- TypeScript interfaces for all data models
- Comprehensive test coverage (unit and integration)
- Development server with hot reload
- Build process for production deployment

### Code Quality
- ESLint and Prettier configuration
- Type checking with TypeScript strict mode
- Error boundaries and graceful error handling
- Accessibility compliance (ARIA labels, keyboard navigation)

## Questions for Clarification

If you could have 3 additional pieces of information to ensure a working result, what would be most important?

1. **API Base URL Configuration**: How should the UI handle different environments (dev/staging/prod)?
2. **Authentication/Authorization**: Will there be user authentication or is this an internal admin tool?
3. **Data Validation**: Should client-side validation mirror server-side validation rules exactly?

Please create a detailed implementation plan that addresses all these requirements while maintaining simplicity and focusing on core functionality.