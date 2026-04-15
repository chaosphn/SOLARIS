# UAT Test Cases — SOLARIS INSIGHT (Angular `solaris-app`)

### Document info
- **Project**: `C:\Users\phum7\Documents\BOONRAWD\solaris-app`
- **App name**: SOLARIS INSIGHT
- **Build/Run**: `npm run start` (dev), `npm run build` (prod)
- **Routing**: hash routing (`useHash: true`) → URLs like `/#/main/overview`

### Scope (based on current code)
Main user journeys inferred from `src/app/app.routes.ts` and API usage in `src/app/shared/services/http.service.ts`:
- **Auth**: login/logout, token header injection, permission-based navigation
- **Central pages**: Overview, Performance, Trend, Tabular, Events, Billing, Reports, Admin, Setting
- **Site pages**: Layout, Dashboard, Efficiency, Realtime, Diagram, Charts, Event, Report, Report Admin
- **Billing workflow**: generate/get/download billing & reports, approval, config/log/state, upload billing/payment docs
- **Notifications/Events**: event data/filter/summary + config/notification config + expression parsing
- **App config**: load `assets/config.json` at startup (`APP_INITIALIZER`)

### Test prerequisites
- **UAT environment config**: `src/assets/config.json` must have valid URLs:
  - `UrlApi`, `UrlApiAuthen`, `UrlApiBilling`, `UrlApiNotification`, `Timer`
- **Test accounts & permissions** (prepare 3 users):
  - **UAT_ADMIN**: full pages + all sites
  - **UAT_USER_LIMITED**: a limited subset of pages (e.g. only `overview`, `trend`, `events`) + 1–2 sites
  - **UAT_NO_PERMISSION**: valid credentials but no page/site access (expect “permission denied” behavior)
- **Test data**:
  - At least 1 site with realtime + historian data available
  - At least 1 site with events/alarms for “today”
  - At least 1 billing session ID (route param `:id`) prepared for upload and workflow tests

### Conventions used in test cases
- **Precondition**: setup required before steps
- **Steps**: numbered actions tester performs
- **Expected**: what should happen
- **Notes**: where relevant, calls out likely edge cases based on current implementation

---

## A. App startup & configuration

### UAT-A01 — App loads and configuration is read
- **Precondition**: `assets/config.json` exists and is reachable
- **Steps**
  1. Open app in browser.
  2. Observe first navigation destination.
- **Expected**
  - App loads without blank screen.
  - Default navigation is to `/#/main/overview` (or redirect to login if your backend enforces auth).

### UAT-A02 — Missing/invalid config falls back safely
- **Precondition**: Temporarily break `assets/config.json` URL (or rename file)
- **Steps**
  1. Reload the app.
- **Expected**
  - App should show a user-friendly error state or at least still render shell.
  - No infinite loading/spinner.
- **Notes**
  - Current `AppInitService.getConfigs()` returns a default object on error; if URLs remain `undefined`, API calls will fail. UAT should confirm the UX is acceptable.

---

## B. Authentication, token, and access control

### UAT-B01 — Login success stores token & navigates to default route
- **Precondition**: User `UAT_ADMIN` exists and has page access for at least `overview`
- **Steps**
  1. Go to `/#/login`.
  2. Enter valid credentials.
  3. Click login.
- **Expected**
  - Token is stored in local storage key `token`.
  - User is routed to default route (usually `/#/main/overview`).

### UAT-B02 — Login failure blocks navigation (negative)
- **Precondition**: Use wrong password for a valid username
- **Steps**
  1. Go to `/#/login`.
  2. Enter invalid credentials.
  3. Click login.
- **Expected**
  - Login shows an error message and user stays on login page.
- **Notes**
  - Current `login.ts` does not check `success` returned by `AuthService.login()`. UAT should verify and log as defect if navigation still proceeds.

### UAT-B03 — Access protected page without token
- **Precondition**: Clear browser storage (localStorage/sessionStorage)
- **Steps**
  1. Open `/#/main/performance` directly.
- **Expected**
  - User is blocked and redirected to login or shown permission dialog.
- **Notes**
  - Current guard default permissions include `overview`. UAT should verify whether unauthenticated user can still reach overview; if yes and not intended, log defect.

### UAT-B04 — Permission denied shows dialog and routes back to safe page
- **Precondition**: Login as `UAT_USER_LIMITED` with no access to `admin`
- **Steps**
  1. Navigate to `/#/main/admin`.
- **Expected**
  - Permission dialog appears.
  - App routes to `defaultRoute` (from `AppInitService.defaultRoute`).

