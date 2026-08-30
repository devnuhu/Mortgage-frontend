import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  Loader,
  FileText,
  Calendar,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getAssignedApplications,
  getApplicationById,
} from "../../services/review-api";
import { getBalanceByRsaPin } from "../../services/balanceService";
import { updateApplicationStatus } from "../../services/application-service";
import { APPLICATION_STATUS, getStatusText } from "../../services/api";
import ApplicationReviewModal from "./ApplicationReviewModal";

const adminStatusOptions = [
  {
    value: APPLICATION_STATUS.SUBMITTED,
    label: getStatusText(APPLICATION_STATUS.SUBMITTED),
  },
  {
    value: APPLICATION_STATUS.PENDING,
    label: getStatusText(APPLICATION_STATUS.PENDING),
  },
  {
    value: APPLICATION_STATUS.UNDER_REVIEW,
    label: getStatusText(APPLICATION_STATUS.UNDER_REVIEW),
  },
  {
    value: APPLICATION_STATUS.APPROVED,
    label: getStatusText(APPLICATION_STATUS.APPROVED),
  },
  {
    value: APPLICATION_STATUS.REJECTED,
    label: getStatusText(APPLICATION_STATUS.REJECTED),
  },
  {
    value: APPLICATION_STATUS.RETURNED,
    label: getStatusText(APPLICATION_STATUS.RETURNED),
  },
];

// Allow configuring HNI threshold via env: VITE_HNI_THRESHOLD or REACT_APP_HNI_THRESHOLD
let importMetaEnv = {};
try {
  importMetaEnv = import.meta && import.meta.env ? import.meta.env : {};
} catch (e) {
  importMetaEnv = {};
}

const envHniThreshold =
  (importMetaEnv && importMetaEnv.VITE_HNI_THRESHOLD) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_HNI_THRESHOLD) ||
  null;

const HNI_THRESHOLD =
  envHniThreshold != null && !Number.isNaN(Number(envHniThreshold))
    ? Number(envHniThreshold)
    : 50000000; // default 50,000,000

