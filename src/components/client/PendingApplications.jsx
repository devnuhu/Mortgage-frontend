import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useApplication } from "../../context/ApplicationContext";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Calendar,
  Eye,
  Download,
  RefreshCw,
  ArrowUpDown,
  X,
  User,
  MapPin,
  DollarSign,
  Building2,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";
import ConfirmModal from "../ui/ConfirmModal";
import {
  getMyApplications,
  getApplicationDocuments,
  downloadDocument,
  getApplicationReviewHistory,
  getStatusIcon,
  getStatusColor,
  formatCurrency,
  formatDate,
} from "../../services/application-api";

const PendingApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isClientResubmitted, removeClientResubmittedIds } = useApplication();

  // State management
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState({});
  const [reviewHistory, setReviewHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documentsLoading, setDocumentsLoading] = useState({});
  const [reviewHistoryLoading, setReviewHistoryLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cannotEditModal, setCannotEditModal] = useState({
    open: false,
    message: "",
  });

  // Load applications on component mount
  useEffect(() => {
    loadApplications();
  }, []);

  // Load applications function
  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      let data = await getMyApplications();

      // Reconcile any client-side resubmitted markers persisted in sessionStorage
      try {
        const raw = sessionStorage.getItem("mmgt_client_resubmitted_ids");
        const persisted = raw ? JSON.parse(raw) : [];
        if (Array.isArray(persisted) && persisted.length > 0) {
          const idsToRemove = [];
          data = data.map((app) => {
            if (!persisted.includes(app.id)) return app;

            const serverStatus = (app.status || "").toLowerCase();
            // If the server still reports 'rejected', show the server status
            // and clear the stale persisted marker so rejected apps are visible.
            if (serverStatus === "rejected") {
              idsToRemove.push(app.id);
              return app;
            }

            // Otherwise, show the client-side optimistic 'resubmitted' badge
            return { ...app, status: "resubmitted" };
          });

          if (
            idsToRemove.length > 0 &&
            typeof removeClientResubmittedIds === "function"
          ) {
            try {
              removeClientResubmittedIds(idsToRemove);
            } catch (e) {
              console.warn("Failed to remove stale client resubmitted ids:", e);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to apply client resubmitted mutations:", err);
      }

      setApplications(data);
    } catch (err) {
      console.error("Error loading applications:", err);
      setError("Failed to load applications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load documents for a specific application
  const loadDocuments = async (applicationId) => {
    if (documents[applicationId]) return; // Already loaded

    try {
      setDocumentsLoading((prev) => ({ ...prev, [applicationId]: true }));
      const docs = await getApplicationDocuments(applicationId);
      setDocuments((prev) => ({ ...prev, [applicationId]: docs }));
    } catch (err) {
      console.error(
        `Error loading documents for application ${applicationId}:`,
        err
      );
      setDocuments((prev) => ({ ...prev, [applicationId]: [] }));
    } finally {
      setDocumentsLoading((prev) => ({ ...prev, [applicationId]: false }));
    }
  };

  // Load review history for a specific application
  const loadReviewHistory = async (applicationId) => {
    if (reviewHistory[applicationId]) return; // Already loaded

    try {
      setReviewHistoryLoading((prev) => ({ ...prev, [applicationId]: true }));
      const history = await getApplicationReviewHistory(applicationId);
      setReviewHistory((prev) => ({ ...prev, [applicationId]: history }));
    } catch (err) {
      console.error(
        `Error loading review history for application ${applicationId}:`,
        err
      );
      setReviewHistory((prev) => ({ ...prev, [applicationId]: [] }));
    } finally {
      setReviewHistoryLoading((prev) => ({
        ...prev,
        [applicationId]: false,
      }));
    }
  };

  // Handle document download
  const handleDownload = async (document) => {
    try {
      await downloadDocument(document.id, document.fileName);
    } catch (err) {
      console.error("Download failed:", err);
      // Non-blocking toast notification
      const toast = (await import("react-hot-toast")).default;
      toast.error("Failed to download document. Please try again.");
    }
  };

  // Filter and sort applications
  const filteredAndSortedApplications = useMemo(() => {
    let filtered = applications.filter((app) => {
      const matchesSearch =
        app.applicationNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        `${app.firstName} ${app.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        app.rsaPin.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        app.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    // Sort applications
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "applicationNumber":
          aVal = a.applicationNumber;
          bVal = b.applicationNumber;
          break;
        case "borrowerName":
          aVal = `${a.firstName} ${a.lastName}`;
          bVal = `${b.firstName} ${b.lastName}`;
          break;
        case "loanAmount":
          aVal = a.loanAmount;
          bVal = b.loanAmount;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        default: // createdAt
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [applications, searchTerm, statusFilter, sortBy, sortOrder]);

  // Handle view details
  const handleViewDetails = async (application) => {
    setSelectedApplication(application);
    setShowModal(true);
    // Load documents and review history when modal opens
    await Promise.all([
      loadDocuments(application.id),
      loadReviewHistory(application.id),
    ]);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedApplication(null);
  };

  // Handle edit and resubmit
  const handleEditAndResubmit = () => {
    if (!selectedApplication) return;
    const status = (selectedApplication.status || "").toLowerCase();
    const isEditable = status === "draft" || status === "rejected";
    if (!isEditable) {
      setCannotEditModal({
        open: true,
        message: `Cannot edit application in ${selectedApplication.status} status. Only Draft or Rejected applications can be edited.`,
      });
      return;
    }
    navigate("/client/submit-application", {
      state: { appId: selectedApplication.id },
    });
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Get unique statuses for filter dropdown
  const availableStatuses = useMemo(() => {
    const statuses = [...new Set(applications.map((app) => app.status))];
    return statuses;
  }, [applications]);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const color = getStatusColor(status);
    const Icon = getStatusIcon(status);

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Loading applications...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <XCircle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-900">
                Error Loading Applications
              </h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={loadApplications}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={cannotEditModal.open}
        title="Cannot Edit Application"
        message={cannotEditModal.message}
        onConfirm={() => setCannotEditModal({ open: false, message: "" })}
        onCancel={() => setCannotEditModal({ open: false, message: "" })}
        confirmLabel="OK"
        cancelLabel="Close"
      />
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              My Applications
            </h2>
            <p className="text-gray-600 mt-1">
              Track and manage your mortgage applications
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">
              {applications.length}
            </p>
            <p className="text-gray-500">Total Applications</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by application number, name, or RSA PIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadApplications}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredAndSortedApplications.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Applications Found
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "You haven't submitted any applications yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSortChange("applicationNumber")}
                      className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Application #
                      <ArrowUpDown className="w-3 h-3 ml-1" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSortChange("borrowerName")}
                      className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Borrower
                      <ArrowUpDown className="w-3 h-3 ml-1" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSortChange("loanAmount")}
                      className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Loan Amount
                      <ArrowUpDown className="w-3 h-3 ml-1" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSortChange("status")}
                      className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Status
                      <ArrowUpDown className="w-3 h-3 ml-1" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSortChange("createdAt")}
                      className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Date Applied
                      <ArrowUpDown className="w-3 h-3 ml-1" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {application.applicationNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        RSA: {application.rsaPin}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {`${application.firstName} ${application.lastName}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.userName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(application.loanAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {
                        // Prefer authoritative server 'rejected' status over
                        // client-side optimistic 'resubmitted' badge. This
                        // prevents a stale client marker from hiding a true
                        // server-side rejection.
                      }
                      <StatusBadge
                        status={
                          (application.status || "").toLowerCase() ===
                          "rejected"
                            ? "rejected"
                            : isClientResubmitted(application.id)
                            ? "resubmitted"
                            : application.status
                        }
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(application.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(application)}
                        className="flex items-center text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Application Details
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedApplication.applicationNumber}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto flex-1 min-h-0">
              <div className="p-6 space-y-6">
                {/* Application Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Application Status
                      </h4>
                      <div className="mt-2">
                        <StatusBadge
                          status={
                            isClientResubmitted(selectedApplication.id)
                              ? "resubmitted"
                              : selectedApplication.status
                          }
                        />
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>
                        Applied: {formatDate(selectedApplication.createdAt)}
                      </div>
                      {selectedApplication.submittedAt && (
                        <div>
                          Submitted:{" "}
                          {formatDate(selectedApplication.submittedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Borrower Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Borrower Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <div className="text-sm text-gray-900">
                        {`${selectedApplication.firstName} ${
                          selectedApplication.middleName || ""
                        } ${selectedApplication.lastName}`.trim()}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        RSA PIN
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedApplication.rsaPin}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        User Account
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedApplication.userName}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    Financial Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Loan Amount
                      </label>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(selectedApplication.loanAmount)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Property Value
                      </label>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(selectedApplication.propertyValue)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Equity Value
                      </label>
                      <div className="text-sm text-gray-900">
                        {formatCurrency(selectedApplication.equityValue)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Supplementary Value
                      </label>
                      <div className="text-sm text-gray-900">
                        {formatCurrency(selectedApplication.supplementaryValue)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PMI Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    PMI Company Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Company Name
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedApplication.companyName}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Representative
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedApplication.pmiRepName}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Rep. Email
                      </label>
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {selectedApplication.pmiRepEmail}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review History Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Review History
                  </h4>

                  {reviewHistoryLoading[selectedApplication.id] ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                      <span className="text-gray-600">
                        Loading review history...
                      </span>
                    </div>
                  ) : reviewHistory[selectedApplication.id]?.length > 0 ? (
                    <div className="space-y-4">
                      {reviewHistory[selectedApplication.id].map(
                        (review, index) => (
                          <div
                            key={review.id}
                            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <StatusBadge
                                  status={
                                    isClientResubmitted(selectedApplication.id)
                                      ? "resubmitted"
                                      : review.status
                                  }
                                />
                                <span className="text-sm text-gray-500">
                                  by {review.reviewedByName}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {formatDate(review.createdAt)}
                              </span>
                            </div>
                            {review.comments && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                                  {review.comments}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>No review history available</p>
                    </div>
                  )}
                </div>

                {/* Documents Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Documents ({selectedApplication.documentCount})
                  </h4>

                  {documentsLoading[selectedApplication.id] ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                      <span className="text-gray-600">
                        Loading documents...
                      </span>
                    </div>
                  ) : documents[selectedApplication.id]?.length > 0 ? (
                    <div className="space-y-2">
                      {documents[selectedApplication.id].map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {doc.fileName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {doc.documentType
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l) =>
                                    l.toUpperCase()
                                  )}{" "}
                                •{(doc.fileSize / 1024 / 1024).toFixed(2)} MB •
                                {formatDate(doc.createdAt)}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownload(doc)}
                            className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>No documents uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4 bg-gray-50 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-between items-stretch sm:items-center flex-shrink-0">
              {selectedApplication &&
                (selectedApplication.status === "draft" ||
                  selectedApplication.status === "returned" ||
                  selectedApplication.status === "rejected") && (
                  <button
                    onClick={handleEditAndResubmit}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-[#A8C045] hover:bg-[#94a838] active:bg-[#7d8f2f] rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Edit & Resubmit
                  </button>
                )}
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 active:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApplications;