### UAT-B05 — Session “navigate” resume after login
- **Precondition**: Not logged in
- **Steps**
  1. Attempt to open a protected page, e.g. `/#/main/trend`.
  2. Confirm you are blocked.
  3. Login with a user who has permission.
- **Expected**
  - App returns user to the originally requested page (uses `sessionStorage.navigate`).

### UAT-B06 — Logout clears session and returns to login
- **Precondition**: Logged in
- **Steps**
  1. Click logout in navbar.
- **Expected**
  - localStorage cleared.
  - App routes to `/#/login`.

### UAT-B07 — Token header injection for API requests
- **Precondition**: Logged in
- **Steps**
  1. Open browser devtools → Network.
  2. Trigger any API call (e.g. load overview).
- **Expected**
  - Requests include `Authorization` header containing the stored token.
  - Requests include `user` header with username (if backend expects it).

### UAT-B08 — Handling 401/403 forces re-login
- **Precondition**: Logged in
- **Steps**
  1. Expire token server-side or set an invalid token in localStorage.
  2. Trigger any API call.
- **Expected**
  - App redirects to `/#/login`.
- **Notes**
  - Current interceptor redirects but does not clear local storage/state; verify user experience and log defect if needed.

---

## C. Navigation & layout (Navbar)

### UAT-C01 — Navbar loads user/role and site list filters by access
- **Precondition**: Logged in; localStorage has `sites` list
- **Steps**
  1. Open `/#/main/overview`.
  2. Observe user display and site selection options.
- **Expected**
  - Username and role appear.
  - Site list is filtered to only allowed sites (`sites`).

### UAT-C02 — Theme toggle persists
- **Precondition**: Logged in
- **Steps**
  1. Toggle theme (dark ↔ light).
  2. Reload browser.
- **Expected**
  - Theme remains as last chosen (uses `localStorage.theme`).
  - Logo switches correctly (`logo-dark.png`/`logo-light.png`).

### UAT-C03 — Date selector updates global state
- **Precondition**: Logged in; date picker enabled in UI for relevant pages
- **Steps**
  1. Select a new date in navbar.
  2. Navigate to a page that uses date filters (e.g. trend/tabular).
- **Expected**
  - Data reflects selected date range (or UI indicates applied date).

### UAT-C04 — Event summary refresh timer
- **Precondition**: Logged in; `Timer` set in config (minutes)
- **Steps**
  1. Open page and note event summary counters.
  2. Wait for at least one timer interval.
- **Expected**
  - Event summary auto-refreshes without user action.

---

## D. Overview (Central)

### UAT-D01 — Overview page renders core widgets
- **Precondition**: Logged in with access to `overview`
- **Steps**
  1. Open `/#/main/overview`.
- **Expected**
  - Page renders without console errors.
  - Site/zone filtering works (if present in UI).

### UAT-D02 — Map components render (Leaflet)
- **Precondition**: Overview map is enabled and site coordinates exist
- **Steps**
  1. Open overview map view.
  2. Zoom/pan; click markers (if any).
- **Expected**
  - Map tiles load.
  - Popups show readable content with correct theme styles.

---

## E. Performance / Trend / Tabular (Central)

### UAT-E01 — Performance data loads for allowed user
- **Precondition**: Logged in with `performance` permission
- **Steps**
  1. Open `/#/main/performance`.
  2. Select a site and date range (if available).
- **Expected**
  - Charts/tables show data (no empty state unless truly no data).

### UAT-E02 — Trend chart loads and reacts to filters
- **Precondition**: Logged in with `trend` permission
- **Steps**
  1. Open `/#/main/trend`.
  2. Change time range/interval options.
- **Expected**
  - Chart refreshes accordingly and remains responsive.

### UAT-E03 — Tabular data supports sorting/filtering/export (if UI provides)
- **Precondition**: Logged in with `tabular` permission
- **Steps**
  1. Open `/#/main/tabular`.
  2. Apply a filter and/or sort a column.
  3. Export to Excel (if provided).
- **Expected**
  - Data updates correctly after filter/sort.
  - Exported file contains the same filtered dataset.

---

## F. Events (Central)

### UAT-F01 — Events list loads for today
- **Precondition**: Logged in with `events` permission; event service is available
- **Steps**
  1. Open `/#/main/events`.
- **Expected**
  - Event list displays.
  - Severity indicators (major/minor/warning/info) show correctly.

### UAT-F02 — Filtered events search
- **Precondition**: Events page supports filter inputs
- **Steps**
  1. Apply filter (site, severity, text).
  2. Submit filter.
