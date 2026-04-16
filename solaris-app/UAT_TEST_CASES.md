# UAT Test Cases - SOLARIS INSIGHT (Angular `solaris-app`)

### Document info
- **Project**: `C:\Users\phum7\Documents\BOONRAWD\solaris-app`
- **App name**: SOLARIS INSIGHT
- **Build/Run**: `npm run start` (dev), `npm run build` (prod)
- **Routing**: hash routing (`useHash: true`) -> URLs like `/#/main/overview`
- **Basis used for this revision**:
  - Current routes and page flows in `src/app/app.routes.ts`
  - Runtime behavior in page components and interceptors

### Scope
Main user journeys covered by this UAT set:
- **Authentication**: login, logout, token/session handling, protected route access
- **Navigation**: navbar, site filtering, theme persistence, date state, auto-refresh summary
- **Central pages**: Overview, Performance, Trend, Tabular, Events, Billing, Reports, Admin, Setting
- **Site pages**: Layout, Dashboard, Efficiency, Realtime, Diagram, Charts, Event, Report, Report Admin
- **Billing workflow**: billing state, viewer, approval/review, document upload, logs, config, report/billing PDF
- **Exports**: CSV, Excel, PNG, PDF preview/download
- **Resilience**: invalid config, invalid route params, missing assets, network/API failure

### Test prerequisites
- **UAT environment config**: `src/assets/config.json` must have valid URLs:
  - `UrlApi`
  - `UrlApiAuthen`
  - `UrlApiBilling`
  - `UrlApiNotification`
  - `Timer`
- **Test accounts**:
  - `UAT_ADMIN`: full page access and all sites
  - `UAT_USER_LIMITED`: limited pages and 1-2 sites
  - `UAT_NO_PERMISSION`: valid login but no effective page/site access
- **Test data**:
  - At least 1 site with realtime and historian data
  - At least 1 site with events/alarms for today
  - At least 1 billing session per major billing stage
  - Sample files for upload:
    - valid billing PDF
    - valid payment PDF
    - oversized PDF (>10MB)
    - invalid file type
    - incorrectly named billing PDF

### Conventions
- **Precondition**: required setup before steps
- **Steps**: tester actions
- **Expected**: required outcome
- **Notes**: implementation-specific risks or defects to verify

---

## A. App startup and configuration

### UAT-A01 - App loads and startup configuration is read
- **Precondition**: `assets/config.json` exists and is reachable
- **Steps**
  1. Open the app in browser.
  2. Observe first navigation destination.
- **Expected**
  - App loads without blank screen.
  - App lands on `/#/main/overview` or is redirected to login if auth is enforced by environment.

### UAT-A02 - Missing or invalid config degrades safely
- **Precondition**: Temporarily break or rename `assets/config.json`
- **Steps**
  1. Reload the app.
- **Expected**
  - App does not enter infinite loading.
  - User sees usable shell or a clear error state.
  - Subsequent API failures are observable and diagnosable.

---

## B. Authentication, token, and access control

### UAT-B01 - Login success stores token and navigates correctly
- **Precondition**: `UAT_ADMIN` exists and has access to `overview`
- **Steps**
  1. Open `/#/login`.
  2. Enter valid credentials.
  3. Click login.
- **Expected**
  - Token is stored in local storage key `token`.
  - User lands on default route, typically `/#/main/overview`.

### UAT-B02 - Login failure blocks navigation
- **Precondition**: Use wrong password for a valid username
- **Steps**
  1. Open `/#/login`.
  2. Enter invalid credentials.
  3. Click login.
- **Expected**
  - Login shows an error message.
  - User remains on login page.
- **Notes**
  - Current implementation should be verified carefully. If navigation still proceeds, log a defect.

### UAT-B03 - Protected page cannot be opened without token
- **Precondition**: Clear `localStorage` and `sessionStorage`
- **Steps**
  1. Open `/#/main/performance` directly.
