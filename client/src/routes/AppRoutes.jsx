import { React, Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import PageShell from "../components/layout/PageShell";
import { PageLoader } from "../components/ui/Spinner";

// Lazy loading all pages for better performance
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const VerifyOtpPage = lazy(() => import("../pages/auth/VerifyOtpPage"));
const ForgotPasswordPage = lazy(
  () => import("../pages/auth/ForgotPasswordPage"),
);

// Admin Pages
const AdminDashboardPage = lazy(
  () => import("../pages/admin/AdminDashboardPage"),
);
const EmployeesPage = lazy(() => import("../pages/admin/EmployeesPage"));
const RegisterEmployeePage = lazy(
  () => import("../pages/admin/RegisterEmployeePage"),
);
const EmployeeProfilePage = lazy(
  () => import("../pages/admin/EmployeeProfilePage"),
);
const AttendancePage = lazy(() => import("../pages/admin/AttendancePage"));
const LeaveApprovalsPage = lazy(
  () => import("../pages/admin/LeaveApprovalsPage"),
);
const PayrollPage = lazy(() => import("../pages/admin/PayrollPage"));
const HolidaysPage = lazy(() => import("../pages/admin/HolidaysPage"));
const AnnouncementsPage = lazy(
  () => import("../pages/admin/AnnouncementsPage"),
);
const AnalyticsPage = lazy(() => import("../pages/admin/AnalyticsPage"));
const DepartmentsPage = lazy(() => import("../pages/admin/DepartmentsPage"));
const HRDocumentsPage = lazy(() => import("../pages/admin/HRDocumentsPage"));
const AdminProfilePage = lazy(() => import("../pages/admin/AdminProfilePage"));

// Manager Pages
const ManagerDashboardPage = lazy(
  () => import("../pages/manager/ManagerDashboardPage"),
);
const MyAttendancePage = lazy(
  () => import("../pages/manager/MyAttendancePage"),
);
const MyLeavePage = lazy(() => import("../pages/manager/MyLeavePage"));
const MyDocumentsPage = lazy(() => import("../pages/manager/MyDocumentsPage"));
const MyPayslipPage = lazy(() => import("../pages/manager/MyPayslipPage"));

// Employee Pages
const DashboardPage = lazy(() => import("../pages/employee/DashboardPage"));
const EmployeeAttendancePage = lazy(
  () => import("../pages/employee/AttendancePage"),
);
const EmployeeLeavePage = lazy(() => import("../pages/employee/LeavePage"));
const EmployeePayslipPage = lazy(() => import("../pages/employee/PayslipPage"));
const EmployeeHolidaysPage = lazy(
  () => import("../pages/employee/HolidaysPage"),
);
const EmployeeSelfProfilePage = lazy(
  () => import("../pages/employee/ProfilePage"),
);
const NotificationsPage = lazy(
  () => import("../pages/employee/NotificationsPage"),
);
const EmployeeDocumentsPage = lazy(
  () => import("../pages/employee/DocumentsPage"),
);

// Shared Pages
const EditProfilePage = lazy(() => import("../pages/shared/EditProfilePage"));
const AdminProjectsPage = lazy(
  () => import("../pages/admin/AdminProjectsPage"),
);
const ManagerProjectsPage = lazy(
  () => import("../pages/manager/ManagerProjectsPage"),
);
const EmployeeProjectsPage = lazy(
  () => import("../pages/employee/EmployeeProjectsPage"),
);
const SaaSWorkspace = lazy(() => import("../pages/shared/SaaSWorkspace"));
const ChangePasswordPage = lazy(
  () => import("../pages/shared/ChangePasswordPage"),
);
const ExpensesPage = lazy(() => import("../pages/shared/ExpensesPage"));
const AssetsPage = lazy(() => import("../pages/shared/AssetsPage"));
const AppraisalsPage = lazy(() => import("../pages/shared/AppraisalsPage"));
const MeetingsPage = lazy(() => import("../pages/shared/MeetingsPage"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected layout wrapped inside PageShell */}
        <Route element={<PageShell />}>
          {/* Admin Dashboard & features */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <EmployeesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register-employee"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <RegisterEmployeePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-employee-profile/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EmployeeProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/departments"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DepartmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave-approvals"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <LeaveApprovalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <PayrollPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/holidays"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <HolidaysPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr-documents"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <HRDocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-profile"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <AdminProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-projects"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminProjectsPage />
              </ProtectedRoute>
            }
          />

          {/* Manager Dashboard & features */}
          <Route
            path="/manager-dashboard"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <ManagerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager-attendance"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <MyAttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager-leave"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <MyLeavePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager-payslip"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <MyPayslipPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager-documents"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <MyDocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager-projects"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <ManagerProjectsPage />
              </ProtectedRoute>
            }
          />

          {/* Employee Dashboard & features */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-attendance"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeAttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-leave"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeLeavePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-payslip"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeePayslipPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-holidays"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeHolidaysPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-profile"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeSelfProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-notifications"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-documents"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeDocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-projects"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeProjectsPage />
              </ProtectedRoute>
            }
          />

          {/* Shared Pages */}
          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace"
            element={
              <ProtectedRoute>
                <SaaSWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <ExpensesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets"
            element={
              <ProtectedRoute>
                <AssetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appraisals"
            element={
              <ProtectedRoute>
                <AppraisalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meetings"
            element={
              <ProtectedRoute>
                <MeetingsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallbacks */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