- **Expected**
  - Results match filter criteria.

---

## G. Sites pages (Layout/Dashboard/Efficiency/Realtime/Diagram/Charts/Event/Report)

### UAT-G01 — Switch to site mode resets page states
- **Precondition**: Logged in; multiple sites available
- **Steps**
  1. From `overview`, switch nav state to a site page (e.g. `layout`).
  2. Then navigate between `dashboard`, `diagram`, `realtime`.
- **Expected**
  - Navigation works and previous page-specific state is cleared (no stale data bleeding across pages).

### UAT-G02 — Realtime page shows current values and refresh behavior
- **Precondition**: Logged in with `realtime` permission; backend `getrealtime` works
- **Steps**
  1. Open `/#/main/realtime`.
  2. Change site/tag selection (if UI supports).
- **Expected**
  - Realtime values render.
  - Units/min/max display correctly.

### UAT-G03 — Diagram page renders and interactions work
- **Precondition**: Logged in with `diagram` permission
- **Steps**
  1. Open `/#/main/diagram`.
  2. Interact with diagram elements (click/hover) if available.
- **Expected**
  - Diagram loads with no missing assets.
  - Interactions show expected details.

### UAT-G04 — Charts page loads (Highcharts)
- **Precondition**: Logged in with `charts` permission; data available
- **Steps**
  1. Open `/#/main/charts`.
  2. Switch between chart types/series if UI provides.
- **Expected**
  - Chart renders and updates; no console errors.

### UAT-G05 — Site Event page loads and filters work
- **Precondition**: Logged in with site event permissions
- **Steps**
  1. Open `/#/main/event`.
  2. Apply site-scoped filters.
- **Expected**
  - Events displayed match selected site/time filter.

### UAT-G06 — Site Report page generates/downloads report PDF
- **Precondition**: Logged in; billing/report service endpoints available
- **Steps**
  1. Open `/#/main/report`.
  2. Select a report type and timestamp.
  3. Generate report.
  4. Download/open generated PDF.
- **Expected**
  - A PDF is generated and can be opened in a new tab and/or downloaded.

---

## H. Billing (Central) — configuration, workflow, documents

### UAT-H01 — Billing list view loads for a given project id
- **Precondition**: Logged in with `billing` permission; use a valid `:id`
- **Steps**
  1. Open `/#/main/billing/<id>` (replace `<id>` with real id).
- **Expected**
  - Billing records render (or empty state with clear message).

### UAT-H02 — Generate billing PDF and view/download
- **Precondition**: Billing data exists for chosen site/timestamp
- **Steps**
  1. From billing page, generate a billing document.
  2. Open viewer dialog (if provided).
  3. Download billing.
- **Expected**
  - PDF is generated and renders correctly.
  - Downloaded file name and content match the selected billing session.

### UAT-H03 — Approve billing workflow
- **Precondition**: Billing session ready for approval; user has permission
- **Steps**
  1. Approve billing.
- **Expected**
  - Status updates to approved.
  - Audit/log entry is created if the system supports logs.

### UAT-H04 — Confirmation internal review (approve/reject)
- **Precondition**: Workflow endpoints available
- **Steps**
  1. Generate confirmation.
  2. Perform internal review update.
  3. Reject internal review (negative path).
- **Expected**
  - Status transitions follow business rules.
  - Rejection requires a reason (if required by UI/backend).

### UAT-H05 — Customer review upload (invoice/payment/receipt)
- **Precondition**: Have sample PDF files for upload
- **Steps**
  1. Upload invoice customer document.
  2. Upload payment customer document.
  3. Upload receipt accounting document.
- **Expected**
  - Upload succeeds and appears in viewer/record.
  - File type restrictions enforced (if required).

### UAT-H06 — Billing config CRUD (Admin/Setting pages)
- **Precondition**: User has admin permission
- **Steps**
  1. Create a new billing config.
  2. Update the config.
  3. Delete the config.
- **Expected**
  - Create/update/delete succeed and list reflects changes.
  - Validation prevents incomplete configs.

### UAT-H07 — Billing logs CRUD
- **Precondition**: Billing logs endpoints available
- **Steps**
  1. Create log entry for a billing.
  2. Update log entry.
  3. Delete log entry.
- **Expected**
  - Logs reflect accurate timestamps and user actions.

### UAT-H08 — Billing states retrieval by timestamp/site
- **Precondition**: Billing states exist in system
- **Steps**
  1. Query billing states by site id.
  2. Query billing states by timestamp only.
  3. Query by site id + timestamp.