- **Expected**
  - User is blocked from protected content.
  - User is redirected to login or sees permission handling per current implementation.

### UAT-B04 - Permission denied returns user to safe page
- **Precondition**: Login as `UAT_USER_LIMITED` without access to `admin`
- **Steps**
  1. Navigate to `/#/main/admin`.
- **Expected**
  - Permission dialog or equivalent denial feedback is shown.
  - App routes user back to a safe/default route.

### UAT-B05 - Intended route resumes after login
- **Precondition**: Not logged in
- **Steps**
  1. Open `/#/main/trend`.
  2. Confirm access is blocked.
  3. Login with a user who has permission.
- **Expected**
  - App returns user to the originally requested page.

### UAT-B06 - Logout clears client state and returns to login
- **Precondition**: Logged in
- **Steps**
  1. Click logout.
- **Expected**
  - Auth-related local storage is cleared.
  - User returns to `/#/login`.

### UAT-B07 - Token and user headers are attached to API calls
- **Precondition**: Logged in
- **Steps**
  1. Open browser devtools network tab.
  2. Trigger any authenticated API call.
- **Expected**
  - Request includes `Authorization` header containing current token.
  - Request includes `user` header if backend expects it.

### UAT-B08 - 401 or 403 response forces clean re-login
- **Precondition**: Logged in
- **Steps**
  1. Expire token server-side or manually replace it with an invalid token.
  2. Trigger any API call.
- **Expected**
  - App redirects to `/#/login`.
  - Both `localStorage` and `sessionStorage` are cleared.
  - No stale user/session state remains after re-login.

---

## C. Navigation and layout

### UAT-C01 - Navbar shows user, role, and allowed site list
- **Precondition**: Logged in with stored `sites` and `role`
- **Steps**
  1. Open `/#/main/overview`.
  2. Observe navbar.
- **Expected**
  - Username and role are displayed.
  - Site selector shows only allowed sites.

### UAT-C02 - Theme toggle persists after reload
- **Precondition**: Logged in
- **Steps**
  1. Toggle theme.
  2. Reload browser.
- **Expected**
  - Selected theme persists.
  - Theme-specific branding/logo is correct.

### UAT-C03 - Date selector updates shared state
- **Precondition**: Logged in
- **Steps**
  1. Change date in navbar.
  2. Open a page that consumes date-based filters.
- **Expected**
  - Page reflects new date or date range correctly.

### UAT-C04 - Event summary refreshes by timer
- **Precondition**: Logged in and `Timer` is configured
- **Steps**
  1. Observe event summary counters.
  2. Wait for one refresh interval.
- **Expected**
  - Counters refresh automatically without full page reload.

---

## D. Overview

### UAT-D01 - Overview page renders core widgets
- **Precondition**: Logged in with `overview` access
- **Steps**
  1. Open `/#/main/overview`.
- **Expected**
  - Page renders successfully.
  - No blocking console errors.
  - Site or zone filters work if present.

### UAT-D02 - Overview map renders and is usable
- **Precondition**: Map feature enabled and coordinates exist
- **Steps**
  1. Open map section.
  2. Pan, zoom, and click markers.
- **Expected**
  - Map tiles load.
  - Marker popup content is readable and correct.

---

## E. Performance, Trend, and Tabular

### UAT-E01 - Central Performance loads with valid data
- **Precondition**: Logged in with `performance` permission
- **Steps**
  1. Open `/#/main/performance`.
  2. Apply site and date selections.
- **Expected**
  - Page loads data correctly.
  - Empty state appears only when data is truly unavailable.

### UAT-E02 - Trend chart reacts to filter changes
- **Precondition**: Logged in with `trend` permission
- **Steps**
  1. Open `/#/main/trend`.
  2. Change time range or interval.
- **Expected**
  - Chart refreshes correctly and stays responsive.

