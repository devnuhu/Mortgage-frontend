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
import PMIApplicationDocuments from "./PMIApplicationDocuments";

const PMIDashboard = () => {
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

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await getMyApplications(1, 100);
        const apiApplications = response.data || response;

        const formattedApplications = apiApplications.map(
          formatApplicationForDisplay,
        );

        const newStats = calculateApplicationStats(apiApplications);

        setApplications(formattedApplications);
        setStats(newStats);
      } catch (error) {
        console.error("❌ Error loading applications:", error);
        setError(error.message || "Failed to load applications");
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

  const handleQuickAction = (action) => {
    setIsNavigating(true);

    const perform = () => {
      if (
        typeof action === "string" &&
        action.startsWith("application-details/")
      ) {
        const parts = action.split("/");
        const appId = parts[1];
        if (appId) {
          navigate(`/pmi/application/${appId}`);
          setIsNavigating(false);
          return;
        }
      }

      switch (action) {
        case "submit-application":
          navigate("/pmi/submit-application");
          break;
        case "pending-applications":
          navigate("/pmi/pending-applications");
          break;
        case "returned-docs":
          navigate("/pmi/returned-docs");
          break;
        case "profile":
          navigate("/pmi/profile");
          break;
        default:
          toast.info(
            `Navigation to ${action} - Will be implemented in next modules!`,
          );
      }

      setTimeout(() => setIsNavigating(false), 200);
    };

    setTimeout(perform, 60);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const recentApplications = applications.slice(0, 3);
  const rejectedApplications = applications.filter(
    (app) => app.status?.toLowerCase() === "rejected",
  );
  const recentRejectedApplications = rejectedApplications.slice(0, 3);
  const editableApplication = applications.find((app) =>
    ["draft", "rejected"].includes((app.status || "").toLowerCase()),
  );

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
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="mt-3 text-sm text-gray-700">Loading...</p>
          </div>
        </div>
      )}
      <div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                      Get started by submitting your first application.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Rejected Applications
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {rejectedApplications.length} rejected application
                      {rejectedApplications.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {recentRejectedApplications.length > 0 ? (
                  <div className="space-y-4">
                    {recentRejectedApplications.map((app) => (
                      <div key={app.id} className="p-4 bg-gray-50 rounded-lg">
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
                        <div className="text-sm text-gray-500">
                          Loan: {formatCurrency(app.loanAmount)} — ID: {app.id}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No rejected applications to show.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Upload Documents
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Manage document uploads for a draft or rejected application.
                </p>
              </div>
            </div>
            <div>
              {editableApplication ? (
                <PMIApplicationDocuments
                  applicationId={editableApplication.id}
                  applicationStatus={editableApplication.status}
                  defaultDocumentType="ACCESS_ARM_APPLICATION_FORM"
                />
              ) : (
                <div className="p-4 text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  No draft or rejected applications available for document
                  upload.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Quick Actions
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Navigate through your PMI dashboard.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  label: "Submit Application",
                  action: "submit-application",
                },
                {
                  label: "Pending Applications",
                  action: "pending-applications",
                },
                {
                  label: "Returned Documents",
                  action: "returned-docs",
                },
                {
                  label: "Profile",
                  action: "profile",
                },
              ].map((item) => (
                <button
                  key={item.action}
                  onClick={() => handleQuickAction(item.action)}
                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PMIDashboard;