const AdminQueue = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hniMap, setHniMap] = useState({});
  const [selectedStatusApplication, setSelectedStatusApplication] =
    useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdateStatus, setStatusUpdateStatus] = useState("under_review");
  const [statusUpdateComments, setStatusUpdateComments] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Fetch assigned applications
  useEffect(() => {
    fetchAssignedApplications();
  }, []);

  const fetchAssignedApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const assignments = await getAssignedApplications();
      const uniqueAssignments = Array.from(
        new Map(
          assignments.map((assignment) => {
            const applicationId =
              assignment.applicationId ||
              assignment.application?.id ||
              assignment.application?.applicationId ||
              assignment.id;
            return [String(applicationId), assignment];
          }),
        ).values(),
      );

      const applicationsWithDetails = await Promise.all(
        uniqueAssignments.map(async (assignment) => {
          const applicationId =
            assignment.applicationId ||
            assignment.application?.id ||
            assignment.id;

          if (!applicationId) {
            return {
              ...assignment,
              assignmentId: assignment.id,
            };
          }

          try {
            const application = await getApplicationById(applicationId);
            return {
              ...application,
              assignmentId: assignment.id,
              assignmentData: assignment,
            };
          } catch (loadError) {
            console.warn(
              `Failed to load application ${applicationId} for assignment ${assignment.id}`,
              loadError,
            );
            return {
              ...assignment,
              id: applicationId,
              assignmentId: assignment.id,
            };
          }
        }),
      );

      setApplications(applicationsWithDetails || []);
      // Kick off HNI checks for fetched applications
      checkHniForApplications(applicationsWithDetails || []);
    } catch (err) {
      console.error("Error fetching assigned applications:", err);
      setError(
        err.response?.data?.message || "Failed to load assigned applications",
      );
      toast.error("Failed to load your queue");
    } finally {
      setLoading(false);
    }
  };

  const checkHniForApplications = async (apps) => {
    if (!Array.isArray(apps) || apps.length === 0) return;

    const next = {};
    await Promise.all(
      apps.map(async (app) => {
        const rsaPin = app.rsaPin || app.assignmentData?.rsaPin || null;
        if (!rsaPin) {
          next[app.id] = false;
          return;
        }
        try {
          const balance = await getBalanceByRsaPin(rsaPin);
          next[app.id] = balance !== null && balance >= HNI_THRESHOLD;
        } catch (err) {
          next[app.id] = false;
        }
      }),
    );
    setHniMap((prev) => ({ ...prev, ...next }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAssignedApplications();
    setRefreshing(false);
    toast.success("Queue refreshed");
  };

  const handleOpenReview = (application) => {
    setSelectedApplication(application);
    setShowReviewModal(true);
  };

  const handleOpenStatusModal = (application) => {
    setSelectedStatusApplication(application);
    setStatusUpdateStatus(
      application.status || APPLICATION_STATUS.UNDER_REVIEW,
    );
    setStatusUpdateComments("");
    setShowStatusModal(true);
  };

  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    setSelectedStatusApplication(null);
    setStatusUpdateComments("");
    setStatusUpdating(false);
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatusApplication) return;

    const isRejectedStatus = statusUpdateStatus === APPLICATION_STATUS.REJECTED;

    if (isRejectedStatus && !statusUpdateComments.trim()) {
      toast.error("Please add comments when rejecting an application");
      return;
    }

    try {
      setStatusUpdating(true);
      const updatedApp = await updateApplicationStatus(
        selectedStatusApplication.id,
        {
          status: statusUpdateStatus,
          comments: statusUpdateComments,
        },
      );

      setApplications((prev) =>
        prev.map((app) =>
          app.id === updatedApp.id ? { ...app, ...updatedApp } : app,
        ),
      );

      // If the app is open in the review modal, update that state too
      if (selectedApplication && selectedApplication.id === updatedApp.id) {
        setSelectedApplication(updatedApp);
      }

      toast.success("Application status updated successfully");
      handleCloseStatusModal();
    } catch (err) {
      console.error("Error updating application status:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to update application status. Please try again.",
      );
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCloseReview = async (refreshData = false) => {
    setShowReviewModal(false);
    setSelectedApplication(null);
    if (refreshData) {
      await fetchAssignedApplications();
    }
  };

  // Filter and search logic
  const filteredApplications = applications.filter((app) => {
    // Search filter
    const searchLower = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !searchLower ||
      app.firstName?.toLowerCase().includes(searchLower) ||
      app.lastName?.toLowerCase().includes(searchLower) ||
      app.applicationNumber?.toLowerCase().includes(searchLower) ||
      app.rsaPin?.toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter !== "all" && app.status !== statusFilter) return false;

    // Priority filter
    if (priorityFilter !== "all" && app.priority !== priorityFilter)
      return false;

    // Date range filter
    if (dateRangeFilter !== "all") {
      const createdDate = new Date(app.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

      switch (dateRangeFilter) {
        case "today":
          if (daysDiff > 0) return false;
          break;
        case "week":
          if (daysDiff > 7) return false;
          break;
        case "month":
          if (daysDiff > 30) return false;
          break;
        default:
          break;
      }
    }

    return true;
  });

  // Calculate stats
  const stats = {
    total: applications.length,
    submitted: applications.filter((a) => a.status === "submitted").length,
    underReview: applications.filter((a) => a.status === "under_review").length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    returned: applications.filter((a) => a.status === "returned").length,
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "submitted":
        return "bg-blue-600 text-white";
      case "under_review":
        return "bg-[#003883] text-white";
      case "pending":
        return "bg-[#FF8200] text-white";
      case "approved":
        return "bg-[#8DC63F] text-white";
      case "rejected":
        return "bg-red-600 text-white";
      case "returned":
        return "bg-orange-600 text-white";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-2 text-[#003883]" />
          <p className="text-slate-600">Loading your queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">My Queue</h1>
          <p className="text-sm text-slate-600 mt-1">
            Applications assigned for review
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#003883] text-white rounded-md hover:bg-[#002F6F] disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 hover:scale-105 transition-all duration-200 cursor-default">
          <div className="text-xs text-slate-600 font-medium">
            Total Assigned
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {stats.total}
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 hover:scale-105 transition-all duration-200 cursor-default">
          <div className="text-xs text-slate-600 font-medium">Submitted</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {stats.submitted}
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-300 hover:scale-105 transition-all duration-200 cursor-default">
          <div className="text-xs text-slate-600 font-medium">Pending</div>
          <div className="text-2xl font-bold text-[#FF8200] mt-1">
            {stats.pending}
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-[#003883] hover:scale-105 transition-all duration-200 cursor-default">
          <div className="text-xs text-slate-600 font-medium">Under Review</div>
          <div className="text-2xl font-bold text-[#003883] mt-1">
            {stats.underReview}
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-green-300 hover:scale-105 transition-all duration-200 cursor-default">
          <div className="text-xs text-slate-600 font-medium">Approved</div>
          <div className="text-2xl font-bold text-[#8DC63F] mt-1">
            {stats.approved}
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-red-300 hover:scale-105 transition-all duration-200 cursor-default">
          <div className="text-xs text-slate-600 font-medium">Rejected</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {stats.rejected}
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-300 hover:scale-105 transition-all duration-200 cursor-default">
          <div className="text-xs text-slate-600 font-medium">Returned</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {stats.returned}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-[#003883]" />
          <h3 className="font-semibold text-slate-900">Filters</h3>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Name, APP #, PIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#003883] focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#003883] focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              {adminStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#003883] focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#003883] focus:border-transparent"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Applications List */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                ? "No applications match your filters"
                : "No applications assigned yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Applicant
                  </th>
                  <th className="px-2 py-3 text-center text-sm font-semibold text-gray-900 w-20">
                    HNI
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Application #
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    PMI Company
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Loan Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Property Value
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Assigned
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {app.firstName} {app.lastName}
                      </div>
                      <div className="text-sm text-gray-600">{app.rsaPin}</div>
                    </td>
                    <td className="px-2 py-4 text-center">
                      {hniMap[app.id] ? (
                        <span className="inline-block text-sm font-extrabold text-white bg-green-600 px-3 py-1 rounded-md shadow">
                          HNI
                        </span>
                      ) : (
                        <span className="inline-block w-6" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-900">
                        {app.applicationNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}
                      >
                        {app.status?.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {app.pmiCompanyName || app.companyName || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: "NGN",
                          maximumFractionDigits: 0,
                        }).format(Number(app.loanAmount || 0))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: "NGN",
                          maximumFractionDigits: 0,
                        }).format(Number(app.propertyValue || 0))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {formatDate(app.submittedAt || app.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#003883] text-white text-xs font-medium">
                        <FileText className="h-3 w-3" />
                        {app.documentCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {formatDate(app.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-y-2">
                      <button
                        onClick={() => handleOpenReview(app)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#003883] text-white text-sm rounded-md hover:bg-[#002F6F] transition-colors"
                      >
                        Review
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenStatusModal(app)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-[#003883] text-[#003883] text-sm rounded-md hover:bg-[#F8FAFF] transition-colors"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedApplication && (
        <ApplicationReviewModal
          application={selectedApplication}
          onClose={handleCloseReview}
        />
      )}

      {showStatusModal && selectedStatusApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md max-w-2xl w-full overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Update Application Status
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedStatusApplication.applicationNumber} -{" "}
                  {selectedStatusApplication.firstName}{" "}
                  {selectedStatusApplication.lastName}
                </p>
              </div>
              <button
                onClick={handleCloseStatusModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  New Status
                </label>
                <select
                  value={statusUpdateStatus}
                  onChange={(e) => setStatusUpdateStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#003883] focus:border-transparent"
                >
                  {adminStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {statusUpdateStatus === APPLICATION_STATUS.REJECTED
                    ? "Comments / Reason"
                    : "Comments"}
                  {statusUpdateStatus === APPLICATION_STATUS.REJECTED && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>
                <textarea
                  value={statusUpdateComments}
                  onChange={(e) => setStatusUpdateComments(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-[#003883] focus:border-transparent"
                  placeholder={
                    statusUpdateStatus === APPLICATION_STATUS.REJECTED
                      ? "Enter a rejection reason. This field is required when Rejected is selected."
                      : "Enter optional comments for the status update..."
                  }
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={handleCloseStatusModal}
                className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={
                  statusUpdating ||
                  (statusUpdateStatus === APPLICATION_STATUS.REJECTED &&
                    !statusUpdateComments.trim())
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#003883] text-white rounded-md hover:bg-[#002F6F] disabled:opacity-50 transition-colors text-sm"
              >
                {statusUpdating ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Status"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQueue;
