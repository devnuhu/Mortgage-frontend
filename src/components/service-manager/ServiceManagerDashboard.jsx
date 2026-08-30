import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getMyApplications,
  calculateApplicationStats,
  formatApplicationForDisplay,
  getStatusColor,
} from "../../services/application-api";
import { getStatusIcon } from "../common/StatusIcons";

const ServiceManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    returned: 0,
    submitted: 0,
    rejected: 0,
  });

  // Load applications from API
  useEffect(() => {
    const loadApplications = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch applications from API (large page size for dashboard)
        const response = await getMyApplications(1, 100);
        const apiApplications = response.data || response;

        // Format applications for display
        const formattedApplications = apiApplications.map(
          formatApplicationForDisplay,
        );

        // Calculate statistics
        const newStats = calculateApplicationStats(apiApplications);

        setApplications(formattedApplications);
        setStats(newStats);

        console.log("✅ Applications loaded successfully:", {
          count: apiApplications.length,
          stats: newStats,
        });
      } catch (error) {
        console.error("❌ Error loading applications:", error);
        setError(error.message || "Failed to load applications");

        // Set empty state on error
        setApplications([]);
        setStats({
          total: 0,
          pending: 0,
          approved: 0,
          returned: 0,
          submitted: 0,
          rejected: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadApplications();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleQuickAction = (action) => {
    if (
      typeof action === "string" &&
      action.startsWith("application-details/")
    ) {
      const parts = action.split("/");
      const appId = parts[1];
      if (appId) {
        navigate(`/service-manager/applications/${appId}`);
        return;
      }
    }

    switch (action) {
      case "create-application":
        navigate("/service-manager/create-application");
        break;
      case "my-applications":
        navigate("/service-manager/applications");
        break;
      case "all-applications":
        navigate("/service-manager/all-applications");
        break;
      default:
        toast.info(
          `Navigation to ${action} - Will be implemented in next modules!`,
        );
    }
  };

  // Get recent applications (last 3)
  const recentApplications = applications.slice(0, 3);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back,{" "}
            {(user &&
              (user.fullName ||
                `${user.firstName || ""} ${user.lastName || ""}`.trim())) ||
              user?.firstName ||
              user?.pmiCompanyName ||
              "Service Manager"}
            !
          </h1>
          <p className="text-gray-600 mt-1">Loading your applications...</p>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-3 text-gray-600">Loading applications...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back,{" "}
            {(user &&
              (user.fullName ||
                `${user.firstName || ""} ${user.lastName || ""}`.trim())) ||
              user?.firstName ||
              user?.pmiCompanyName ||
              "Service Manager"}
            !
          </h1>
          <p className="text-gray-600 mt-1">
            Here's an overview of your application activities
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-red-600 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900">
                Error Loading Applications
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="ml-4 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back,{" "}
            {(user &&
              (user.fullName ||
                `${user.firstName || ""} ${user.lastName || ""}`.trim())) ||
              user?.firstName ||
              user?.pmiCompanyName ||
              "Service Manager"}
            !
          </h1>
          <p className="text-gray-600 mt-1">
            Here's an overview of your application activities
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Applications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Applications
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.total}
                </p>
              </div>
              <div
                className="h-12 w-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#A8C045" }}
              >
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Pending/Submitted Applications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Under Review
                </p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {stats.pending + stats.submitted}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Approved Applications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.approved}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Returned/Rejected Applications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Needs Action
                </p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats.returned + stats.rejected}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Applications */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Applications
                  </h3>
                  <button
                    onClick={() => handleQuickAction("all-applications")}
                    className="text-sm font-medium hover:underline"
                    style={{ color: "#A8C045" }}
                  >
                    View all ({stats.total})
                  </button>
                </div>
              </div>
              <div className="p-6">
                {recentApplications.length > 0 ? (
                  <div className="space-y-4">
                    {recentApplications.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() =>
                          handleQuickAction(`application-details/${app.id}`)
                        }
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-gray-900">
                              {app.borrowerName}
                            </p>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                app.status,
                              )}`}
                            >
                              {getStatusIcon(app.status)}
                              <span className="ml-1 capitalize">
                                {app.status?.replace("_", " ")}
                              </span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {app.propertyAddress}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{formatCurrency(app.loanAmount)}</span>
                            <span>ID: {app.id}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No applications yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating your first application.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleQuickAction("create-application")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Create Application
                </button>
                <button
                  onClick={() => handleQuickAction("my-applications")}
                  className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  My Applications
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Capabilities
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Create applications
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Edit draft applications
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Upload documents
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Search all applications
                </li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceManagerDashboard;
