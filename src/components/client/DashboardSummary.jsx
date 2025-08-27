import React, { useState, useEffect } from "react";
//import { useAuth } from "../../context/AuthContext";
import {
  getAllApplications,
  getApplicationsByUser,
  getApplicationsByPMI,
  calculateDashboardStats,
  ApplicationStatus,
  getStatusColor,
  filterApplicationsByStatus,
  sortApplications,
} from "../../services/application-service";

const DashboardSummary = ({ onCardClick }) => {
  // State management
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Get user context for role-based data fetching
  const { user, isAdmin, isClient } = useAuth();

  // Fetch applications based on user role
  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let fetchedApplications = [];

      if (isAdmin()) {
        // Admins can see all applications
        fetchedApplications = await getAllApplications();
      } else if (isClient() && user?.id) {
        // Clients can only see their own applications
        fetchedApplications = await getApplicationsByUser(user.id);
      } else if (user?.pmiCompanyId) {
        // PMI users can see applications from their company
        fetchedApplications = await getApplicationsByPMI(user.pmiCompanyId);
      }

      // Sort applications by most recent first
      const sortedApplications = sortApplications(
        fetchedApplications,
        "updatedAt",
        "desc"
      );

      setApplications(sortedApplications);
      setStats(calculateDashboardStats(sortedApplications));
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError(err.message || "Failed to load applications");
      setApplications([]);
      setStats({});
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and refresh every 5 minutes
  useEffect(() => {
    fetchApplications();

    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(fetchApplications, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [user, isAdmin, isClient]);

  // Manual refresh function
  const handleRefresh = () => {
    fetchApplications();
  };

  // Define summary cards data based on real stats
  const summaryCards = [
    {
      id: "total",
      title: "Total Applications",
      value: stats.total || 0,
      subtitle: "Applications submitted",
      icon: "📋",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
      clickable: true,
      filter: null, // Show all applications when clicked
    },
    {
      id: "pending",
      title: "Pending Review",
      value: (stats.submitted || 0) + (stats.under_review || 0),
      subtitle: "Awaiting review",
      icon: "⏳",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-200",
      clickable: true,
      filter: "pending",
    },
    {
      id: "approved",
      title: "Approved",
      value: stats.approved || 0,
      subtitle: "Successfully approved",
      icon: "✅",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200",
      clickable: true,
      filter: ApplicationStatus.APPROVED,
    },
    {
      id: "action_required",
      title: "Action Required",
      value: (stats.returned || 0) + (stats.incomplete || 0),
      subtitle: "Returned or incomplete",
      icon: "🔄",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      borderColor: "border-red-200",
      clickable: true,
      filter: "action_required",
    },
  ];

  const handleCardClick = (card) => {
    if (card.clickable && onCardClick) {
      onCardClick(card.filter, card.title);
    }
  };

  // Loading state
  if (isLoading && applications.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Application Overview
          </h2>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-gray-50 border rounded-lg p-4 animate-pulse"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="w-16 h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-8 bg-gray-200 rounded"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                <div className="w-20 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && applications.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Application Overview
          </h2>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg mb-2">⚠️</div>
          <h3 className="text-sm font-medium text-red-800 mb-1">
            Failed to Load Applications
          </h3>
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Application Overview
          </h2>
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            Last updated:{" "}
            {lastUpdated.toLocaleTimeString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error banner (if error but we have cached data) */}
      {error && applications.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="text-yellow-600 text-sm">⚠️</div>
            <p className="ml-2 text-sm text-yellow-700">
              Warning: {error} (Showing cached data)
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card)}
            className={`
              ${card.bgColor} ${card.borderColor} ${card.textColor}
              border rounded-lg p-4 transition-all duration-200
              ${
                card.clickable
                  ? "cursor-pointer hover:shadow-md hover:scale-105 transform"
                  : "cursor-default"
              }
            `}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">{card.icon}</div>
              {card.clickable && (
                <div className="text-xs opacity-70">Click to view</div>
              )}
            </div>

            {/* Card Content */}
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                {card.value.toLocaleString()}
              </div>
              <div className="text-sm font-medium">{card.title}</div>
              <div className="text-xs opacity-80">{card.subtitle}</div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                <div
                  className="bg-current h-2 rounded-full transition-all duration-500"
                  style={{
                    width:
                      stats.total > 0
                        ? `${Math.min((card.value / stats.total) * 100, 100)}%`
                        : "0%",
                    opacity: 0.7,
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-lg font-semibold text-gray-900">
              {stats.total > 0
                ? Math.round(((stats.approved || 0) / stats.total) * 100)
                : 0}
              %
            </div>
            <div className="text-xs text-gray-600">Approval Rate</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-semibold text-gray-900">
              {(stats.submitted || 0) + (stats.under_review || 0)}
            </div>
            <div className="text-xs text-gray-600">In Review</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-semibold text-gray-900">
              {(stats.returned || 0) + (stats.incomplete || 0)}
            </div>
            <div className="text-xs text-gray-600">Need Action</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-semibold" style={{ color: "#A8C045" }}>
              {stats.approved || 0}
            </div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
        </div>
      </div>

      {/* Recent Activity Preview */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Recent Activity</h3>
          <button
            className="text-xs text-gray-500 hover:text-gray-700"
            style={{ color: "#A8C045" }}
            onClick={() => onCardClick && onCardClick(null, "Recent Activity")}
          >
            View all →
          </button>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <div className="text-2xl mb-2">📋</div>
            <p className="text-sm">No applications found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {applications.slice(0, 3).map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: getStatusColor(app.status),
                    }}
                  ></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {app.firstName} {app.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      RSA: {app.rsaPin} • #{app.applicationNumber}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {new Date(app.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div
                    className="text-xs font-medium capitalize"
                    style={{
                      color: getStatusColor(app.status),
                    }}
                  >
                    {app.status.replace("_", " ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardSummary;
