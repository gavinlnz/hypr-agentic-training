# Application Timestamps Feature

**Context/Goal**: 
Users need to see when applications were created and last modified to help manage their lifecycle. This story adds visibility to the `created_at` and `updated_at` properties of the `Application` model in the UI.

## Acceptance Criteria
- [x] **AC1**: The Applications grid (`application-list.ts`) displays a new column titled "Last Modified" showing the formatted `updated_at` date.
  - *Validation*: Manual UI verification on `http://localhost:3001` - grid rendering correctly shows the date.
- [x] **AC2**: The Edit Application page (`application-form.ts` or `application-detail.ts`) displays read-only labels showing the literal Date/Time for both Created At and Last Modified.
  - *Validation*: Manual UI verification on the edit page.
- [x] **AC3**: UI unit tests for the Application grid and Edit form pass and correctly assert the presence of timestamps.
  - *Validation*: Run `npm run test` in the `ui` directory.
  
## Implementation Steps
1. **API / Backend Verification**:
   - The `.NET` API correctly tracks and returns `CreatedAt` / `UpdatedAt`.
   - The UI TypeScript types already represent `created_at` and `updated_at`.

2. **UI Updates (Grid)**:
   - Edit `ui/src/components/applications/application-list.ts`.
   - Add a "Last Modified" cell to the row rendering template, formatting `updated_at` nicely.

3. **UI Updates (Edit Form)**:
   - Edit `ui/src/components/applications/application-form.ts`.
   - If editing an *existing* application, render two read-only elements displaying the `created_at` and `updated_at` values at the bottom of the form or in a metadata sidebar.

4. **Update UI Tests**:
   - Update `ui/src/components/applications/application-list.test.ts` to assert that the "Last Modified" header and cell exist.
   - Update `ui/src/components/applications/application-form.test.ts` to mock existing applications containing timestamps and assert that the read-only labels are rendered.
