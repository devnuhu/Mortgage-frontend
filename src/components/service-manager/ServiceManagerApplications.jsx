import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Clock,
  FileText,
  Search,
  Download,
  RefreshCw,
  X,
  User,
  Building2,
  Mail,
  Loader2,
} from "lucide-react";
import { useApplications } from "../../hooks/useApplications";
import ConfirmModal from "../ui/ConfirmModal";
import {
  getApplicationReviewHistory,
  getStatusColor,
  getStatusIcon,
  formatCurrency,
  formatDate,
} from "../../services/application-api";
import { getDocumentTypes, replaceFileById } from "../../services/api";
import {
  getDocumentMaxFileSizeBytes,
  getDocumentMaxFileSizeLabel,
  sortDocumentsByDocumentTypeDisplayOrder,
} from "../../services/documentSize";
import {
  downloadDocument,
  getApplicationDetails,
} from "../../services/review-api";

const ServiceManagerApplications = () => {
  const navigate = useNavigate();
  const {
    applications,
    isLoading,
    error,
    filters,
    setSearchFilter,
    setStatusFilter,
    refresh,
  } = useApplications({
    autoRefresh: false,
    fetchOnMount: true,
    initialSort: { field: "createdAt", order: "desc" },
  });

  const availableStatuses = useMemo(() => {
    const statuses = Array.from(
      new Set(
        applications
          .map((app) => app.status)
          .filter((status) => status && status.toString().trim() !== ""),
      ),
    );
    return statuses.sort();
  }, [applications]);

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [documents, setDocuments] = useState({});
  const [reviewHistory, setReviewHistory] = useState({});
  const [documentsLoading, setDocumentsLoading] = useState({});
  const [reviewHistoryLoading, setReviewHistoryLoading] = useState({});
  const [replacementLoading, setReplacementLoading] = useState({});
  const [cannotEditModal, setCannotEditModal] = useState({
    open: false,
    message: "",
  });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const loadApplicationDetails = async (applicationId) => {
    if (documents[applicationId] && reviewHistory[applicationId]) return;

    try {
      setIsLoadingDetails(true);
      setDocumentsLoading((prev) => ({ ...prev, [applicationId]: true }));
      setReviewHistoryLoading((prev) => ({ ...prev, [applicationId]: true }));

      const details = await getApplicationDetails(applicationId);
      const docs = Array.isArray(details.documents) ? details.documents : [];
      const detailsHistory = Array.isArray(details.reviewHistory)
        ? details.reviewHistory
        : [];

      const documentTypes =
        Array.isArray(details.documentTypes) && details.documentTypes.length > 0
          ? details.documentTypes
          : await getDocumentTypes();
      const orderedDocs = sortDocumentsByDocumentTypeDisplayOrder(
        docs,
        documentTypes,
      );

      const historyResponse = await getApplicationReviewHistory(applicationId);
      const history = Array.isArray(historyResponse)
        ? historyResponse
        : detailsHistory;

      setDocuments((prev) => ({ ...prev, [applicationId]: orderedDocs }));
      setReviewHistory((prev) => ({ ...prev, [applicationId]: history }));
      setSelectedApplication((prev) =>
        prev?.id === applicationId ? { ...prev, ...details } : prev,
      );
    } catch (err) {
      console.error(
        `Error loading application details for ${applicationId}:`,
        err,
      );
      setDocuments((prev) => ({ ...prev, [applicationId]: [] }));
      setReviewHistory((prev) => ({ ...prev, [applicationId]: [] }));
      toast.error(err.message || "Unable to load application details");
    } finally {
      setIsLoadingDetails(false);
      setDocumentsLoading((prev) => ({ ...prev, [applicationId]: false }));
      setReviewHistoryLoading((prev) => ({
        ...prev,
        [applicationId]: false,
      }));
    }
  };

  const handleViewDetails = async (application) => {
    setSelectedApplication(application);
    setShowModal(true);
    await loadApplicationDetails(application.id);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedApplication(null);
  };

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

    navigate("/service-manager/create-application", {
      state: { appId: selectedApplication.id },
    });
  };

  const handleDownload = async (document) => {
    try {
      await downloadDocument(document.id);
      toast.success("Download started");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download document. Please try again.");
    }
  };

  const handleReplaceDocument = async (applicationId, doc) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";

    input.onchange = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are allowed.");
        return;
      }

      const maxFileSizeBytes = getDocumentMaxFileSizeBytes(
        doc.documentType || "",
      );
      if (file.size > maxFileSizeBytes) {
        toast.error(
          `File size must be ${getDocumentMaxFileSizeLabel(doc.documentType || "")} or smaller.`,
        );
        return;
      }

      try {
        setReplacementLoading((prev) => ({ ...prev, [doc.id]: true }));
        const replaced = await replaceFileById(
          doc.id,
          file,
          doc.documentType || "",
        );

        toast.success(
          "Your document has been re-uploaded and is pending review. Your application status remains rejected until all documents are approved.",
        );

        setDocuments((prev) => {
          const existingDocs = prev[applicationId] || [];
          const updatedDocs = existingDocs.map((item) =>
            String(item.id) === String(doc.id) ? replaced || item : item,
          );
          return { ...prev, [applicationId]: updatedDocs };
        });
      } catch (err) {
        console.error("Replace failed:", err);
        toast.error(err.message || "Document replace failed.");
      } finally {
        setReplacementLoading((prev) => ({ ...prev, [doc.id]: false }));
        try {
          event.target.value = "";
        } catch {
          // ignore
        }
      }
    };

    input.click();
  };

  const getDocumentReviewStatus = (doc) => {
    if (!doc) return "unknown";
    return (
      doc.reviewStatusName ||
      doc.reviewStatus ||
      doc.documentStatus ||
      doc.status ||
      "unknown"
    )
      .toString()
      .trim();
  };

  const StatusBadge = ({ status }) => {
    const color = getStatusColor(status);
    const Icon = getStatusIcon(status);

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
      >
        <Icon className="mr-1 h-3 w-3" />
        {(status || "unknown")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase())}
      </span>
    );
  };

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

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Search by application number, name, or RSA PIN..."
              value={filters.search || ""}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <select
              value={filters.status || ""}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (letter) => letter.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={refresh}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            <p>{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Application #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Borrower
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Loan Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Date Applied
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    {filters.search || filters.status
                      ? "Try adjusting your search or filter criteria."
                      : "You haven't submitted any applications yet."}
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id || app.applicationNumber}>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="text-sm font-medium text-gray-900">
                        {app.applicationNumber || app.id}
                      </div>
                      <div className="text-sm text-gray-500">
                        RSA: {app.rsaPin || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {`${app.firstName || ""} ${app.lastName || ""}`.trim() ||
                        "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatCurrency(app.loanAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {app.createdAt
                        ? new Date(app.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-left text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(app)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="relative before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-sky-500 before:via-violet-500 before:to-fuchsia-500 bg-white rounded-[1.25rem] shadow-2xl ring-1 ring-slate-200/70 border border-slate-200/80 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 px-6 py-5 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Application Details
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedApplication.applicationNumber ||
                    selectedApplication.id}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 min-h-0 bg-slate-50">
              <div className="p-6 space-y-6">
                <div className="bg-slate-50 rounded-3xl border border-slate-200/80 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Application Status
                      </h4>
                      <div className="mt-2">
                        <StatusBadge status={selectedApplication.status} />
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

                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Borrower Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 rounded-3xl border border-slate-200/80 p-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <div className="text-sm text-gray-900">
                        {`${selectedApplication.firstName || ""} ${selectedApplication.middleName || ""} ${selectedApplication.lastName || ""}`.trim()}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        RSA PIN
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedApplication.rsaPin || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        User Account
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedApplication.userName || "-"}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    Financial Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 rounded-3xl border border-slate-200/80 p-5">
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

                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    PMI Company Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 rounded-3xl border border-slate-200/80 p-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Company Name
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedApplication.companyName ||
                          selectedApplication.pmiCompanyName ||
                          "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Representative
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedApplication.pmiRepName || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Rep. Email
                      </label>
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {selectedApplication.pmiRepEmail || "-"}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Documents ({selectedApplication.documentCount || 0})
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
                          className="flex flex-col gap-4 p-4 border border-slate-200 rounded-3xl bg-white shadow-sm transition-shadow duration-200 hover:shadow-md sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <FileText className="w-5 h-5 text-gray-400 mt-1" />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {doc.documentType
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (letter) =>
                                    letter.toUpperCase(),
                                  )}
                              </div>
                              <div className="mt-1 text-xs text-gray-500 space-y-1">
                                <div className="truncate">{doc.fileName}</div>
                                <div>
                                  {doc.fileSize
                                    ? `${(doc.fileSize / 1024 / 1024).toFixed(2)} MB • `
                                    : ""}
                                  {formatDate(doc.uploadedAt || doc.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:items-end sm:justify-between gap-2">
                            <StatusBadge
                              status={getDocumentReviewStatus(doc)}
                            />
                            {(doc.reviewerComments ||
                              doc.reviewerName ||
                              doc.reviewedAt) && (
                              <div className="text-sm text-right space-y-1">
                                {doc.reviewerComments && (
                                  <div>
                                    <span className="font-medium text-[#FF8200]">
                                      Rejection reason:
                                    </span>{" "}
                                    <span className="text-[#FF8200]">
                                      {doc.reviewerComments}
                                    </span>
                                  </div>
                                )}
                                {(doc.reviewerName || doc.reviewedAt) && (
                                  <div className="text-gray-500">
                                    <span className="font-medium text-gray-700">
                                      Reviewed by:
                                    </span>{" "}
                                    {doc.reviewerName || "Unknown reviewer"}
                                    {doc.reviewedAt
                                      ? ` on ${formatDate(doc.reviewedAt)}`
                                      : ""}
                                  </div>
                                )}
                              </div>
                            )}
                            {selectedApplication?.status?.toLowerCase() ===
                              "rejected" &&
                              getDocumentReviewStatus(doc)
                                .toLowerCase()
                                .includes("rejected") && (
                                <button
                                  onClick={() =>
                                    handleReplaceDocument(
                                      selectedApplication.id,
                                      doc,
                                    )
                                  }
                                  disabled={replacementLoading[doc.id]}
                                  className="inline-flex items-center justify-center px-3 py-1 text-sm font-medium text-white bg-[#A8C045] hover:bg-[#94a838] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {replacementLoading[doc.id]
                                    ? "Replacing..."
                                    : "Replace Document"}
                                </button>
                              )}
                            <button
                              onClick={() => handleDownload(doc)}
                              className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </button>
                          </div>
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
                      {reviewHistory[selectedApplication.id].map((review) => (
                        <div
                          key={review.id}
                          className="border border-slate-200 rounded-3xl p-4 bg-white shadow-sm"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <StatusBadge status={review.status} />
                                <span className="text-sm text-gray-500">
                                  by{" "}
                                  {review.reviewedByName ||
                                    review.reviewedByEmail ||
                                    "Unknown reviewer"}
                                </span>
                              </div>
                              {review.reviewedByEmail && (
                                <div className="text-xs text-gray-400">
                                  {review.reviewedByEmail}
                                </div>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                              {review.comments || "No comments provided"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>No review history available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 bg-white flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-between items-stretch sm:items-center flex-shrink-0">
              {selectedApplication &&
                (selectedApplication.status?.toLowerCase() === "draft" ||
                  selectedApplication.status?.toLowerCase() === "rejected") && (
                  <button
                    onClick={handleEditAndResubmit}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 active:bg-slate-800 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md"
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

      {isLoadingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="rounded-full bg-white px-6 py-4 text-gray-900 shadow-lg">
            Loading application details...
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagerApplications;
