# User Timezone Selector Feature

**Context/Goal**: 
Users need to view timestamps in their preferred local timezone instead of the system default or UTC. This feature adds a timezone selector to the user profile page and updates the timestamp rendering logic to use the selected timezone.

## Acceptance Criteria
- [x] **AC1**: The User Profile page contains a Timezone selector dropdown with common timezones.
  - *Validation*: Manual UI verification on the user profile page.
- [x] **AC2**: The selected timezone is stored (e.g., in localStorage or user settings service) and persists across page reloads.
  - *Validation*: Select a timezone, reload the page, and ensure the selection remains.
- [x] **AC3**: Application Timestamps (Created At, Last Modified) on the Applications grid and Edit form are displayed using the user's selected timezone.
  - *Validation*: Change the timezone in the profile and verify that the application timestamps update accordingly.
- [x] **AC4**: UI unit/integration tests are updated to verify timezone formatting logic.
  - *Validation*: Run `npm run test` in the `ui` directory.
  
## Implementation Steps
1. **Timezone Service / State**:
   - Create a state management mechanism (or use existing) to store the user's timezone preference (e.g., `localStorage`).
   
2. **UI Updates (User Profile Page)**:
   - Identify or create the user profile component.
   - Add a dropdown selector for timezones.

3. **Time Formatter Updates**:
   - Update `BaseComponent.formatDate` (or wherever date formatting lives) to respect the user's timezone preference instead of always defaulting to local browser time.

4. **Update UI Tests**:
   - Update relevant tests to ensure the date formatter uses the injected/stored timezone.
