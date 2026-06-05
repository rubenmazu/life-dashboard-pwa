# Requirements Document

## Introduction

Life Dashboard PWA is a Progressive Web Application designed for iOS home screen installation (via Safari's "Add to Home Screen" feature). It provides two core modules: a monthly Finance Tracker for budgeting and expense management, and a daily Discipline/Habit Tracker for building consistent routines. The application uses an elegant Apple/iOS-inspired design with an English-language UI, stores all data locally on the device, and requires no backend, Mac, or Apple Developer account. It can be hosted for free on platforms like Netlify, Vercel, or GitHub Pages.

## Glossary

- **PWA**: Progressive Web App — a web application that uses a manifest and service worker to enable installation on device home screens and offline functionality
- **Dashboard**: The main overview screen displaying aggregated financial data through charts and summaries
- **Finance_Tracker**: The module responsible for managing income, expense categories, budgets, and spending records on a monthly basis
- **Habit_Tracker**: The module responsible for managing daily habits/tasks organized into categories with check/uncheck/partial functionality
- **Category**: A named grouping for expenses (in Finance_Tracker) or for habits (in Habit_Tracker), each with configurable properties
- **Habit**: A single trackable daily action or task that can be marked as completed, in-progress, or not started
- **Habit_Group**: A higher-level grouping that contains multiple habit categories, enabling hierarchical organization
- **Habit_Status**: The completion state of a habit for a given day: "not_started", "in_progress", or "completed"
- **Streak**: A count of consecutive days a habit has been marked as completed without interruption
- **Budget_Limit**: A monetary threshold assigned to an expense category representing the maximum intended spending for that category per month
- **Service_Worker**: A JavaScript worker that enables offline caching and PWA installation capabilities
- **Web_App_Manifest**: A JSON file that defines the PWA metadata (name, icons, display mode) enabling home screen installation
- **IndexedDB**: A browser-based NoSQL database for structured local data storage
- **LocalStorage**: A browser-based key-value storage mechanism for simple persistent data
- **Notification_API**: The browser Notification API used to deliver local push notifications and reminders
- **User_Profile**: A local account representing a single user, with its own isolated data (finances, habits, settings)
- **WebAuthn**: The Web Authentication API that enables biometric authentication (Face ID, Touch ID, fingerprint) in supported browsers
- **Biometric_Lock**: The authentication mechanism using device biometrics (face or fingerprint) to protect access to a User_Profile

## Requirements

### Requirement 1: PWA Installation and Full-Screen Launch

**User Story:** As a user, I want to install the app on my iOS home screen and have it launch in full-screen mode, so that it feels like a native application without needing the App Store.

#### Acceptance Criteria

1. THE PWA SHALL provide a valid Web_App_Manifest with display mode set to "standalone", a defined app name, and a theme color
2. THE PWA SHALL register a Service_Worker that caches all application shell assets (HTML, CSS, JavaScript, fonts, and icons) required for offline rendering of the UI
3. WHEN launched from the iOS home screen, THE PWA SHALL render in full-screen mode without the Safari browser UI (no address bar, no navigation toolbar)
4. THE PWA SHALL include Apple-specific meta tags: apple-mobile-web-app-capable set to "yes" and apple-mobile-web-app-status-bar-style set to "black-translucent" for proper iOS integration
5. THE PWA SHALL provide home screen icons in PNG format at sizes 180x180, 152x152, and 120x120 pixels, referenced via apple-touch-icon link elements
6. IF Service_Worker registration fails, THEN THE PWA SHALL continue to function in online mode and log the failure without blocking the user from using the application

### Requirement 2: Multi-User Profiles

**User Story:** As a user sharing a device with family members, I want to have my own profile with isolated data, so that each person can track their own finances and habits separately.

#### Acceptance Criteria

1. THE PWA SHALL support creating a maximum of 8 User_Profiles on the same device
2. WHEN the app launches and at least one User_Profile exists, THE PWA SHALL display a profile selection screen showing all available User_Profiles by name
3. THE PWA SHALL store each User_Profile's data (finances, habits, settings) in a separate IndexedDB namespace per profile, preventing any cross-profile data access through the UI
4. WHEN the user creates a new profile, THE PWA SHALL require a profile name between 1 and 30 characters that is unique among existing profiles, and optionally associate Biometric_Lock credentials
5. IF the user submits a profile name that is empty, exceeds 30 characters, or duplicates an existing profile name, THEN THE PWA SHALL display a validation error indicating the specific issue and not create the profile
6. THE PWA SHALL allow the user to delete a User_Profile after an explicit confirmation prompt, removing all associated data permanently
7. IF the user attempts to delete the last remaining User_Profile, THEN THE PWA SHALL prevent deletion and display a message indicating at least one profile must exist
8. WHEN the app launches for the first time with no existing User_Profiles, THE PWA SHALL display the profile creation screen requiring the user to create a profile before accessing any other functionality

### Requirement 3: Biometric Authentication

**User Story:** As a user, I want to lock my profile with Face ID or fingerprint, so that other people using the same device cannot access my personal data.

#### Acceptance Criteria

1. WHEN a User_Profile has Biometric_Lock enabled, THE PWA SHALL require biometric authentication via WebAuthn before granting access to that profile
2. THE PWA SHALL use the device's native biometric prompt (Face ID on iPhone X+, Touch ID on older models) through the WebAuthn API
3. WHEN biometric authentication fails three consecutive times, THE PWA SHALL lock the profile for 30 seconds, display a countdown timer showing remaining lockout time, and persist the lockout state across app reloads so that closing and reopening the app does not reset the failed attempt counter or bypass the lockout period
4. WHEN the user enables Biometric_Lock from the Settings screen, THE PWA SHALL require a successful biometric authentication to confirm enrollment before activating the lock, and WHEN the user disables Biometric_Lock, THE PWA SHALL require a successful biometric authentication before deactivating the lock
5. IF the device does not support WebAuthn or biometric hardware, THEN THE PWA SHALL offer a PIN code as an alternative authentication method, requiring a numeric PIN between 4 and 6 digits in length, and THE PWA SHALL apply the same lockout rules (3 failed attempts, 30-second lock) to PIN entry
6. WHEN a User_Profile does not have Biometric_Lock enabled, THE PWA SHALL allow immediate access upon profile selection without authentication

### Requirement 4: Local Data Persistence

**User Story:** As a user, I want all my data stored locally on my device, so that I do not need a backend server or internet connection to use the app after initial load.

#### Acceptance Criteria

1. THE PWA SHALL store all Finance_Tracker data (income entries, categories, expenses) in IndexedDB, scoped to the active User_Profile
2. THE PWA SHALL store all Habit_Tracker data (habits, categories, habit groups, daily completions, streaks) in IndexedDB, scoped to the active User_Profile
3. THE PWA SHALL store user preferences and settings in LocalStorage, keyed by User_Profile identifier
4. WHEN the device has no internet connection after initial installation, THE PWA SHALL remain fully functional for all data viewing, creation, editing, and deletion operations using cached assets and local data, excluding only features that inherently require a network connection
5. IF IndexedDB is unavailable, THEN THE PWA SHALL fall back to LocalStorage, display a persistent warning indicating that storage is limited to 5 MB and that data loss may occur if the limit is exceeded, and disable any features that exceed LocalStorage capacity
6. THE PWA SHALL persist all stored data across application restarts, device reboots, and browser session closures without data loss
7. IF a data write operation fails due to storage quota being exceeded, THEN THE PWA SHALL display an error message indicating insufficient storage space, preserve all previously stored data unchanged, and prevent the failed operation from corrupting existing records
8. IF IndexedDB data becomes corrupted or unreadable, THEN THE PWA SHALL display an error message indicating the issue and offer the user the option to reset the affected User_Profile data or attempt a data export of any recoverable records

### Requirement 5: Monthly Income Management

**User Story:** As a user, I want to add income entries for each month, so that I can track my total available funds for budgeting.

#### Acceptance Criteria

1. WHEN the user submits an income entry, THE Finance_Tracker SHALL store the entry with amount (0.01 to 999,999,999.99), source description (maximum 100 characters), and associated month
2. THE Finance_Tracker SHALL display all income entries for the currently selected month as a list, along with the total income sum for that month
3. WHEN the user edits an existing income entry, THE Finance_Tracker SHALL update the stored amount and source description, and recalculate the monthly total
4. WHEN the user deletes an income entry, THE Finance_Tracker SHALL remove the entry after user confirmation and recalculate the monthly total
5. THE Finance_Tracker SHALL allow the user to navigate between months to view and manage income entries for any past month and up to 12 months in the future
6. IF the user submits an income entry with an amount that is zero, negative, or exceeds 999,999,999.99, THEN THE Finance_Tracker SHALL display a validation error indicating the acceptable amount range and prevent submission
7. IF the user submits an income entry with an empty source description, THEN THE Finance_Tracker SHALL display a validation error requiring a source description and prevent submission

### Requirement 6: Expense Category Management

**User Story:** As a user, I want to create and manage expense categories with budget limits, so that I can organize my spending and set financial goals.

#### Acceptance Criteria

1. WHEN the user creates a new category, THE Finance_Tracker SHALL store the category with a name (1 to 50 characters) and a Budget_Limit (0.01 to 999,999,999.99)
2. WHEN the user edits a category, THE Finance_Tracker SHALL update the category name and Budget_Limit applying the same validation rules as creation
3. WHEN the user deletes a category, THE Finance_Tracker SHALL remove the category and all associated expenses after the user confirms via a confirmation dialog
4. THE Finance_Tracker SHALL display all categories in a scrollable list accessible from the main finance UI, ordered alphabetically by name
5. THE Finance_Tracker SHALL prevent creation of duplicate category names (case-insensitive comparison) within the same user account
6. IF the user submits a category with a name that is empty, exceeds 50 characters, or already exists (case-insensitive), THEN THE Finance_Tracker SHALL display a validation error indicating the specific reason and retain the entered data in the form
7. IF the user submits a category with a Budget_Limit that is not a positive number between 0.01 and 999,999,999.99, THEN THE Finance_Tracker SHALL display a validation error indicating the Budget_Limit must be a positive monetary value within the allowed range

### Requirement 7: Expense Entry Management

**User Story:** As a user, I want to add expenses to specific categories with amount, date, and notes, so that I can track individual purchases and what they were for.

#### Acceptance Criteria

1. WHEN the user adds an expense, THE Finance_Tracker SHALL store the expense with amount (between 0.01 and 9,999,999.99), category, date, and an optional notes field (maximum 200 characters)
2. WHEN the user opens the expense entry form, THE Finance_Tracker SHALL auto-fill the date field with today's date
3. THE Finance_Tracker SHALL allow the user to modify the auto-filled date to any past or present date within the currently selected month
4. WHEN the user submits an expense without selecting a category, THE Finance_Tracker SHALL display a validation error requiring category selection
5. WHEN the user submits an expense with an amount that is empty, zero, negative, or exceeds 9,999,999.99, THE Finance_Tracker SHALL display a validation error requiring a valid positive amount between 0.01 and 9,999,999.99
6. THE Finance_Tracker SHALL allow the user to edit existing expense entries by modifying amount, category, date, or notes
7. WHEN the user requests to delete an expense entry, THE Finance_Tracker SHALL remove the entry after user confirmation

### Requirement 8: Financial Dashboard with Visual Charts

**User Story:** As a user, I want to see visual charts showing my spending patterns and budget status, so that I can quickly understand my financial situation for the current month.

#### Acceptance Criteria

1. THE Dashboard SHALL display a chart showing total spending per category for the current month
2. THE Dashboard SHALL display the remaining budget for each category as a visual indicator (progress bar or similar), where the indicator shows the proportion of Budget_Limit consumed by spending
3. WHEN a category's spending exceeds its Budget_Limit, THE Dashboard SHALL display a visual warning indicator (color change and warning icon) for that category
4. THE Dashboard SHALL display an overall spending summary showing total income, total expenses, and remaining balance (total income minus total expenses) for the current month
5. WHEN the user switches between months, THE Dashboard SHALL update all charts and summaries to reflect the selected month's data, limited to months that contain at least one income entry or expense entry
6. THE Dashboard SHALL render chart data within 500ms of month selection or data change
7. IF the selected month contains no income entries and no expense entries, THEN THE Dashboard SHALL display an empty state message indicating no financial data is available for that month
8. IF a category has no Budget_Limit defined, THEN THE Dashboard SHALL display the category spending amount without a budget progress indicator

### Requirement 9: Weekly Financial Statistics

**User Story:** As a user, I want to see weekly breakdowns of my spending, so that I can identify patterns and adjust my habits within a month.

#### Acceptance Criteria

1. THE Finance_Tracker SHALL provide a weekly statistics view showing spending totals for each week of the current month, where weeks start on Monday and partial weeks at the start or end of the month are displayed as their own entries containing only the days that fall within that month
2. THE Finance_Tracker SHALL display a comparison of weekly spending against a proportional weekly budget calculated as the sum of all category Budget_Limits divided by the number of days in the month, multiplied by the number of days in that week
3. THE Finance_Tracker SHALL highlight weeks where spending exceeded the proportional weekly budget using a visual warning indicator (color change and warning icon) consistent with over-budget category indicators
4. WHEN the user selects a specific week, THE Finance_Tracker SHALL display a breakdown of expenses by category for that week, showing each category's spending amount and its percentage of the total weekly spending
5. WHEN the user switches between months, THE Finance_Tracker SHALL update the weekly statistics view to reflect the selected month's weekly data

### Requirement 10: Daily Habit Checklist with Partial Completion

**User Story:** As a user, I want a daily checklist where I can mark habits as done, in progress, or not started, so that I can track partial efforts alongside full completions.

#### Acceptance Criteria

1. THE Habit_Tracker SHALL display all active habits for the current day as a checklist, up to a maximum of 50 habits
2. WHEN the user taps a habit item once, THE Habit_Tracker SHALL cycle the Habit_Status from "not_started" to "in_progress"
3. WHEN the user taps a habit item a second time, THE Habit_Tracker SHALL cycle the Habit_Status from "in_progress" to "completed"
4. WHEN the user taps a habit item a third time, THE Habit_Tracker SHALL cycle the Habit_Status back to "not_started"
5. THE Habit_Tracker SHALL display distinct visual indicators for each Habit_Status: empty circle for not_started, half-filled circle for in_progress, and filled checkmark for completed
6. WHEN the user toggles a Habit_Status, THE Habit_Tracker SHALL persist the updated status within 2 seconds without requiring a save action
7. IF the Habit_Status fails to persist after a toggle, THEN THE Habit_Tracker SHALL revert the visual indicator to its previous state and display an error message indicating the status was not saved
8. THE Habit_Tracker SHALL display a completion summary for the current day showing counts for each status (e.g., "7 done · 2 in progress · 3 remaining")
9. WHEN a new day begins (midnight local time), THE Habit_Tracker SHALL present a fresh checklist with all habits set to "not_started" while preserving previous days' completion data
10. IF the user has no active habits configured, THEN THE Habit_Tracker SHALL display an empty state message indicating no habits are available for tracking

### Requirement 11: Custom Habit Management

**User Story:** As a user, I want to add, edit, and remove custom habits, so that I can tailor the checklist to my personal goals.

#### Acceptance Criteria

1. WHEN the user creates a new habit, THE Habit_Tracker SHALL store the habit with a name (1 to 100 characters) and an assigned category
2. IF the user submits a habit with an empty name or a name exceeding 100 characters, THEN THE Habit_Tracker SHALL display a validation error and not store the habit
3. WHEN the user edits a habit, THE Habit_Tracker SHALL update the habit name and category assignment
4. WHEN the user deletes a habit, THE Habit_Tracker SHALL remove the habit from the active checklist after user confirmation, while preserving historical completion data and streak records for that habit
5. THE Habit_Tracker SHALL allow reordering of habits within a category via drag-and-drop or move actions
6. THE Habit_Tracker SHALL persist the updated habit order immediately so the order is retained on subsequent views
7. THE Habit_Tracker SHALL support a minimum of 50 active habits while maintaining checklist load and status toggle response times under 500ms

### Requirement 12: Habit Category and Group Organization

**User Story:** As a user, I want to organize habits into categories and group categories together, so that I can maintain a structured and easy-to-navigate checklist.

#### Acceptance Criteria

1. THE Habit_Tracker SHALL allow the user to create, rename, and delete habit categories, where category names must be between 1 and 50 characters and unique within the same Habit_Group
2. THE Habit_Tracker SHALL allow the user to create and rename Habit_Groups that contain one or more categories, where group names must be between 1 and 50 characters and unique within the user's profile
3. THE Habit_Tracker SHALL display habits grouped by their category, and categories grouped by their Habit_Group, with all groups and categories expanded by default
4. WHEN a category is collapsed, THE Habit_Tracker SHALL hide the habits within it and show only the category header with a completion summary displaying the count of completed habits out of total habits in that category (e.g., "5/8 completed")
5. WHEN a Habit_Group is collapsed, THE Habit_Tracker SHALL hide all categories within it and show only the group header with an overall completion summary displaying the count of completed habits out of total habits across all categories in that group
6. THE Habit_Tracker SHALL allow the user to move habits between categories and categories between Habit_Groups via drag-and-drop or a move action
7. WHEN the user deletes a category that contains habits, THE Habit_Tracker SHALL require user confirmation and, upon confirmation, remove the category and all habits within it
8. WHEN the user deletes a Habit_Group that contains categories, THE Habit_Tracker SHALL require user confirmation and, upon confirmation, remove the group along with all its categories and their contained habits
9. THE Habit_Tracker SHALL require every habit to belong to exactly one category and every category to belong to exactly one Habit_Group

### Requirement 13: Habit Streaks

**User Story:** As a user, I want to see my streak count for each habit, so that I stay motivated by visualizing my consistency.

#### Acceptance Criteria

1. THE Habit_Tracker SHALL calculate and display the current Streak for each habit, defined as the number of consecutive days (including today) where the Habit_Status was "completed", counting only "completed" status (not "in_progress" or "not_started")
2. WHEN a habit is marked as "completed" for the current day and was "completed" the previous day, THE Habit_Tracker SHALL increment the Streak count by one
3. WHEN a habit is marked as "completed" for the current day with no prior completion history or a broken streak, THE Habit_Tracker SHALL set the Streak count to one
4. WHEN a habit is not marked as "completed" by midnight local time, THE Habit_Tracker SHALL reset the Streak count to zero on the following day
5. THE Habit_Tracker SHALL display the longest historical Streak alongside the current Streak for each habit
6. WHEN a habit reaches a Streak milestone (7, 14, 30, 60, 90, 365 days), THE Habit_Tracker SHALL display a congratulatory visual indicator for at least 3 seconds or until the user dismisses it
7. THE Habit_Tracker SHALL display a weekly overview showing which days each habit was completed as a 7-day dot grid representing the current day and the 6 preceding days
8. WHEN the user changes a previous day's Habit_Status, THE Habit_Tracker SHALL recalculate the current Streak and longest historical Streak to reflect the updated completion history

### Requirement 14: Weekly Habit Statistics

**User Story:** As a user, I want to see weekly statistics for my habits, so that I can track my discipline over time and identify patterns.

#### Acceptance Criteria

1. THE Habit_Tracker SHALL provide a weekly statistics view showing completion rates for each habit over the past 7 days, where only habits with Habit_Status "completed" count toward the completion rate (habits with "in_progress" or "not_started" count as incomplete)
2. THE Habit_Tracker SHALL display an overall weekly completion percentage calculated as (total completed habit-days / total active habit-days) × 100, rounded to the nearest whole number
3. THE Habit_Tracker SHALL show a visual weekly calendar grid (Monday through Sunday) indicating the Habit_Status for each habit on each day using the same visual indicators defined in the daily checklist (empty circle, half-filled circle, filled checkmark)
4. THE Habit_Tracker SHALL highlight the top 3 most consistent habits (highest completion rate) and the bottom 3 habits needing improvement (lowest completion rate) for the week, or all habits if fewer than 3 exist in either group
5. THE Habit_Tracker SHALL allow the user to navigate to previous weeks to review historical statistics, limited to weeks for which completion data exists in local storage
6. IF a habit was created mid-week, THEN THE Habit_Tracker SHALL calculate that habit's weekly completion rate based only on the days since its creation within that week

### Requirement 15: Notification Reminders

**User Story:** As a user, I want to receive reminders at configured times, so that I do not forget to log expenses or complete my daily habits.

#### Acceptance Criteria

1. WHEN the PWA is launched for the first time for a User_Profile, THE PWA SHALL request Notification_API permission from the user
2. WHEN the user enables habit reminders, THE PWA SHALL send a local notification at the user-configured time reminding the user to complete their daily checklist
3. WHEN the user enables finance reminders, THE PWA SHALL send a local notification at the user-configured time reminding the user to log expenses
4. THE PWA SHALL allow the user to configure up to two habit reminder times (one morning between 05:00–11:59 and one evening between 17:00–23:59) and one finance reminder time (any time of day), each selectable in 15-minute increments
5. THE PWA SHALL allow the user to disable notifications at any time from the Settings screen
6. IF the Notification_API permission is denied by the device, THEN THE PWA SHALL display a dismissible in-app banner explaining how to enable notifications in iOS Settings, and THE PWA SHALL re-display the banner once per session until the user dismisses it or grants permission
7. IF the user enables reminders without selecting a custom time, THEN THE PWA SHALL use default reminder times of 08:00 for morning habits, 20:00 for evening habits, and 19:00 for finance tracking
8. WHEN the user grants Notification_API permission after a previous denial, THE PWA SHALL activate any previously configured reminders without requiring the user to re-enable them

### Requirement 16: iOS-Native Visual Design

**User Story:** As a user, I want the app to look and feel like a native iOS application with elegant Apple-style design, so that it provides a premium user experience on my iPhone.

#### Acceptance Criteria

1. THE PWA SHALL use an iOS-inspired design system with border-radius between 8px and 16px on cards and containers, box shadows with no more than 4px blur and 10% opacity, and the system font stack (-apple-system, BlinkMacSystemFont) for typography
2. THE PWA SHALL implement transitions and animations with a duration between 200ms and 500ms, rendering at 60 frames per second without dropped frames, using slide transitions for navigation and spring-curve easing for interactive feedback
3. THE PWA SHALL support both light and dark mode, automatically applying the active theme based on the device's prefers-color-scheme media query, and updating in real-time if the system preference changes while the app is in use
4. THE PWA SHALL use a bottom tab navigation bar for switching between Finance_Tracker, Habit_Tracker, and Settings
5. THE PWA SHALL implement safe area insets using env(safe-area-inset-*) values to prevent content overlap with the iOS status bar and home indicator
6. THE PWA SHALL be responsive across iPhone screen widths from 375px to 430px with no horizontal scrolling, no text truncation on primary labels, and all content accessible without layout overflow
7. THE PWA SHALL render all UI text in English
8. THE PWA SHALL ensure all interactive elements (buttons, tabs, toggles, list items) have a minimum tap target size of 44x44 CSS pixels

### Requirement 17: Navigation and Module Switching

**User Story:** As a user, I want to easily switch between the Finance Tracker and Habit Tracker modules, so that I can quickly access the functionality I need.

#### Acceptance Criteria

1. THE PWA SHALL provide a persistent bottom navigation bar visible on all primary screens (Finance Dashboard, Habit Checklist, Settings)
2. WHEN the user taps a navigation tab, THE PWA SHALL switch to the corresponding module within 200ms
3. THE PWA SHALL visually indicate the currently active module in the navigation bar with a distinct color and icon state
4. WHEN the user navigates away from a module, THE PWA SHALL preserve the module's scroll position, active tab/sub-view, and any unsaved form data for the duration of the session
5. IF the user has unsaved form data when switching modules, THEN THE PWA SHALL preserve the draft data and restore it when the user returns to that module within the same session

### Requirement 18: Data Export and Import

**User Story:** As a user, I want to export and import my data, so that I have a backup in case I clear my browser data or switch devices.

#### Acceptance Criteria

1. WHEN the user requests a data export, THE PWA SHALL generate a JSON file containing all Finance_Tracker data (income entries, categories, expenses) and all Habit_Tracker data (habits, categories, habit groups, daily completions, streak history) for the active User_Profile
2. WHEN the export file is generated, THE PWA SHALL trigger a file download of the JSON file to the user's device with a filename that includes the profile name and export date
3. WHEN the user provides an exported JSON file for import, THE PWA SHALL validate that the file contains valid JSON with the expected data structure (Finance_Tracker and Habit_Tracker sections with required fields) and is no larger than 50 MB
4. WHEN the user confirms the import of a valid file, THE PWA SHALL replace all existing Finance_Tracker and Habit_Tracker data in the active User_Profile with the data from the imported file
5. IF the import file fails validation (malformed JSON, missing required data sections, or exceeds 50 MB), THEN THE PWA SHALL display an error message indicating the reason for failure and preserve all existing data unchanged
6. IF the import process is interrupted or fails after confirmation, THEN THE PWA SHALL roll back to the pre-import data state and display an error message indicating that the import did not complete