### UAT-E03 - Tabular page supports sort, filter, and export
- **Precondition**: Logged in with `tabular` permission
- **Steps**
  1. Open `/#/main/tabular`.
  2. Filter rows and sort a column.
  3. Export if export button is available.
- **Expected**
  - Filter and sort results are correct.
  - Exported file reflects current filtered data.

### UAT-E04 - Large dataset remains usable
- **Precondition**: Choose a time range that returns large historian volume
- **Steps**
  1. Load trend or tabular with large range.
  2. Interact with chart/table.
- **Expected**
  - Browser remains responsive.
  - No crash or freeze.

---

## F. Events (Central)

### UAT-F01 - Events list loads for selected date range
- **Precondition**: Logged in with `events` permission
- **Steps**
  1. Open `/#/main/events`.
- **Expected**
  - Event list loads successfully.
  - Severity labels display correctly.

### UAT-F02 - Events filtering returns correct subset
- **Precondition**: Event list contains multiple event types or severities
- **Steps**
  1. Apply filters by site, severity, equipment, or type.
  2. Submit filter.
- **Expected**
  - Returned rows match selected filter criteria.

### UAT-F03 - Events export downloads CSV matching current result set
- **Precondition**: Events list contains at least 1 row after filtering
- **Steps**
  1. Apply filters or date range.
  2. Export the event list.
- **Expected**
  - CSV file downloads successfully.
  - Exported rows match the currently displayed rows.
  - File name reflects selected date range.

---

## G. Site pages (Layout, Dashboard, Efficiency, Realtime, Diagram, Charts, Event, Report, Report Admin)

### UAT-G01 - Switching to site mode clears stale page state
- **Precondition**: Logged in with multiple sites
- **Steps**
  1. Go from `overview` to `layout`.
  2. Navigate across `dashboard`, `diagram`, and `realtime`.
- **Expected**
  - Navigation works normally.
  - State from previous site page does not bleed into next page.

### UAT-G02 - Realtime page shows current values correctly
- **Precondition**: Logged in with `realtime` permission
- **Steps**
  1. Open `/#/main/realtime`.
  2. Change site or tag selection if available.
- **Expected**
  - Current values render.
  - Units and limits display correctly.

### UAT-G03 - Diagram page renders SVG and interactions work
- **Precondition**: Logged in with `diagram` permission
- **Steps**
  1. Open `/#/main/diagram`.
  2. Interact with clickable or hoverable elements.
- **Expected**
  - Diagram loads without missing assets.
  - Interaction shows the expected tag/device details.

### UAT-G04 - Charts page loads and responds to chart-type changes
- **Precondition**: Logged in with `charts` permission
- **Steps**
  1. Open `/#/main/charts`.
  2. Load chart data.
  3. Switch chart type.
- **Expected**
  - Charts render without console errors.
  - Selected chart type is applied correctly.

### UAT-G05 - Site Event page loads and filters correctly
- **Precondition**: Logged in with site event permission
- **Steps**
  1. Open `/#/main/event`.
  2. Apply site-scoped filters and date range.
- **Expected**
  - Rows match selected filters.

### UAT-G06 - Site Event page exports CSV
- **Precondition**: Site event list contains at least 1 row
- **Steps**
  1. Open `/#/main/event`.
  2. Apply filters.
  3. Export the event list.
- **Expected**
  - CSV file downloads successfully.
  - Exported rows match the filtered list.

### UAT-G07 - Site Report page generates and downloads PDF
- **Precondition**: Logged in with `report` permission
- **Steps**
  1. Open `/#/main/report`.
  2. Select report type and date.
  3. Generate preview.
  4. Download report.
- **Expected**
  - PDF preview loads successfully.
  - Downloaded PDF matches the selected report parameters.

### UAT-G08 - Site Report page validates required report type
- **Precondition**: Logged in with `report` permission
- **Steps**
  1. Open `/#/main/report`.
  2. Leave report type empty.
  3. Try preview and download.
- **Expected**
  - Both actions are blocked.
  - User sees a clear validation message.

