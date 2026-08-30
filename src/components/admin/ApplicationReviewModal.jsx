import React, { useState, useEffect } from "react";
import { X, AlertCircle, Loader, Eye, Download } from "lucide-react";
import toast from "react-hot-toast";
import {
  getApplicationDetails,
  getApplicationDocuments,
  downloadAllApplicationDocuments,
} from "../../services/review-api";
import { getDocumentTypes } from "../../services/api";
import { sortDocumentsByDocumentTypeDisplayOrder } from "../../services/documentSize";
import DocumentReviewPanel from "./DocumentReviewPanel";

const ApplicationReviewModal = ({ application, onClose }) => {
  const [appDetails, setAppDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentReview, setShowDocumentReview] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadAllError, setDownloadAllError] = useState(null);

  useEffect(() => {
    fetchApplicationDetails();
  }, [application.id]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      let details = await getApplicationDetails(application.id);
      const documentTypes = Array.isArray(details.documentTypes)
        ? details.documentTypes
        : await getDocumentTypes();

      // If the application payload doesn't include documents, fetch them separately
      if (!details.documents || details.documents.length === 0) {
        try {
          const docs = await getApplicationDocuments(application.id);
          details = {
            ...details,
            documents: sortDocumentsByDocumentTypeDisplayOrder(
              docs,
              documentTypes,
            ),
          };
        } catch (docErr) {
          console.warn("Could not load documents separately:", docErr);
          details = {
            ...details,
            documents: sortDocumentsByDocumentTypeDisplayOrder(
              details.documents || [],
              documentTypes,
            ),
          };
        }
      } else {
        details = {
          ...details,
          documents: sortDocumentsByDocumentTypeDisplayOrder(
            details.documents,
            documentTypes,
          ),
        };
      }

      setAppDetails(details);
    } catch (err) {
      console.error("Error fetching application details:", err);
      setError(
        err.response?.data?.message || "Failed to load application details",
      );
      toast.error("Failed to load application");
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentClick = (doc) => {
    setSelectedDocument(doc);
    setShowDocumentReview(true);
  };

  const handleDocumentReviewClose = async (refreshData = false) => {
    setShowDocumentReview(false);
    if (refreshData) {
      await fetchApplicationDetails();
    }
    setSelectedDocument(null);
  };

  const handleDownloadAllDocuments = async () => {
    // Check if there are documents to download
    if (!appDetails.documents || appDetails.documents.length === 0) {
      toast.error("No documents available to download");
      return;
    }

    const toastId = toast.loading(
      "Preparing merged PDF... This may take 10-30 seconds for large documents.",
    );
    setIsDownloadingAll(true);
    setDownloadAllError(null);

    try {
      const blob = await downloadAllApplicationDocuments(application.id);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10);
      const appNumber = appDetails.applicationNumber || "Application";
      const filename = `${appNumber}_merged_documents_${timestamp}.pdf`;

      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      toast.success(
        "Documents merged successfully! Your download should start shortly.",
        {
          id: toastId,
        },
      );
    } catch (err) {
      console.error("Error downloading all documents:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Unable to process documents. Please try again";
      setDownloadAllError(errorMessage);
      toast.error(`Error: ${errorMessage}`, { id: toastId });
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleRetryDownloadAll = async () => {
    setDownloadAllError(null);
    await handleDownloadAllDocuments();
  };

  const getReviewStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "requestedrevision":
      case "requested_revision":
      case "revision_requested":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const normalizeDocumentReviewStatus = (doc) =>
    doc.reviewStatus ||
    doc.status ||
    doc.documentStatus ||
    doc.reviewStatusName ||
    "";

  const normalizeDocumentUploadedAt = (doc) =>
    doc.uploadedAt ||
    doc.uploadedDate ||
    doc.uploadDate ||
    doc.createdAt ||
    doc.uploadedOn ||
    "";

  const getDocumentReviewStatus = (doc) => {
    const status = normalizeDocumentReviewStatus(doc);
    return status ? status : "Pending";
  };

  const getReviewStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "✓";
      case "rejected":
        return "✕";
      case "requestedrevision":
      case "requested_revision":
      case "revision_requested":
        return "!";
      default:
        return "○";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto p-6 text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error || !appDetails) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" />
            <h3 className="text-lg font-semibold">
              {error || "Error loading"}
            </h3>
          </div>
          <button
            onClick={() => onClose(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Count documents by status
  const documentStats = {
    total: appDetails.documents?.length || 0,
    pending:
      appDetails.documents?.filter(
        (d) => getDocumentReviewStatus(d).toLowerCase() === "pending",
      ).length || 0,
    approved:
      appDetails.documents?.filter(
        (d) => getDocumentReviewStatus(d).toLowerCase() === "approved",
      ).length || 0,
    rejected:
      appDetails.documents?.filter(
        (d) => getDocumentReviewStatus(d).toLowerCase() === "rejected",
      ).length || 0,
    revision:
      appDetails.documents?.filter((d) =>
        [
          "requestedrevision",
          "requested_revision",
          "revision_requested",
        ].includes(getDocumentReviewStatus(d).toLowerCase()),
      ).length || 0,
  };

  if (showDocumentReview && selectedDocument) {
    return (
      <DocumentReviewPanel
        document={selectedDocument}
        application={appDetails}
        onClose={handleDocumentReviewClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Application Review
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {appDetails.applicationNumber}
            </p>
          </div>
          <button
            onClick={() => onClose(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Applicant Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Applicant</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {appDetails.firstName} {appDetails.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">RSA PIN:</span>
                  <span className="ml-2 font-mono font-medium text-gray-900">
                    {appDetails.rsaPin}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {appDetails.userEmail}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Financial Details
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Loan Amount:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                      maximumFractionDigits: 0,
                    }).format(Number(appDetails.loanAmount || 0))}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Property Value:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                      maximumFractionDigits: 0,
                    }).format(Number(appDetails.propertyValue || 0))}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Equity Value:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                      maximumFractionDigits: 0,
                    }).format(Number(appDetails.equityValue || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PMI Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">PMI Company</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Company:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {appDetails.pmiCompanyName}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Rep:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {appDetails.pmiRepName}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Email:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {appDetails.pmiRepEmail}
                </span>
              </div>
            </div>
          </div>

          {/* Document Stats */}
          <div className="grid grid-cols-5 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600">Total</div>
              <div className="text-2xl font-bold text-gray-900">
                {documentStats.total}
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="text-xs text-yellow-600">Pending</div>
              <div className="text-2xl font-bold text-yellow-900">
                {documentStats.pending}
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="text-xs text-green-600">Approved</div>
              <div className="text-2xl font-bold text-green-900">
                {documentStats.approved}
              </div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="text-xs text-red-600">Rejected</div>
              <div className="text-2xl font-bold text-red-900">
                {documentStats.rejected}
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <div className="text-xs text-orange-600">Revision</div>
              <div className="text-2xl font-bold text-orange-900">
                {documentStats.revision}
              </div>
            </div>
          </div>

          {/* Documents List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                Documents ({documentStats.total})
              </h3>
              {appDetails.documents && appDetails.documents.length > 0 && (
                <button
                  onClick={handleDownloadAllDocuments}
                  disabled={isDownloadingAll}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                  title="Download all documents merged as a single PDF"
                >
                  {isDownloadingAll ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Merging...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download All Documents
                    </>
                  )}
                </button>
              )}
            </div>
            {downloadAllError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    Error: {downloadAllError}
                  </p>
                  <button
                    onClick={handleRetryDownloadAll}
                    disabled={isDownloadingAll}
                    className="text-sm font-medium text-red-700 hover:text-red-800 underline disabled:opacity-50"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {appDetails.documents && appDetails.documents.length > 0 ? (
                appDetails.documents.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {idx + 1}. {doc.documentType}
                          </div>
                          <div className="text-sm text-gray-600">
                            {doc.fileName}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>
                              Uploaded:{" "}
                              {formatDate(normalizeDocumentUploadedAt(doc))}
                            </span>
                            {doc.reviewedAt && (
                              <span>
                                Reviewed: {formatDate(doc.reviewedAt)} by{" "}
                                {doc.reviewerName}
                              </span>
                            )}
                          </div>
                          {doc.reviewerComments && (
                            <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700">
                              <span className="font-medium">Comment:</span>{" "}
                              {doc.reviewerComments}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getReviewStatusColor(getDocumentReviewStatus(doc))}`}
                      >
                        <span>
                          {getReviewStatusIcon(getDocumentReviewStatus(doc))}
                        </span>
                        {getDocumentReviewStatus(doc)}
                      </span>

                      <button
                        onClick={() => handleDocumentClick(doc)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        Review
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-600">
                  No documents found
                </div>
              )}
            </div>
          </div>

          {/* Review History */}
          {appDetails.reviewHistory && appDetails.reviewHistory.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                Review History
              </h3>
              <div className="space-y-2">
                {appDetails.reviewHistory.map((history, idx) => (
                  <div
                    key={history.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {history.reviewerName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {history.reviewComments}
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        {formatDate(history.reviewedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            onClick={() => onClose(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationReviewModal;
