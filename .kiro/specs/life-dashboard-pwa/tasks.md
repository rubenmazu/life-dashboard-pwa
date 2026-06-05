# Implementation Plan: Life Dashboard PWA

## Overview

A client-side Progressive Web Application with React + TypeScript + Vite, providing Finance Tracker and Habit Tracker modules with multi-user profile support, biometric authentication, and full offline capability. Deployed as static assets with zero backend dependencies.

## Tasks

- [x] 1. Project Setup (Vite, React, TypeScript, Tailwind, PWA plugin, Dexie)
  - [x] 1.1 Initialize Vite project with React and TypeScript template
    - Run `npm create vite@latest` with react-ts template
    - Configure `tsconfig.json` with strict mode, path aliases (`@/` → `src/`)
    - Install core dependencies: `react`, `react-dom`, `react-router-dom`
    - Install dev dependencies: `vitest`, `@testing-library/react`, `fast-check`, `fake-indexeddb`
    - _Requirements: 1.1, 4.4_

  - [x] 1.2 Configure Tailwind CSS with iOS design tokens
    - Install `tailwindcss`, `postcss`, `autoprefixer`
    - Create `tailwind.config.ts` with custom theme (border-radius 8-16px, shadows, system font stack)
    - Configure dark mode with `class` strategy
    - Add base styles in `index.css` with safe-area-inset variables
    - _Requirements: 16.1, 16.3, 16.5_

  - [x] 1.3 Configure vite-plugin-pwa and service worker
    - Install `vite-plugin-pwa`
    - Configure Workbox with precache for app shell assets
    - Set runtime caching strategy (stale-while-revalidate for fonts/icons)
    - Create `manifest.webmanifest` with standalone display mode, theme color, app name
    - _Requirements: 1.1, 1.2_

  - [x] 1.4 Set up project directory structure
    - Create folder structure: `src/components/`, `src/pages/`, `src/services/`, `src/db/`, `src/context/`, `src/hooks/`, `src/utils/`, `src/__tests__/`
    - Create test subdirectories: `properties/`, `unit/`, `integration/`, `components/`
    - Set up path aliases in `vite.config.ts`
    - _Requirements: None (infrastructure)_

  - [x] 1.5 Configure Vitest and testing infrastructure
    - Configure `vitest.config.ts` with jsdom environment
    - Set up `fake-indexeddb` global polyfill for tests
    - Create test setup file with React Testing Library config
    - Add npm scripts: `test`, `test:unit`, `test:property`, `test:integration`
    - _Requirements: None (infrastructure)_

  - [x] 1.6 Install remaining dependencies
    - Install `dexie` and `dexie-react-hooks` for IndexedDB
    - Install `chart.js` and `react-chartjs-2` for charts
    - Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` for drag-and-drop
    - Install `uuid` for ID generation
    - _Requirements: None (infrastructure)_

- [ ] 2. Design System and Shared Components
  - [x] 2.1 Create iOS-style design tokens and Tailwind utilities
    - Define color palette (light/dark mode variants) as CSS variables
    - Create custom Tailwind utilities for iOS card styles, shadows, animations
    - Define typography scale using -apple-system font stack
    - Add spring-curve easing and slide transition keyframes
    - _Requirements: 16.1, 16.2, 16.3_

  - [x] 2.2 Implement BottomTabBar navigation component
    - Create `BottomTabBar.tsx` with 3 tabs: Finance, Habits, Settings
    - Implement active tab indicator with distinct color/icon state
    - Apply 44x44px minimum tap targets
    - Handle safe-area-inset-bottom for home indicator
    - _Requirements: 16.4, 16.8, 17.1, 17.2, 17.3_

  - [x] 2.3 Implement shared UI components
    - Create `ConfirmDialog.tsx` — iOS action sheet style confirmation modal
    - Create `Toast.tsx` — Transient success/error notification
    - Create `EmptyState.tsx` — Centered message for empty lists
    - Create `ValidationError.tsx` — Inline form error message
    - Create `NotificationBanner.tsx` — Dismissible notification permission banner
    - _Requirements: 16.1, 16.6_

  - [x] 2.4 Set up React Router with app layout
    - Configure routes matching the routing structure from design
    - Create `AppLayout.tsx` with BottomTabBar and route outlet
    - Implement route guards for authenticated/unauthenticated states
    - Add module state preservation on navigation (scroll position, drafts)
    - _Requirements: 17.1, 17.4, 17.5_

  - [x] 2.5 Create MonthSelector shared component
    - Create `MonthSelector.tsx` with prev/next month navigation
    - Enforce range: any past month up to 12 months in the future
    - Display formatted month/year label
    - _Requirements: 5.5_

  - [ ] 2.6 Write unit tests for design system utilities
    - Test dark mode toggle behavior
    - Test safe-area-inset application
    - Test MonthSelector range validation
    - _Requirements: 16.3, 5.5_

- [ ] 3. Profile Layer (Profile CRUD, Auth Gate, WebAuthn/PIN)
  - [x] 3.1 Implement Profile data model and storage service
    - Create `ProfileMeta` interface and LocalStorage CRUD operations
    - Implement profile name validation (1-30 chars, unique case-insensitive)
    - Enforce maximum 8 profiles limit
    - Implement "at least one profile" deletion guard
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 2.7_

  - [x] 3.2 Implement ProfileSelector screen
    - Create `ProfileSelector.tsx` with grid of profile cards
    - Add "Create Profile" button/card
    - Show profile names and auth type indicators
    - Handle first-launch redirect to profile creation
    - _Requirements: 2.2, 2.8_

  - [x] 3.3 Implement ProfileCreator form
    - Create `ProfileCreator.tsx` with name input and optional biometric enrollment
    - Implement inline validation (empty, too long, duplicate)
    - Handle successful creation → redirect to profile
    - _Requirements: 2.4, 2.5_

  - [x] 3.4 Implement AuthService (WebAuthn + PIN)
    - Create `services/auth.service.ts` implementing the AuthService interface
    - Implement WebAuthn enrollment and authentication using Web Authentication API
    - Implement PIN set/verify with SHA-256 hashing stored in LocalStorage
    - Implement lockout state machine (3 failures → 30s lock, persisted in LocalStorage)
    - Add WebAuthn support detection with graceful fallback to PIN
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.5 Implement AuthGate component
    - Create `AuthGate.tsx` with biometric prompt or PIN input
    - Display lockout countdown timer when locked
    - Handle successful auth → grant access to profile
    - Handle unauthenticated profiles → immediate access
    - _Requirements: 3.1, 3.3, 3.5, 3.6_

  - [x] 3.6 Implement ProfileContext provider
    - Create `context/ProfileContext.tsx` providing active profile ID
    - Manage authentication state
    - Provide Dexie instance for active profile
    - Handle profile switching (clear state, re-authenticate)
    - _Requirements: 2.3_

  - [ ] 3.7 Write property tests for profile validation
    - **Property 1: Profile name validation** — test name length 1-30 and uniqueness
    - **Validates: Requirements 2.4, 2.5**

  - [ ] 3.8 Write property tests for authentication lockout
    - **Property 3: Authentication lockout state machine** — test N failures → lock after 3
    - **Validates: Requirements 3.3, 3.5**

  - [ ] 3.9 Write property test for PIN format validation
    - **Property 4: PIN format validation** — test numeric only, 4-6 digits
    - **Validates: Requirements 3.5**

- [ ] 4. Data Layer (Dexie Schema, Per-Profile DB Instances, LocalStorage)
  - [x] 4.1 Implement Dexie database schema and ProfileDatabase class
    - Create `db/schema.ts` with all table definitions from design
    - Implement `ProfileDatabase` class extending Dexie with version(1) stores
    - Define indexes: `incomeEntries` by month, `expenses` by categoryId/month/date, `habitCompletions` by [habitId+date], `streakRecords` by habitId
    - _Requirements: 4.1, 4.2_

  - [x] 4.2 Implement DbService for per-profile database management
    - Create `services/db.service.ts` implementing the DbService interface
    - Implement `getProfileDb(profileId)` — creates/returns cached Dexie instance per profile
    - Implement `deleteProfileDb(profileId)` — destroys database on profile deletion
    - Implement `checkStorageQuota()` — estimate available storage
    - _Requirements: 2.3, 4.1, 4.2, 4.7_

  - [x] 4.3 Implement LocalStorage service for preferences
    - Create `services/localStorage.service.ts` for global preferences
    - Implement typed getters/setters for all LocalStorage keys from design
    - Handle serialization/deserialization of complex objects (profiles array, settings)
    - _Requirements: 4.3, 4.6_

  - [x] 4.4 Implement error handling for storage operations
    - Create storage error boundary for quota exceeded scenarios
    - Implement fallback detection (IndexedDB unavailable → LocalStorage warning)
    - Add corruption detection and recovery UI (reset or export recoverable data)
    - _Requirements: 4.5, 4.7, 4.8_

  - [ ] 4.5 Write property test for profile data isolation
    - **Property 2: Profile data isolation** — writes to one DB return zero from another
    - **Validates: Requirements 2.3**

  - [ ] 4.6 Write integration tests for Dexie CRUD operations
    - Test create/read/update/delete for all tables
    - Test index queries (by month, by categoryId, compound indexes)
    - Test database deletion and recreation
    - _Requirements: 4.1, 4.2_

- [ ] 5. Checkpoint - Project foundation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Finance Module - Income Management
  - [x] 6.1 Implement income validation utilities
    - Create `utils/validators/income.validator.ts`
    - Validate amount: 0.01 to 999,999,999.99
    - Validate source: 1-100 characters, non-empty
    - Return typed validation result with specific error messages
    - _Requirements: 5.1, 5.6, 5.7_

  - [x] 6.2 Implement income data operations (CRUD via Dexie)
    - Create `hooks/useIncome.ts` with Dexie liveQuery for reactive data
    - Implement add, edit, delete operations with optimistic UI
    - Compute monthly total as sum of entries for selected month
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 6.3 Implement IncomeList and IncomeForm components
    - Create `IncomeList.tsx` — displays entries for selected month with total
    - Create `IncomeForm.tsx` — add/edit income (amount, source, month)
    - Wire MonthSelector for month navigation
    - Show confirmation dialog on delete
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [ ] 6.4 Write property tests for income validation
    - **Property 5: Income entry validation** — amount range and source length
    - **Validates: Requirements 5.1, 5.6, 5.7**

  - [ ] 6.5 Write property test for income monthly total
    - **Property 6: Income monthly total** — sum equals displayed total
    - **Validates: Requirements 5.2**

  - [ ] 6.6 Write property test for month navigation range
    - **Property 7: Month navigation range** — past months + up to 12 future
    - **Validates: Requirements 5.5**

- [ ] 7. Finance Module - Category Management
  - [x] 7.1 Implement category validation utilities
    - Create `utils/validators/category.validator.ts`
    - Validate name: 1-50 characters, unique case-insensitive
    - Validate budgetLimit: 0.01 to 999,999,999.99
    - _Requirements: 6.1, 6.5, 6.6, 6.7_

  - [x] 7.2 Implement category data operations (CRUD via Dexie)
    - Create `hooks/useCategories.ts` with liveQuery
    - Implement add, edit, delete with cascade (delete category → delete all expenses)
    - Query categories ordered alphabetically (case-insensitive sort)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 7.3 Implement CategoryList and CategoryForm components
    - Create `CategoryList.tsx` — alphabetically sorted scrollable list
    - Create `CategoryForm.tsx` — add/edit category (name, budget limit)
    - Show inline validation errors with specific messages
    - Show confirmation dialog on delete with cascade warning
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

  - [ ] 7.4 Write property tests for category validation
    - **Property 8: Expense category validation** — name length, uniqueness, budget range
    - **Validates: Requirements 6.1, 6.5, 6.6, 6.7**

  - [ ] 7.5 Write property test for category deletion cascade
    - **Property 9: Category deletion cascades to expenses** — zero expenses after delete
    - **Validates: Requirements 6.3**

  - [ ] 7.6 Write property test for alphabetical ordering
    - **Property 10: Category alphabetical ordering** — case-insensitive alpha sort
    - **Validates: Requirements 6.4**

- [ ] 8. Finance Module - Expense Management
  - [x] 8.1 Implement expense validation utilities
    - Create `utils/validators/expense.validator.ts`
    - Validate amount: 0.01 to 9,999,999.99
    - Validate categoryId: must reference existing category
    - Validate date: within selected month, not in future
    - Validate notes: 0-200 characters
    - _Requirements: 7.1, 7.3, 7.4, 7.5_

  - [x] 8.2 Implement expense data operations (CRUD via Dexie)
    - Create `hooks/useExpenses.ts` with liveQuery filtered by month
    - Implement add (auto-fill today's date), edit, delete operations
    - Derive `month` field from date for indexing
    - _Requirements: 7.1, 7.2, 7.6, 7.7_

  - [x] 8.3 Implement ExpenseList and ExpenseForm components
    - Create `ExpenseList.tsx` — filterable list for selected month
    - Create `ExpenseForm.tsx` — add/edit with category dropdown, date picker, notes
    - Auto-fill date with today, restrict to dates within selected month
    - Show confirmation dialog on delete
    - _Requirements: 7.1, 7.2, 7.3, 7.6, 7.7_

  - [ ] 8.4 Write property test for expense validation
    - **Property 11: Expense entry validation** — amount, categoryId, date, notes rules
    - **Validates: Requirements 7.1, 7.3, 7.4, 7.5**

- [ ] 9. Finance Module - Dashboard with Charts
  - [x] 9.1 Implement budget calculation utilities
    - Create `utils/budget-calculator.ts`
    - Calculate spending per category for a month
    - Calculate remaining balance (income - expenses)
    - Calculate budget progress (spent / budgetLimit) per category
    - Determine over-budget status per category
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 9.2 Implement FinanceDashboard component with Chart.js
    - Create `FinanceDashboard.tsx` with Chart.js pie/bar charts
    - Display spending per category chart
    - Display budget progress bars per category with over-budget warning
    - Display overall summary: total income, total expenses, remaining balance
    - Wire MonthSelector for navigating between months
    - Show empty state when no data for selected month
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ] 9.3 Write property tests for dashboard calculations
    - **Property 12: Dashboard spending per category** — sum of expenses equals chart data
    - **Property 13: Budget status and over-budget warning** — S/B proportion, warning iff S > B
    - **Property 14: Dashboard balance computation** — income sum - expense sum = balance
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [ ] 10. Finance Module - Weekly Statistics
  - [x] 10.1 Implement weekly partitioning algorithm
    - Create `utils/week-partitioner.ts`
    - Partition month days into weeks (Monday start, partial weeks at month boundaries)
    - Calculate proportional weekly budget: (total budget / days in month) × days in week
    - Calculate per-category spending and percentage per week
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 10.2 Implement WeeklyStats component
    - Create `WeeklyStats.tsx` — weekly spending totals with budget comparison
    - Highlight over-budget weeks with warning indicators
    - Show category breakdown on week selection (amount + percentage)
    - Wire MonthSelector for navigating between months
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 10.3 Write property tests for weekly statistics
    - **Property 15: Weekly spending partition invariant** — all days covered, sums match
    - **Property 16: Weekly proportional budget comparison** — proportional calc correct
    - **Property 17: Weekly category percentage breakdown** — percentages sum to 100
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [ ] 11. Checkpoint - Finance module complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Habit Module - Daily Checklist with Status Cycling
  - [x] 12.1 Implement habit status cycling logic
    - Create `utils/habit-status.ts`
    - Implement status cycle: not_started → in_progress → completed → not_started
    - Create function to compute summary counts (completed, in_progress, not_started)
    - _Requirements: 10.2, 10.3, 10.4, 10.8_

  - [x] 12.2 Implement habit completion data operations
    - Create `hooks/useHabitCompletions.ts` with liveQuery for today's statuses
    - Implement status toggle with immediate persistence (<2s)
    - Implement rollback on persistence failure (revert UI, show error toast)
    - Handle day boundary (midnight reset to not_started for new day)
    - _Requirements: 10.6, 10.7, 10.9_

  - [x] 12.3 Implement DailyChecklist and HabitItem components
    - Create `DailyChecklist.tsx` — grouped habit list with completion summary
    - Create `HabitItem.tsx` — single row with status indicator, name, streak badge
    - Implement tap-to-cycle interaction with visual indicators (empty circle, half-filled, checkmark)
    - Display empty state when no active habits configured
    - Support collapsible groups and categories with completion summaries
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.8, 10.10, 12.3, 12.4, 12.5_

  - [ ] 12.4 Write property tests for habit status cycling
    - **Property 18: Habit status cycle** — tap advances, 3 taps returns to original
    - **Property 19: Habit completion summary counts** — counts match actuals, sum = total
    - **Validates: Requirements 10.2, 10.3, 10.4, 10.8**

- [ ] 13. Habit Module - Habit/Category/Group CRUD
  - [x] 13.1 Implement habit validation utilities
    - Create `utils/validators/habit.validator.ts`
    - Validate habit name: 1-100 characters
    - Validate category name: 1-50 characters, unique within group
    - Validate group name: 1-50 characters, unique within profile
    - _Requirements: 11.1, 11.2, 12.1, 12.2_

  - [x] 13.2 Implement habit/category/group data operations
    - Create `hooks/useHabits.ts`, `hooks/useHabitCategories.ts`, `hooks/useHabitGroups.ts`
    - Implement CRUD for habits, categories, groups via Dexie
    - Implement soft-delete for habits (isActive=false, preserve history)
    - Implement cascade delete: group → categories → habits
    - Maintain referential integrity (every habit → category → group)
    - _Requirements: 11.1, 11.3, 11.4, 12.1, 12.2, 12.7, 12.8, 12.9_

  - [x] 13.3 Implement drag-and-drop reordering with @dnd-kit
    - Create `DragSortableList.tsx` wrapper using @dnd-kit
    - Implement habit reorder within category
    - Implement category reorder within group
    - Implement move habit between categories, category between groups
    - Persist order changes immediately
    - _Requirements: 11.5, 11.6, 12.6_

  - [x] 13.4 Implement HabitForm, CategoryManager, GroupManager components
    - Create `HabitForm.tsx` — add/edit habit (name, category assignment)
    - Create `CategoryManager.tsx` — CRUD for habit categories
    - Create `GroupManager.tsx` — CRUD for habit groups
    - Show confirmation dialogs on delete with cascade warnings
    - _Requirements: 11.1, 11.3, 12.1, 12.2, 12.7, 12.8_

  - [ ] 13.5 Write property tests for habit validation
    - **Property 20: Habit name validation** — 1-100 chars and valid category
    - **Property 23: Habit category name validation** — 1-50 chars, unique in group
    - **Property 24: Habit group name validation** — 1-50 chars, unique in profile
    - **Validates: Requirements 11.1, 11.2, 12.1, 12.2**

  - [ ] 13.6 Write property tests for structural operations
    - **Property 21: Habit deletion preserves history** — completions/streaks remain
    - **Property 22: Structural operations preserve items** — count unchanged, valid orders
    - **Property 25: Hierarchy structural invariant** — no orphan references
    - **Validates: Requirements 11.4, 11.5, 12.3, 12.6, 12.9**

- [ ] 14. Habit Module - Streaks
  - [x] 14.1 Implement streak calculation logic
    - Create `utils/streak-calculator.ts`
    - Calculate current streak: consecutive completed days backward from today
    - Calculate longest streak: max consecutive completed run in history
    - Recalculate on status change (including past day edits)
    - Only "completed" counts; "in_progress" and "not_started" break streak
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.8_

  - [x] 14.2 Implement streak data persistence and display
    - Create `hooks/useStreaks.ts` with liveQuery on StreakRecord table
    - Update streak on every status toggle
    - Create `StreakDisplay.tsx` — current + longest streak per habit
    - Implement milestone detection (7, 14, 30, 60, 90, 365) with celebration UI
    - Add 7-day dot grid showing recent completion history
    - _Requirements: 13.1, 13.5, 13.6, 13.7_

  - [ ] 14.3 Write property tests for streak calculations
    - **Property 26: Streak calculation** — consecutive completed days from today
    - **Property 27: Longest streak calculation** — max run in entire history
    - **Property 28: Streak milestone detection** — triggers iff N in {7,14,30,60,90,365}
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.8**

- [ ] 15. Habit Module - Weekly Statistics
  - [x] 15.1 Implement weekly habit statistics calculations
    - Create `utils/habit-stats-calculator.ts`
    - Calculate per-habit completion rate over 7 days (or fewer if created mid-week)
    - Calculate overall weekly completion percentage
    - Determine top 3 and bottom 3 habits by completion rate
    - _Requirements: 14.1, 14.2, 14.4, 14.6_

  - [x] 15.2 Implement WeeklyHabitStats component
    - Create `WeeklyHabitStats.tsx` — 7-day calendar grid with status indicators
    - Display per-habit completion rates
    - Display overall weekly completion percentage
    - Highlight top 3 / bottom 3 habits
    - Allow navigation to previous weeks
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ] 15.3 Write property tests for weekly habit statistics
    - **Property 29: Per-habit weekly completion rate** — correct calculation with mid-week creation
    - **Property 30: Overall weekly completion percentage** — total completed / total active × 100
    - **Property 31: Top/bottom habit ranking** — correct ordering, handles < 3 habits
    - **Validates: Requirements 14.1, 14.2, 14.4, 14.6**

- [ ] 16. Checkpoint - Habit module complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Settings (Notifications, Export/Import, Auth Config)
  - [x] 17.1 Implement NotificationService
    - Create `services/notification.service.ts` implementing NotificationService interface
    - Implement permission request flow
    - Implement habit reminder scheduling (morning 05:00-11:59, evening 17:00-23:59)
    - Implement finance reminder scheduling (any time)
    - Enforce 15-minute increment time selection
    - Apply default times (08:00 morning, 20:00 evening, 19:00 finance)
    - Handle permission denied gracefully (in-app banner)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

  - [x] 17.2 Implement ExportService
    - Create `services/export.service.ts` implementing ExportService interface
    - Implement `exportProfile` — generate JSON blob with all finance + habit data
    - Implement `validateImportFile` — check JSON structure, size ≤ 50MB, required sections
    - Implement `importProfile` — replace data within Dexie transaction (rollback on failure)
    - Generate filename with profile name and date
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

  - [x] 17.3 Implement Settings screen components
    - Create `Settings.tsx` — main settings page
    - Create notification settings section (time pickers, enable/disable toggles)
    - Create export/import section (export button, file picker for import)
    - Create auth settings section (enable/disable biometric, change PIN)
    - Create theme toggle (light/dark/system)
    - Show "About" section with version info
    - _Requirements: 15.4, 15.5, 3.4, 16.3_

  - [ ] 17.4 Write property test for notification time validation
    - **Property 32: Notification time validation** — 15-min increments, valid ranges per type
    - **Validates: Requirements 15.4**

  - [ ] 17.5 Write property tests for export/import
    - **Property 33: Export-import round trip** — export then import produces identical state
    - **Property 34: Import file validation** — valid JSON, structure, size ≤ 50MB
    - **Validates: Requirements 18.1, 18.3, 18.4**

- [ ] 18. PWA Shell (Service Worker, Manifest, Offline, Icons)
  - [x] 18.1 Create PWA icons and Apple touch icons
    - Create/add PNG icons at 180x180, 152x152, 120x120 for apple-touch-icon
    - Create standard PWA icons at 192x192 and 512x512
    - Reference icons in manifest and HTML via apple-touch-icon link elements
    - _Requirements: 1.5_

  - [x] 18.2 Add iOS-specific meta tags and full-screen configuration
    - Add `apple-mobile-web-app-capable` set to "yes"
    - Add `apple-mobile-web-app-status-bar-style` set to "black-translucent"
    - Add viewport meta with `viewport-fit=cover`
    - Ensure full-screen rendering without Safari UI when launched from home screen
    - _Requirements: 1.3, 1.4_

  - [x] 18.3 Implement service worker registration and error handling
    - Add SW registration in `main.tsx` with error handling
    - If registration fails: log error, continue in online-only mode
    - Verify offline capability: all app shell assets cached for offline use
    - _Requirements: 1.2, 1.6, 4.4_

  - [x] 18.4 Implement React Error Boundary at module level
    - Create `ErrorBoundary.tsx` with friendly error screen
    - Add "Reload Module" button that resets module state
    - Ensure other modules remain accessible via navigation
    - Log error details to console
    - _Requirements: None (robustness)_

- [ ] 19. Final Checkpoint - Full application integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after major phases
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The data layer (phase 4) must be complete before any module implementation
- Shared components (phase 2) must be complete before feature UI components
- Finance and Habit modules can be developed in parallel after their shared dependencies are ready
- PWA shell tasks (phase 18) can be done at any point after project setup, but are placed last for logical grouping

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.4", "1.5", "1.6"] },
    { "id": 2, "tasks": ["1.3", "2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.5"] },
    { "id": 4, "tasks": ["2.4", "2.6"] },
    { "id": 5, "tasks": ["3.1", "4.1"] },
    { "id": 6, "tasks": ["3.2", "3.3", "3.4", "4.2", "4.3"] },
    { "id": 7, "tasks": ["3.5", "3.6", "4.4"] },
    { "id": 8, "tasks": ["3.7", "3.8", "3.9", "4.5", "4.6"] },
    { "id": 9, "tasks": ["6.1", "7.1", "8.1", "12.1", "13.1"] },
    { "id": 10, "tasks": ["6.2", "7.2", "8.2", "12.2", "13.2"] },
    { "id": 11, "tasks": ["6.3", "7.3", "8.3", "12.3", "13.3", "13.4"] },
    { "id": 12, "tasks": ["6.4", "6.5", "6.6", "7.4", "7.5", "7.6", "8.4", "12.4", "13.5", "13.6"] },
    { "id": 13, "tasks": ["9.1", "10.1", "14.1", "15.1"] },
    { "id": 14, "tasks": ["9.2", "10.2", "14.2", "15.2"] },
    { "id": 15, "tasks": ["9.3", "10.3", "14.3", "15.3"] },
    { "id": 16, "tasks": ["17.1", "17.2"] },
    { "id": 17, "tasks": ["17.3"] },
    { "id": 18, "tasks": ["17.4", "17.5"] },
    { "id": 19, "tasks": ["18.1", "18.2", "18.3", "18.4"] }
  ]
}
```