### UAT-G09 - Charts page exports PNG snapshot
- **Precondition**: Chart data is already rendered
- **Steps**
  1. Open `/#/main/charts`.
  2. Click image export or capture.
- **Expected**
  - PNG file downloads successfully.
  - Captured image reflects the current chart view.

### UAT-G10 - Report Admin saves global report email settings
- **Precondition**: Logged in with `report-admin` access
- **Steps**
  1. Open `/#/main/report-admin`.
  2. Change global receiver settings.
  3. Save.
- **Expected**
  - Save succeeds.
  - Same values appear again after reload.

### UAT-G11 - Report Admin site config CRUD works
- **Precondition**: Logged in with `report-admin` access
- **Steps**
  1. Add a site-specific config.
  2. Edit it.
  3. Delete it.
- **Expected**
  - Create, update, and delete succeed.
  - List reflects latest state after each action.

### UAT-G12 - Report Admin validates email list format
- **Precondition**: Logged in with `report-admin` access
- **Steps**
  1. Enter invalid email text and save.
  2. Enter valid comma-separated emails and save again.
- **Expected**
  - Invalid format is rejected.
  - Valid comma-separated addresses are accepted.

---

## H. Billing (Central)

### UAT-H01 - Billing page loads for valid route id
- **Precondition**: Logged in with `billing` permission and valid `:id`
- **Steps**
  1. Open `/#/main/billing/<id>`.
- **Expected**
  - Billing records or a clear empty state are shown.

### UAT-H02 - Billing PDF preview and download work
- **Precondition**: Billing data exists for selected site and timestamp
- **Steps**
  1. Generate billing document.
  2. Open viewer dialog.
  3. Download document.
- **Expected**
  - PDF renders correctly in viewer.
  - Download succeeds and content is valid.

### UAT-H03 - Billing approval updates status correctly
- **Precondition**: Billing entry is ready for approval
- **Steps**
  1. Approve billing.
- **Expected**
  - Status changes according to workflow.
  - Relevant log or audit entry is visible if supported.

### UAT-H04 - Internal confirmation supports approve and reject paths
- **Precondition**: Workflow endpoint available and test entry exists
- **Steps**
  1. Generate confirmation.
  2. Approve it.
  3. Repeat with reject path.
- **Expected**
  - Status transitions follow business rules.
  - Reject path requires reason if configured by UI or backend.

### UAT-H05 - Customer or accounting document upload works from billing workflow
- **Precondition**: Valid billing entry and sample files available
- **Steps**
  1. Upload invoice-related customer document.
  2. Upload payment-related customer document.
  3. Upload receipt-related accounting document.
- **Expected**
  - Upload succeeds only for valid stage and valid file.
  - Uploaded document appears in record or viewer.

### UAT-H06 - Billing config CRUD works
- **Precondition**: Admin-capable user
- **Steps**
  1. Create billing config.
  2. Update billing config.
  3. Delete billing config.
- **Expected**
  - All operations succeed.
  - Validation prevents incomplete or invalid data.

### UAT-H07 - Billing logs CRUD works
- **Precondition**: Billing logs endpoint available
- **Steps**
  1. Create a log.
  2. Update it.
  3. Delete it.
- **Expected**
  - Log data remains consistent and traceable.

### UAT-H08 - Billing states can be queried by site and timestamp
- **Precondition**: Billing states exist in system
- **Steps**
  1. Query by site only.
  2. Query by timestamp only.
  3. Query by site and timestamp together.
- **Expected**
  - Returned state data matches query criteria.

### UAT-H09 - Billing viewer handles missing or invalid document gracefully
- **Precondition**: Billing entry points to missing or invalid document
- **Steps**
  1. Open billing viewer dialog.
- **Expected**
  - Viewer does not crash.
  - User sees empty or error state instead of broken content.

