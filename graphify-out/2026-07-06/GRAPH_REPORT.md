# Graph Report - HRMS  (2026-07-06)

## Corpus Check
- 141 files · ~73,301 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 866 nodes · 2044 edges · 63 communities (42 shown, 21 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 163 edges (avg confidence: 0.56)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `19c04949`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin API Layer|Admin API Layer]]
- [[_COMMUNITY_Employee CRUD Commands|Employee CRUD Commands]]
- [[_COMMUNITY_Client Routing & Pages|Client Routing & Pages]]
- [[_COMMUNITY_Assets, Expenses & Meetings|Assets, Expenses & Meetings]]
- [[_COMMUNITY_Attendance & Payroll APIs|Attendance & Payroll APIs]]
- [[_COMMUNITY_Employee Self-Service|Employee Self-Service]]
- [[_COMMUNITY_Manager Queries|Manager Queries]]
- [[_COMMUNITY_Security & Rate Limiting|Security & Rate Limiting]]
- [[_COMMUNITY_Payroll Calculation Engine|Payroll Calculation Engine]]
- [[_COMMUNITY_Project Management APIs|Project Management APIs]]
- [[_COMMUNITY_Server Dependencies|Server Dependencies]]
- [[_COMMUNITY_Client Dependencies|Client Dependencies]]
- [[_COMMUNITY_Attendance Commands & Queries|Attendance Commands & Queries]]
- [[_COMMUNITY_Leave & WFH Management|Leave & WFH Management]]
- [[_COMMUNITY_Payroll Queries & PDF|Payroll Queries & PDF]]
- [[_COMMUNITY_Express App Bootstrap|Express App Bootstrap]]
- [[_COMMUNITY_SaaS Enterprise Commands|SaaS Enterprise Commands]]
- [[_COMMUNITY_SaaS Enterprise APIs|SaaS Enterprise APIs]]
- [[_COMMUNITY_Document Queries & PDF|Document Queries & PDF]]
- [[_COMMUNITY_Admin Route Aggregation|Admin Route Aggregation]]
- [[_COMMUNITY_Document Commands & Generation|Document Commands & Generation]]
- [[_COMMUNITY_Holiday Management|Holiday Management]]
- [[_COMMUNITY_Document Client APIs|Document Client APIs]]
- [[_COMMUNITY_Auth Flow & Login Pages|Auth Flow & Login Pages]]
- [[_COMMUNITY_Database Configuration|Database Configuration]]
- [[_COMMUNITY_Announcement CRUD|Announcement CRUD]]
- [[_COMMUNITY_Project Commands|Project Commands]]
- [[_COMMUNITY_Auth Middleware & Enterprise|Auth Middleware & Enterprise]]
- [[_COMMUNITY_React App & Auth Context|React App & Auth Context]]
- [[_COMMUNITY_Layout & Navigation Shell|Layout & Navigation Shell]]
- [[_COMMUNITY_Department CRUD|Department CRUD]]
- [[_COMMUNITY_Admin Dashboard Queries|Admin Dashboard Queries]]
- [[_COMMUNITY_Graphify Tooling|Graphify Tooling]]
- [[_COMMUNITY_HR Document Templates|HR Document Templates]]
- [[_COMMUNITY_employeeRoutes.js|employeeRoutes.js]]
- [[_COMMUNITY_Project Queries|Project Queries]]
- [[_COMMUNITY_SaaS Queries|SaaS Queries]]
- [[_COMMUNITY_reviewController.js|reviewController.js]]
- [[_COMMUNITY_Project Route Config|Project Route Config]]
- [[_COMMUNITY_Empty State Components|Empty State Components]]
- [[_COMMUNITY_SQL Injection Sanitizer|SQL Injection Sanitizer]]
- [[_COMMUNITY_JWT Token Generation|JWT Token Generation]]
- [[_COMMUNITY_Server Entry Point|Server Entry Point]]
- [[_COMMUNITY_OTP Generation|OTP Generation]]
- [[_COMMUNITY_Token Utility|Token Utility]]
- [[_COMMUNITY_Nexora Brand Icon|Nexora Brand Icon]]
- [[_COMMUNITY_Nexora Brand Logo|Nexora Brand Logo]]
- [[_COMMUNITY_graphify|graphify.md]]
- [[_COMMUNITY_ProtectedRoute.jsx|ProtectedRoute.jsx]]
- [[_COMMUNITY_Graphify Output Directories|Graphify Output Directories]]
- [[_COMMUNITY_Graphify Path Tool|Graphify Path Tool]]
- [[_COMMUNITY_Graphify Query Tool|Graphify Query Tool]]
- [[_COMMUNITY_Graphify Knowledge Graph Rules|Graphify Knowledge Graph Rules]]
- [[_COMMUNITY_Graphify Update Tool|Graphify Update Tool]]
- [[_COMMUNITY_Graphify Skill|Graphify Skill]]
- [[_COMMUNITY_Graphify Workflow|Graphify Workflow]]
- [[_COMMUNITY_meetingController.js|meetingController.js]]
- [[_COMMUNITY_adminQueries.js|adminQueries.js]]
- [[_COMMUNITY_enterpriseRoutes.js|enterpriseRoutes.js]]
- [[_COMMUNITY_projectRoutes.js|projectRoutes.js]]
- [[_COMMUNITY_AuthContext.jsx|AuthContext.jsx]]
- [[_COMMUNITY_server.js|server.js]]