- **Expected**
  - Returned dataset matches query criteria.

---

## I. Billing Upload pages (standalone routes)

### UAT-I01 — Billing upload page loads and uploads file
- **Precondition**: Have valid session id and site id; sample billing PDF
- **Steps**
  1. Open `/#/billing-upload/<id>`.
  2. Select a file and upload.
- **Expected**
  - Upload succeeds and user gets success confirmation.

### UAT-I02 — Payment upload page loads and uploads file
- **Precondition**: Have valid session id and site id; sample payment PDF
- **Steps**
  1. Open `/#/payment-upload/<id>`.
  2. Select a file and upload.
- **Expected**
  - Upload succeeds and user gets success confirmation.

### UAT-I03 — Upload invalid file type (negative)
- **Precondition**: Have an unsupported file type (e.g. `.exe`)
- **Steps**
  1. Try uploading the unsupported file.
- **Expected**
  - App rejects file with clear error message.
  - No corrupted record created.

---

## J. Admin & Setting

### UAT-J01 — User management: list users
- **Precondition**: Admin user; backend `user/get` works
- **Steps**
  1. Open `/#/main/setting` → user config section (or relevant tab).
- **Expected**
  - Users list loads.
  - Sensitive fields (password) are not displayed.

### UAT-J02 — User management: create user
- **Precondition**: Admin user
- **Steps**
  1. Create a new user with minimal required fields.
  2. Login with the new user.
- **Expected**
  - New user appears in list.
  - New user can login and receives correct permissions/sites.

### UAT-J03 — User management: update user + signature
- **Precondition**: Admin user; an existing user
- **Steps**
  1. Update user info (role, pages, sites).
  2. Set user signature and reopen viewer.
- **Expected**
  - Updated values persist.
  - Signature is retrievable and displayed correctly.

### UAT-J04 — User management: change password
- **Precondition**: Existing user
- **Steps**
  1. Change password using UI.
  2. Verify old password no longer works.
  3. Verify new password works.
- **Expected**
  - Password change enforces required fields and shows success status.

### UAT-J05 — User management: delete user
- **Precondition**: Admin user; a deletable test user
- **Steps**
  1. Delete the test user.
  2. Attempt to login as deleted user.
- **Expected**
  - User removed from list.
  - Login fails for deleted user.

### UAT-J06 — Alarm tag config: get/set
- **Precondition**: Notification service available
- **Steps**
  1. Load alarm tag config.
  2. Update tag config and save.
- **Expected**
  - Saved config is persisted and reflected upon reload.

### UAT-J07 — Notification config CRUD
- **Precondition**: Notification service available
- **Steps**
  1. Add notification config.
  2. Update it.
  3. Delete it.
- **Expected**
  - CRUD works and UI list reflects changes.

### UAT-J08 — Expression parser
- **Precondition**: Notification calc endpoint available
- **Steps**
  1. Input a valid expression (e.g. `A+B*2`).
  2. Input an invalid expression (e.g. `A+*`).
- **Expected**
  - Valid expression returns parsed structure/result.
  - Invalid expression shows a clear validation error.

---

## K. Error handling & resilience

### UAT-K01 — API base URL down (network failure)
- **Precondition**: Temporarily set `UrlApi` to an unreachable host
- **Steps**
  1. Load a page that calls `UrlApi` (e.g. realtime/historian).
- **Expected**
  - App displays a non-blocking error state (toast/dialog) and remains usable for navigation.

### UAT-K02 — Billing service returns blob/PDF correctly
- **Precondition**: Billing/report endpoints respond with PDF
- **Steps**
  1. Download report/billing.
  2. Open in a new tab.
- **Expected**
  - PDF opens without corruption; correct content type.

### UAT-K03 — Large dataset performance (trend/tabular)
- **Precondition**: Choose a time range that returns a large dataset
- **Steps**
  1. Load trend/tabular with large range.
  2. Interact with filters/sorts.
- **Expected**
  - App remains responsive; no browser freeze.

---

## Appendix: Quick smoke checklist (10 minutes)
- [ ] App loads and lands on `overview` (or login if required)
- [ ] Login works with a valid user
- [ ] Token is attached to API requests
- [ ] Permission denied blocks access to `admin` for limited user
- [ ] Overview renders and map loads (if enabled)
- [ ] Trend loads and chart renders
- [ ] Events summary loads in navbar
- [ ] Billing page loads for a known id
- [ ] Report/billing PDF can be generated and opened
- [ ] Logout clears session and returns to login

