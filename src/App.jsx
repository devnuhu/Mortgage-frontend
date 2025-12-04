import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PMIProvider } from "./context/PMIContext";
import { ApplicationProvider } from "./context/ApplicationContext";
import { UserRole } from "./types/auth.jsx";

// Import components
import Login from "./components/auth/Login";
import PasswordChange from "./components/auth/PasswordChange";
import Header from "./components/shared/Header";
import Sidebar from "./components/shared/Sidebar";
import ClientDashboard from "./components/client/ClientDashboard";
import SubmitApplicationForm from "./components/client/SubmitApplicationForm";
import PendingApplications from "./components/client/PendingApplications";
import ManagePMI from "./components/admin/ManagePMI";
import AdminApplicationManagement from "./components/admin/AdminApplicationManagement";
import AdminUsers from "./components/admin/AdminUsers";
import Reports from "./components/admin/Reports";
import ReturnedDocs from "./components/client/ReturnedDocs";

// Import services for AdminDashboard
import { usePMI } from "./context/PMIContext";
import { getAllApplications } from "./services/applicationService";

// Dashboard Layout Component - FIXED FOR PROPER SCROLLING
const DashboardLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0">
        <Header />
      </div>

      {/* Main Layout Container - Flex row for sidebar + content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar - Fixed */}
        <div className="flex-shrink-0">
          <Sidebar
            isMobileOpen={isMobileMenuOpen}
            setIsMobileOpen={setIsMobileMenuOpen}
          />
        </div>

        {/* Main Content Area - Only this scrolls */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 pb-8 min-h-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

// Password Change Guard - Redirects if password change required
const PasswordChangeGuard = ({ children }) => {
  const { user, requiresPasswordChange } = useAuth();

  // Use the normalized auth state flag. Some backends store the flag on the
  // user object as `isFirstLogin`; auth state maintains `requiresPasswordChange`.
  if (requiresPasswordChange || user?.isFirstLogin || user?.IsFirstLogin) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

// STANDALONE ADMIN DASHBOARD COMPONENT
const AdminDashboard = () => {
  const { getPMIStats, loading: pmiLoading } = usePMI();
  const [applicationStats, setApplicationStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    submitted: 0,
    approvedToday: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch application data and compute stats
  useEffect(() => {
    const fetchApplicationStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const applications = await getAllApplications();

        // Calculate application statistics
        const stats = {
          total: applications.length,
          pending: applications.filter(
            (app) => app.status?.toLowerCase() === "pending"
          ).length,
          submitted: applications.filter(
            (app) => app.status?.toLowerCase() === "submitted"
          ).length,
          approved: applications.filter(
            (app) => app.status?.toLowerCase() === "approved"
          ).length,
          rejected: applications.filter(
            (app) => app.status?.toLowerCase() === "rejected"
          ).length,
          underReview: applications.filter(
            (app) => app.status?.toLowerCase() === "under_review"
          ).length,
          approvedToday: 0, // Will calculate below
        };

        // Calculate approved today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        stats.approvedToday = applications.filter((app) => {
          if (app.status?.toLowerCase() !== "approved" || !app.updatedAt)
            return false;

          const appDate = new Date(app.updatedAt);
          appDate.setHours(0, 0, 0, 0);

          return appDate.getTime() === today.getTime();
        }).length;

        setApplicationStats(stats);

        // Generate recent activities from applications
        const activities = generateRecentActivities(applications);
        setRecentActivities(activities);
      } catch (err) {
        console.error("Failed to fetch application stats:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationStats();
  }, []);

  // Generate recent activities from applications
  const generateRecentActivities = (applications) => {
    const activities = [];

    // Sort applications by updatedAt or createdAt (most recent first)
    const sortedApps = [...applications].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt);
      const dateB = new Date(b.updatedAt || b.createdAt);
      return dateB - dateA;
    });

    // Take the most recent 10 applications and create activity entries
    sortedApps.slice(0, 10).forEach((app) => {
      const borrowerName =
        `${app.firstName || ""} ${app.lastName || ""}`.trim() || "Unknown";
      const companyName =
        app.pmiCompanyName || app.companyName || "Unknown PMI";
      const appNumber = app.applicationNumber || app.id;

      let activityType = "submitted";
      let icon = "document";
      let color = "bg-blue-500";
      let message = "";

      switch (app.status?.toLowerCase()) {
        case "approved":
          activityType = "approved";
          icon = "check";
          color = "bg-green-500";
          message = `Application #${appNumber} approved for ${borrowerName} (${companyName})`;
          break;
        case "rejected":
          activityType = "rejected";
          icon = "x";
          color = "bg-red-500";
          message = `Application #${appNumber} rejected for ${borrowerName} (${companyName})`;
          break;
        case "under_review":
          activityType = "review";
          icon = "eye";
          color = "bg-yellow-500";
          message = `Application #${appNumber} under review for ${borrowerName} (${companyName})`;
          break;
        default:
          message = `Application #${appNumber} submitted by ${borrowerName} (${companyName})`;
      }

      activities.push({
        id: app.id,
        type: activityType,
        message,
        timestamp: app.updatedAt || app.createdAt,
        icon,
        color,
      });
    });

    return activities;
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Unknown time";

    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return time.toLocaleDateString();
  };

  // Get PMI statistics
  const pmiStats = getPMIStats();

  // Render loading state
  if (loading || pmiLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Your Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome to the admin panel. Manage PMI companies, users and review
          mortgage applications.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total PMI Companies */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total PMI Companies
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {pmiStats.total}
              </p>
              <div className="flex text-xs text-gray-400 mt-1">
                <span className="text-green-600">{pmiStats.active} Active</span>
                <span className="mx-1">•</span>
                <span className="text-red-600">
                  {pmiStats.inactive + pmiStats.suspended} Inactive
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Applications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#A8C045" }}
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Applications
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {applicationStats.total}
              </p>
              <div className="flex text-xs text-gray-400 mt-1">
                <span className="text-yellow-600">
                  {applicationStats.pending + applicationStats.submitted}{" "}
                  Pending
                </span>
                <span className="mx-1">•</span>
                <span className="text-green-600">
                  {applicationStats.approved} Approved
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Approved Today */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Approved Today
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {applicationStats.approvedToday}
              </p>
              <div className="text-xs text-gray-400 mt-1">
                <span className="text-red-600">
                  {applicationStats.rejected} Total Rejected
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          {recentActivities.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
              </div>
              <p className="text-gray-500">No recent activity</p>
            </div>
          ) : (
            <div className="flow-root">
              <ul className="-mb-8">
                {recentActivities.map((activity, index) => (
                  <li key={activity.id} className="relative pb-8">
                    {index !== recentActivities.length - 1 && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${activity.color}`}
                        >
                          {activity.icon === "check" && (
                            <svg
                              className="h-4 w-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          )}
                          {activity.icon === "x" && (
                            <svg
                              className="h-4 w-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          )}
                          {activity.icon === "eye" && (
                            <svg
                              className="h-4 w-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                              <path
                                fillRule="evenodd"
                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          )}
                          {activity.icon === "document" && (
                            <svg
                              className="h-4 w-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          )}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {activity.message}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {formatTimeAgo(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PostApproval = () => (
  <div className="bg-white rounded-lg shadow p-8 text-center">
    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
      <svg
        className="w-8 h-8 text-green-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Post Approval</h2>
    <p className="text-gray-600 mb-4">This feature is coming soon!</p>
    <p className="text-sm text-gray-500">
      Manage your approved applications and next steps.
    </p>
  </div>
);

// `ReturnedDocs` page component moved to its own file: `src/components/client/ReturnedDocs.jsx`

const ClientProfile = () => (
  <div className="bg-white rounded-lg shadow p-8 text-center">
    <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
      <svg
        className="w-8 h-8 text-purple-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Settings</h2>
    <p className="text-gray-600 mb-4">This feature is coming soon!</p>
    <p className="text-sm text-gray-500">
      Manage your account settings and company information.
    </p>
  </div>
);

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div
      className="animate-spin rounded-full h-32 w-32 border-b-2"
      style={{ borderColor: "#A8C045" }}
    ></div>
  </div>
);

// Unauthorized component
const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
      <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          ></path>
        </svg>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-600 mb-4">
        You don't have permission to access this page.
      </p>
      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 text-white rounded-md"
        style={{ backgroundColor: "#A8C045" }}
      >
        Go Back
      </button>
    </div>
  </div>
);

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Unauthorized />;
  }

  return children;
};

// Home Route component - handles role-based redirect
const HomeRoute = () => {
  const { user } = useAuth();

  if (user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) {
    return <Navigate to="/admin" replace />;
  } else {
    return <Navigate to="/client" replace />;
  }
};

// Login Route component - redirects if already logged in
const LoginRoute = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Login />;
};

// App Routes component - FIXED: Removed useAuth() call
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginRoute />} />

      {/* Protected routes */}
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <PasswordChange />
          </ProtectedRoute>
        }
      />

      {/* Role-based dashboard routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeRoute />
          </ProtectedRoute>
        }
      />

      {/* Admin Dashboard - UPDATED TO USE STANDALONE COMPONENT */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
            <PMIProvider>
              <DashboardLayout>
                <PasswordChangeGuard>
                  <AdminDashboard />
                </PasswordChangeGuard>
              </DashboardLayout>
            </PMIProvider>
          </ProtectedRoute>
        }
      />

      {/* Admin Manage PMI */}
      <Route
        path="/admin/manage-pmi"
        element={
          <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
            <PMIProvider>
              <DashboardLayout>
                <PasswordChangeGuard>
                  <ManagePMI />
                </PasswordChangeGuard>
              </DashboardLayout>
            </PMIProvider>
          </ProtectedRoute>
        }
      />

      {/* Admin Application Management */}
      <Route
        path="/admin/applications"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
            <PMIProvider>
              <DashboardLayout>
                <PasswordChangeGuard>
                  <AdminApplicationManagement />
                </PasswordChangeGuard>
              </DashboardLayout>
            </PMIProvider>
          </ProtectedRoute>
        }
      />

      {/* Admin Users Management */}
      <Route
        path="/admin/manage-admins"
        element={
          <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
            <DashboardLayout>
              <PasswordChangeGuard>
                <AdminUsers />
              </PasswordChangeGuard>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Reports */}
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
            <DashboardLayout>
              <PasswordChangeGuard>
                <Reports />
              </PasswordChangeGuard>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Client Dashboard with ApplicationProvider */}
      <Route
        path="/client"
        element={
          <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
            <ApplicationProvider>
              <DashboardLayout>
                <PasswordChangeGuard>
                  <ClientDashboard />
                </PasswordChangeGuard>
              </DashboardLayout>
            </ApplicationProvider>
          </ProtectedRoute>
        }
      />

      {/* Client Submit Application */}
      <Route
        path="/client/submit-application"
        element={
          <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
            <ApplicationProvider>
              <DashboardLayout>
                <PasswordChangeGuard>
                  <SubmitApplicationForm />
                </PasswordChangeGuard>
              </DashboardLayout>
            </ApplicationProvider>
          </ProtectedRoute>
        }
      />

      {/* Client Pending Applications */}
      <Route
        path="/client/pending-applications"
        element={
          <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
            <ApplicationProvider>
              <DashboardLayout>
                <PasswordChangeGuard>
                  <PendingApplications />
                </PasswordChangeGuard>
              </DashboardLayout>
            </ApplicationProvider>
          </ProtectedRoute>
        }
      />

      {/* Client Post Approval */}
      <Route
        path="/client/post-approval"
        element={
          <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
            <ApplicationProvider>
              <DashboardLayout>
                <PasswordChangeGuard>
                  <PostApproval />
                </PasswordChangeGuard>
              </DashboardLayout>
            </ApplicationProvider>
          </ProtectedRoute>
        }
      />

      {/* Client Returned Documents */}
      <Route
        path="/client/returned-docs"
        element={
          <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
            <ApplicationProvider>
              <DashboardLayout>
                <PasswordChangeGuard>
                  <ReturnedDocs />
                </PasswordChangeGuard>
              </DashboardLayout>
            </ApplicationProvider>
          </ProtectedRoute>
        }
      />

      {/* Client Profile */}
      <Route
        path="/client/profile"
        element={
          <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
            <ApplicationProvider>
              <DashboardLayout>
                <PasswordChangeGuard>
                  <ClientProfile />
                </PasswordChangeGuard>
              </DashboardLayout>
            </ApplicationProvider>
          </ProtectedRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App component with Global Toast Provider and global API activity spinner
const App = () => {
  const [apiRequests, setApiRequests] = React.useState(0);

  React.useEffect(() => {
    const handler = (e) => {
      const count = e?.detail?.count ?? 0;
      setApiRequests(count);
    };

    window.addEventListener("api-activity", handler);
    return () => window.removeEventListener("api-activity", handler);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AppRoutes />

        {/* Global Toast Provider */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            // Default options for all toasts
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
              borderRadius: "8px",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              fontSize: "14px",
              fontWeight: "500",
            },
            // Success toast styling
            success: {
              duration: 3000,
              style: {
                background: "#059669",
                color: "#fff",
              },
            },
            // Error toast styling
            error: {
              duration: 5000,
              style: {
                background: "#DC2626",
                color: "#fff",
              },
            },
            // Loading toast styling
            loading: {
              style: {
                background: "#3B82F6",
                color: "#fff",
              },
            },
          }}
        />

        {/* Global API spinner overlay (shows while any API requests are outstanding) */}
        {apiRequests > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg px-5 py-4 flex items-center space-x-3 shadow">
              <svg
                className="animate-spin h-6 w-6 text-[#A8C045]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
              <span className="text-sm text-gray-800">Loading…</span>
            </div>
          </div>
        )}
      </Router>
    </AuthProvider>
  );
};

export default App;
