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

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    returned: 0,
    submitted: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load applications from API
  useEffect(() => {
    const loadApplications = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch applications from API
        const apiApplications = await getMyApplications();

        // Format applications for display
        const formattedApplications = apiApplications.map(
          formatApplicationForDisplay
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
    // Show a quick transition overlay to improve perceived performance
    setIsNavigating(true);

    const perform = () => {
      if (
        typeof action === "string" &&
        action.startsWith("application-details/")
      ) {
        const parts = action.split("/");
        const appId = parts[1];
        if (appId) {
          navigate(`/client/application/${appId}`);
          setIsNavigating(false);
          return;
        }
      }

      switch (action) {
        case "submit-application":
          navigate("/client/submit-application");
          break;
        case "pending-applications":
          navigate("/client/pending-applications");
          break;
        case "returned-docs":
          navigate("/client/returned-docs");
          break;
        case "profile":
          navigate("/client/profile");
          break;
        default:
          toast.info(
            `Navigation to ${action} - Will be implemented in next modules!`
          );
      }

      // small delay to let the overlay be visible briefly on fast navigation
      setTimeout(() => setIsNavigating(false), 200);
    };

    // Small delay to allow the overlay to paint before navigation
    setTimeout(perform, 60);
  };

  const handleRetry = () => {
    window.location.reload();
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
              "PMI Company"}
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
              "PMI Company"}
            !
          </h1>
          <p className="text-gray-600 mt-1">
            Here's an overview of your mortgage application activities
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
              onClick={handleRetry}
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
      {isNavigating && (
        <div className="absolute inset-0 z-50 bg-white/60 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-10 w-10 text-blue-600"
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
            <p className="mt-3 text-sm text-gray-700">Loading...</p>
          </div>
        </div>
      )}
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
              "PMI Company"}
            !
          </h1>
          <p className="text-gray-600 mt-1">
            Here's an overview of your mortgage application activities
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
                                app.status
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
                      Get started by submitting your first application.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Quick Actions
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={() => handleQuickAction("submit-application")}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#A8C045" }}
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Submit New Application
                </button>

                <button
                  onClick={() => handleQuickAction("pending-applications")}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg
                    className="h-5 w-5 mr-2"
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
                  View Under Review ({stats.pending + stats.submitted})
                </button>

                <button
                  onClick={() => handleQuickAction("returned-docs")}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg
                    className="h-5 w-5 mr-2"
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
                  Handle Returns ({stats.returned + stats.rejected})
                </button>

                <button
                  onClick={() => handleQuickAction("profile")}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Manage Profile
                </button>
              </div>
            </div>

            {/* System Notifications */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        System Update
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        New features have been added to the application
                        submission process.
                      </p>
                    </div>
                  </div>

                  {stats.returned + stats.rejected > 0 && (
                    <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-600"
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
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">
                          Action Required
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          You have {stats.returned + stats.rejected} application
                          {stats.returned + stats.rejected > 1 ? "s" : ""} that
                          need attention.
                        </p>
                      </div>
                    </div>
                  )}

                  {stats.total === 0 && (
                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">
                          Get Started
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          Ready to submit your first mortgage application? Click
                          "Submit New Application" above.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