## God Nodes (most connected - your core abstractions)
1. `getOrCreateEmployeeForUser()` - 36 edges
2. `formatDate()` - 35 edges
3. `useApi()` - 33 edges
4. `Card()` - 31 edges
5. `Button()` - 30 edges
6. `PageLoader()` - 30 edges
7. `useAuth()` - 30 edges
8. `CardContent()` - 26 edges
9. `CardHeader()` - 19 edges
10. `CardTitle()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `PayslipPage()` --indirect_call--> `getMyPayrolls()`  [INFERRED]
  client/src/pages/employee/PayslipPage.jsx → client/src/api/payrollApi.js
- `getMyAssets()` --calls--> `getOrCreateEmployeeForUser()`  [EXTRACTED]
  server/src/controllers/assetController.js → server/src/controllers/queries/employeeQueries.js
- `getMeetings()` --calls--> `getOrCreateEmployeeForUser()`  [EXTRACTED]
  server/src/controllers/meetingController.js → server/src/controllers/queries/employeeQueries.js
- `getMyReviews()` --calls--> `getOrCreateEmployeeForUser()`  [EXTRACTED]
  server/src/controllers/reviewController.js → server/src/controllers/queries/employeeQueries.js
- `submitSelfAppraisal()` --calls--> `getOrCreateEmployeeForUser()`  [EXTRACTED]
  server/src/controllers/reviewController.js → server/src/controllers/queries/employeeQueries.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **HR Document Generation Templates** — server_src_templates_employmentverification_template, server_src_templates_experienceletter_template, server_src_templates_nocletter_template, server_src_templates_offerletter_template, server_src_templates_payslip_template, server_src_templates_salarycertificate_template [INFERRED 0.85]

## Communities (63 total, 21 thin omitted)

### Community 0 - "Admin API Layer"
Cohesion: 0.08
Nodes (76): createAnnouncement(), createDepartment(), createHoliday(), deleteAnnouncement(), deleteDepartment(), deleteHoliday(), getAnalytics(), getAnnouncements() (+68 more)

### Community 1 - "Employee CRUD Commands"
Cohesion: 0.05
Nodes (64): {
  applyApprovedRequestToAttendance,
}, approveLeave(), approveWfh(), createLeave(), createWfh(), db, { getOrCreateEmployeeForUser }, hasPendingLeaveOrWfhRequest() (+56 more)

### Community 2 - "Client Routing & Pages"
Cohesion: 0.05
Nodes (39): AdminDashboardPage, AdminProfilePage, AdminProjectsPage, AnalyticsPage, AnnouncementsPage, AppraisalsPage, AssetsPage, AttendancePage (+31 more)

### Community 3 - "Assets, Expenses & Meetings"
Cohesion: 0.22
Nodes (11): checkIn(), checkOut(), db, { getOrCreateEmployeeForUser }, getWorkedHours(), normalizeDate(), adminAttendanceRouter, {
  checkIn,
  checkOut,
} (+3 more)

### Community 4 - "Attendance & Payroll APIs"
Cohesion: 0.13
Nodes (27): checkIn(), checkOut(), getAllAttendance(), getManageBase(), getMyAttendance(), getSelfBase(), api, changeMyPassword() (+19 more)

### Community 5 - "Employee Self-Service"
Cohesion: 0.19
Nodes (11): bcrypt, changeMyPassword(), { createAndSendOtp, verifyOtp }, db, { getOrCreateEmployeeForUser }, requestChangePasswordOtp(), updateMyProfile(), createAndSendOtp() (+3 more)

### Community 6 - "Manager Queries"
Cohesion: 0.19
Nodes (18): bcrypt, createEmployee(), db, deleteEmployee(), normalizeRole(), {
  notifyTerminationAction,
  sendWelcomeCredentialsMail,
}, splitName(), updateEmployee() (+10 more)

### Community 7 - "Security & Rate Limiting"
Cohesion: 0.11
Nodes (18): MAIL_APP_PASSWORD, OTP_REQUIRED_EMAIL, apiLimiter, forgotPasswordLimiter, loginLimiter, loginSlowDown, otpLimiter, rateLimit (+10 more)

### Community 8 - "Payroll Calculation Engine"
Cohesion: 0.09
Nodes (40): buildPayrollFromEmployee(), calculatePayroll(), countWorkingDays(), createPayroll(), db, getAttendanceSummary(), getEmployeeOr404(), getMonthDateRange() (+32 more)

### Community 9 - "Project Management APIs"
Cohesion: 0.23
Nodes (19): assignMembers(), createProject(), createTask(), getAvailableEmployees(), getAvailableManagers(), getMyActiveTask(), getProjectDetails(), getProjects() (+11 more)

### Community 10 - "Server Dependencies"
Cohesion: 0.08
Nodes (23): dependencies, bcryptjs, cors, dotenv, express, express-rate-limit, express-slow-down, helmet (+15 more)

### Community 11 - "Client Dependencies"
Cohesion: 0.10
Nodes (19): dependencies, axios, lucide-react, react, react-dom, react-hot-toast, react-router-dom, recharts (+11 more)

### Community 12 - "Attendance Commands & Queries"
Cohesion: 0.12
Nodes (16): { adminAttendanceRouter, employeeAttendanceRouter }, { adminDocumentRouter, selfDocumentRouter }, { adminHolidayRouter }, { adminLeaveRouter, employeeLeaveRouter }, { adminPayrollRouter, employeePayrollRouter }, { adminWfhRouter, employeeWfhRouter }, announcementRoutes, departmentRoutes (+8 more)

### Community 13 - "Leave & WFH Management"
Cohesion: 0.17
Nodes (11): createExpenseClaim(), db, getMyExpenseClaims(), { getOrCreateEmployeeForUser }, getOrCreateEmployeeForUser(), db, getAdminLeaveRequests(), getAdminWfhRequests() (+3 more)

### Community 14 - "Payroll Queries & PDF"
Cohesion: 0.28
Nodes (8): login(), requestForgotPasswordOtp(), resendLoginOtp(), resetForgotPassword(), verifyLoginOtp(), ForgotPasswordPage(), LoginPage(), VerifyOtpPage()

### Community 15 - "Express App Bootstrap"
Cohesion: 0.11
Nodes (18): adminRoute, allowedOrigins, { apiLimiter }, app, authRoute, { connectDB }, cors, departmentRoutes (+10 more)

### Community 16 - "SaaS Enterprise Commands"
Cohesion: 0.14
Nodes (9): checkInGps(), createJobPosting(), db, getDistance(), { postJobToLinkedIn }, getMyProfileUrn(), https, linkedInPost() (+1 more)

### Community 17 - "SaaS Enterprise APIs"
Cohesion: 0.15
Nodes (12): { employeeAttendanceRouter }, { employeeHolidayRouter }, { employeeLeaveRouter }, { employeePayrollRouter }, { employeeWfhRouter }, express, {
  getEmployeeDashboardSummary,
  getMyProfile,
}, { protect, requireRole } (+4 more)

### Community 18 - "Document Queries & PDF"
Cohesion: 0.16
Nodes (16): db, downloadApprovedDocumentPdf(), downloadMyApprovedDocumentPdf(), getAdminDocumentRequests(), getApprovedDocumentHtml(), getMyApprovedDocumentHtml(), getMyDocumentRequests(), { getOrCreateEmployeeForUser } (+8 more)

### Community 19 - "Admin Route Aggregation"
Cohesion: 0.19
Nodes (10): createAnnouncement(), db, deleteAnnouncement(), db, getAnnouncements(), {
  createAnnouncement,
  deleteAnnouncement,
}, express, {
  getAnnouncements,
} (+2 more)

### Community 20 - "Document Commands & Generation"
Cohesion: 0.17
Nodes (14): allowedTypes, approveDocumentRequest(), createMyDocumentRequest(), db, formatCurrency(), { getOrCreateEmployeeForUser }, rejectDocumentRequest(), { renderDocumentHtml } (+6 more)

### Community 21 - "Holiday Management"
Cohesion: 0.17
Nodes (13): createHoliday(), db, deleteHoliday(), normalizeDate(), db, getHolidays(), normalizeDate(), adminHolidayRouter (+5 more)

### Community 22 - "Document Client APIs"
Cohesion: 0.29
Nodes (13): approveRequest(), createMyRequest(), downloadApprovedDocument(), downloadMyApprovedDocument(), getAdminBase(), getAdminRequests(), getMyRequests(), getSelfBase() (+5 more)

### Community 23 - "Auth Flow & Login Pages"
Cohesion: 0.25
Nodes (8): fs, multer, multerUpload, path, storage, upload, uploadAvatar(), uploadDir

### Community 24 - "Database Configuration"
Cohesion: 0.21
Nodes (11): connectDB(), ensureDatabaseExists(), fs, path, pool, { Pool, Client }, bcrypt, { Client } (+3 more)

### Community 25 - "Announcement CRUD"
Cohesion: 0.24
Nodes (8): createOrUpdatePayroll(), downloadAdminPayrollPdf(), downloadMyPayrollPdf(), getAdminPayrolls(), getMyBase(), getMyPayrollHtml(), getMyPayrolls(), PayrollPage()

### Community 27 - "Auth Middleware & Enterprise"
Cohesion: 0.12
Nodes (18): db, jwt, protect(), requireHRorAdmin(), requireManagerOrHRorAdmin(), requireRole(), assetCtrl, expenseCtrl (+10 more)

### Community 28 - "React App & Auth Context"
Cohesion: 0.28
Nodes (5): Nexora Client Entry Point, Nexora Root DOM Container, App(), PageShell(), AppRoutes()

### Community 29 - "Layout & Navigation Shell"
Cohesion: 0.24
Nodes (6): adminMenu, employeeMenu, managerMenu, Sidebar(), getAvatar(), getInitials()

### Community 30 - "Department CRUD"
Cohesion: 0.21
Nodes (9): createDepartment(), db, deleteDepartment(), db, getDepartments(), {
  createDepartment,
  deleteDepartment,
}, express, { getDepartments } (+1 more)

### Community 31 - "Admin Dashboard Queries"
Cohesion: 0.28
Nodes (15): approveLeave(), approveWfh(), createLeave(), createWfh(), getAllLeaveRequests(), getAllWfhRequests(), getManageBase(), getMyLeaveRequests() (+7 more)

### Community 33 - "HR Document Templates"
Cohesion: 0.61
Nodes (8): Employee Placeholder Data Structure, Employment Verification Letter Template, Experience Letter Template, HR Document Generation Concept, No Objection Certificate Template, Offer Letter Template, Payslip Template, Salary Certificate Template

### Community 34 - "employeeRoutes.js"
Cohesion: 0.20
Nodes (13): analytics(), dashboardSummary(), db, getEmployeeProfile(), getEmployees(), normalizeDate(), normalizeEmployeeDepartments(), ping() (+5 more)

### Community 37 - "reviewController.js"
Cohesion: 0.25
Nodes (4): db, getMyReviews(), { getOrCreateEmployeeForUser }, submitSelfAppraisal()

### Community 38 - "Project Route Config"
Cohesion: 0.29
Nodes (3): db, getMyAssets(), { getOrCreateEmployeeForUser }

### Community 40 - "SQL Injection Sanitizer"
Cohesion: 0.67
Nodes (3): sanitize(), sanitizeValue(), SQLI_PATTERNS

### Community 57 - "meetingController.js"
Cohesion: 0.29
Nodes (3): db, getMeetings(), { getOrCreateEmployeeForUser }

### Community 58 - "adminQueries.js"
Cohesion: 0.48
Nodes (6): db, endOfDay(), getAdminAttendance(), getMyAttendance(), { getOrCreateEmployeeForUser }, startOfDay()

### Community 59 - "enterpriseRoutes.js"
Cohesion: 0.48
Nodes (6): db, getEmployeeDashboardSummary(), getLeaveBalanceForYear(), getMyProfile(), getNormalizedDepartmentName(), normalizeDate()

### Community 60 - "projectRoutes.js"
Cohesion: 0.33
Nodes (5): commands, express, { protect, requireRole }, queries, router

### Community 61 - "AuthContext.jsx"
Cohesion: 0.60
Nodes (4): AuthContext, AuthProvider(), decodeToken(), isTokenValid()

## Knowledge Gaps
- **300 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+295 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PageLoader()` connect `Admin API Layer` to `Project Management APIs`, `Client Routing & Pages`, `Attendance & Payroll APIs`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `axios` connect `Client Dependencies` to `Attendance & Payroll APIs`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _300 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin API Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.07764050387596899 - nodes in this community are weakly interconnected._
- **Should `Employee CRUD Commands` be split into smaller, more focused modules?**
  _Cohesion score 0.052313883299798795 - nodes in this community are weakly interconnected._
- **Should `Client Routing & Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Attendance & Payroll APIs` be split into smaller, more focused modules?**
  _Cohesion score 0.1319073083778966 - nodes in this community are weakly interconnected._