### UAT-H10 - Central Reports page previews and downloads PDF
- **Precondition**: Logged in with `reports` permission
- **Steps**
  1. Open `/#/main/reports`.
  2. Select report type, site, and date.
  3. Preview report.
  4. Download report.
- **Expected**
  - PDF preview renders correctly.
  - Downloaded file matches selected parameters.

### UAT-H11 - Central Reports page validates required site and report type
- **Precondition**: Logged in with `reports` permission
- **Steps**
  1. Open `/#/main/reports`.
  2. Leave report type empty and try preview/download.
  3. Leave site empty and try preview/download.
- **Expected**
  - User is blocked in both cases.
  - Validation clearly identifies the missing field.

---

## I. Standalone upload pages

### UAT-I01 - Billing upload page accepts valid invoice-stage file
- **Precondition**: Valid encoded route id for invoice-stage billing and valid billing PDF
- **Steps**
  1. Open `/#/billing-upload/<id>`.
  2. Select valid PDF.
  3. Enter send date.
  4. Submit.
- **Expected**
  - Upload succeeds with success confirmation.
  - Workflow progresses only when billing state is `invoice`.

### UAT-I02 - Payment upload page accepts valid payment-stage file
- **Precondition**: Valid encoded route id for payment-stage billing and valid payment PDF
- **Steps**
  1. Open `/#/payment-upload/<id>`.
  2. Select valid PDF.
  3. Submit.
- **Expected**
  - Upload succeeds with success confirmation.
  - Workflow progresses only when billing state is `payment`.

### UAT-I03 - Invalid file type is rejected
- **Precondition**: Unsupported file type available
- **Steps**
  1. Try uploading unsupported file.
- **Expected**
  - App rejects the file with clear error message.
  - No corrupted record is created.

### UAT-I04 - Billing upload rejects wrong filename pattern
- **Precondition**: PDF file name does not match `Invoice_Billing_<SITE>_YYYY-MM.pdf`
- **Steps**
  1. Open `/#/billing-upload/<id>`.
  2. Select incorrectly named PDF.
- **Expected**
  - App rejects file with filename format error.
  - File is not retained in upload list.

### UAT-I05 - Upload rejects file larger than 10MB
- **Precondition**: PDF file larger than 10MB
- **Steps**
  1. Open billing or payment upload page.
  2. Select oversized PDF.
- **Expected**
  - App blocks the upload.
  - No upload request is sent.

### UAT-I06 - Billing upload requires send date
- **Precondition**: Valid billing upload link and valid PDF selected
- **Steps**
  1. Open `/#/billing-upload/<id>`.
  2. Select valid PDF.
  3. Leave send date empty.
  4. Click submit.
- **Expected**
  - Submit is blocked.
  - User is asked to select send date.

### UAT-I07 - Invalid or malformed encoded route id is rejected
- **Precondition**: Invalid `:id` that cannot be decoded or lacks required fields
- **Steps**
  1. Open upload page with invalid id.
- **Expected**
  - App rejects route input and redirects user away from page.
  - No upload action is possible.

### UAT-I08 - Upload link requires logged-in user context
- **Precondition**: Clear browser storage so `user` does not exist
- **Steps**
  1. Open a valid upload link directly.
- **Expected**
  - App shows login-related error and routes to `/#/login`.

### UAT-I09 - Upload link is blocked when billing stage is wrong
- **Precondition**: Valid encoded id but billing state is not expected stage
- **Steps**
  1. Open `/#/billing-upload/<id>` for non-invoice state.
  2. Open `/#/payment-upload/<id>` for non-payment state.
- **Expected**
  - App blocks the action.
  - User is redirected away with explanatory error.

### UAT-I10 - Payment upload accepted file types match runtime validation
- **Precondition**: Sample `.pdf`, `.jpg`, and `.png` files available
- **Steps**
  1. Open `/#/payment-upload/<id>`.
  2. Try each file type.
- **Expected**
  - Actual runtime acceptance or rejection is documented.
  - If UI hint and runtime validation differ, log as defect.

---

## J. Admin and Setting

### UAT-J01 - User list loads without exposing password fields
- **Precondition**: Admin user
- **Steps**
  1. Open user management section in `/#/main/setting`.
- **Expected**
  - User list loads successfully.
  - Password fields are not displayed in list view.

### UAT-J02 - Create user works end to end
- **Precondition**: Admin user
- **Steps**
  1. Create user with minimum required fields.
  2. Login with new user.
- **Expected**
  - User is created successfully.
  - New login behaves according to assigned permissions and sites.

### UAT-J03 - Update user profile and signature works
- **Precondition**: Existing user
- **Steps**
  1. Update role, pages, or sites.
  2. Upload or set signature.
  3. Reopen user record or dependent view.
- **Expected**
  - Updated values persist.
  - Signature is retrievable and displayed correctly.

### UAT-J04 - Password change invalidates old password
- **Precondition**: Existing user
- **Steps**
  1. Change password.
  2. Try old password.
  3. Try new password.
- **Expected**
  - Old password fails.
  - New password works.

### UAT-J05 - Delete user prevents future login
- **Precondition**: Deletable test user exists
- **Steps**
  1. Delete the test user.
  2. Try logging in as deleted user.
- **Expected**
  - User disappears from list.
  - Login fails.

### UAT-J06 - Alarm tag config save and reload works
- **Precondition**: Notification service available
- **Steps**
  1. Open alarm tag config.
  2. Modify and save.
  3. Reload page.
- **Expected**
  - Saved config persists and reloads correctly.

### UAT-J07 - Notification config CRUD works
- **Precondition**: Notification service available
- **Steps**
  1. Create config.
  2. Update config.
  3. Delete config.
- **Expected**
  - CRUD actions succeed and are reflected in UI.

### UAT-J08 - Expression parser handles valid and invalid formulas
- **Precondition**: Notification calc endpoint available
- **Steps**
  1. Enter valid expression such as `A+B*2`.
  2. Enter invalid expression such as `A+*`.
- **Expected**
  - Valid expression returns parse result.
  - Invalid expression returns clear validation feedback.

---

## K. Error handling and resilience

### UAT-K01 - Main API base URL outage does not break whole app shell
- **Precondition**: Temporarily point `UrlApi` to unreachable host
- **Steps**
  1. Open page that requires main API.
- **Expected**
  - Error is visible to tester.
  - App shell remains navigable.

### UAT-K02 - Billing and report PDF responses open without corruption
- **Precondition**: Billing or report endpoint returns valid PDF blob
- **Steps**
  1. Download report or billing document.
  2. Open downloaded file.
- **Expected**
  - PDF opens successfully.
  - Content type and file integrity are correct.

### UAT-K03 - Missing asset or config file on file-driven pages degrades gracefully
- **Precondition**: Temporarily rename one referenced asset or config file
- **Steps**
  1. Open page such as `diagram`, `report`, or `events`.
- **Expected**
  - App does not collapse into blank screen.
  - User can still navigate or sees clear empty/error state.

### UAT-K04 - Invalid route or unknown path goes to not found flow
- **Precondition**: App is reachable
- **Steps**
  1. Open an unknown hash route.
- **Expected**
  - App routes to not found screen or equivalent fallback.

---

## Appendix: Quick smoke checklist
- [ ] App loads and lands on overview or login
- [ ] Login works with valid user
- [ ] Protected route blocks unauthorized access
- [ ] Token is attached to API requests
- [ ] 401 or 403 redirects cleanly to login
- [ ] Overview renders
- [ ] Trend loads with chart
- [ ] Events summary loads in navbar
- [ ] Events export works
- [ ] Billing page opens for known id
- [ ] Central Reports preview and download work
- [ ] Site Report preview and download work
- [ ] Upload pages reject invalid file, invalid stage, and invalid route input
- [ ] Logout clears session and returns to login
