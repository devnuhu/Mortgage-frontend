import React, { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  approveDocument,
  rejectDocument,
  requestDocumentRevision,
  downloadDocument,
} from "../../services/review-api";

const DocumentReviewPanel = ({ document: doc, application, onClose }) => {
  const [documentComments, setDocumentComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  useEffect(() => {
    let active = true;
    let url = null;
    const loadPreview = async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const blob = await downloadDocument(doc.id);
        url = window.URL.createObjectURL(blob);
        if (active) {
          setPreviewUrl(url);
        }
      } catch (err) {
        console.error("Error loading preview:", err);
        if (active) {
          setPreviewError("Preview unavailable. Please download the document.");
        }
      } finally {
        if (active) {
          setPreviewLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      active = false;
      if (url) {
        window.URL.revokeObjectURL(url);
      }
    };
  }, [doc.id]);

  const handleAction = async (action) => {
    const commentsRequired = action === "reject" || action === "revision";
    if (commentsRequired && !documentComments.trim()) {
      toast.error(
        `Please add comments when ${action === "reject" ? "rejecting" : "requesting a revision for"} a document`,
      );
      return;
    }

    try {
      setLoading(true);
      setActionInProgress(action);

      const actionHandlers = {
        approve: approveDocument,
        reject: rejectDocument,
        revision: requestDocumentRevision,
      };

      const handler = actionHandlers[action];
      if (!handler) {
        throw new Error(`Unsupported document action: ${action}`);
      }

      await handler(doc.id, documentComments);

      if (action === "approve") {
        toast.success("Document approved successfully");
      } else if (action === "reject") {
        toast.success("Document rejected successfully");
      } else if (action === "revision") {
        toast.success("Document revision requested successfully");
      }

      onClose(true);
    } catch (error) {
      console.error(`Error performing ${action} action:`, error);
      toast.error(
        error.response?.data?.message ||
          `Failed to ${action} document. Please try again.`,
      );
    } finally {
      setLoading(false);
      setActionInProgress(null);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const blob = await downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = doc.fileName || `document-${doc.id}`;
      window.document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(anchor);
      toast.success("Document downloaded");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    } finally {
      setLoading(false);
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

  const getReviewStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-medium">
            <AlertCircle className="h-4 w-4" />
            Pending Review
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
            <XCircle className="h-4 w-4" />
            Rejected
          </span>
        );
      case "requestedrevision":
      case "requested_revision":
      case "revision_requested":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
            <AlertCircle className="h-4 w-4" />
            Revision Requested
          </span>
        );
      default:
        return null;
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[calc(100vh-4rem)] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onClose(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {doc.documentType}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{doc.fileName}</p>
            </div>
          </div>
          <button
            onClick={() => onClose(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left: Document Viewer */}
          <div className="flex-1 border-r border-gray-200 flex flex-col bg-gray-900 min-h-0 min-h-0">
            <div className="flex-1 flex flex-col p-6 min-h-0">
              {previewLoading ? (
                <div className="text-center text-gray-400">
                  <Loader className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Loading document preview...</p>
                </div>
              ) : previewError ? (
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">{previewError}</p>
                  <button
                    onClick={handleDownload}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    Download to View
                  </button>
                </div>
              ) : previewUrl ? (
                <object
                  data={previewUrl}
                  type="application/pdf"
                  className="w-full h-full rounded-lg overflow-hidden"
                >
                  <div className="text-center text-gray-400">
                    <FileText className="h-16 w-16 mx-auto mb-4" />
                    <p>Preview unavailable in this browser.</p>
                    <button
                      onClick={handleDownload}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      Download to View
                    </button>
                  </div>
                </object>
              ) : (
                <div className="text-center text-gray-400">
                  <FileText className="h-16 w-16 mx-auto mb-4" />
                  <p>Document preview unavailable.</p>
                  <button
                    onClick={handleDownload}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    Download to View
                  </button>
                </div>
              )}
            </div>

            {/* Download Button */}
            <div className="p-4 border-t border-gray-700 flex justify-between items-center gap-4">
              <button
                onClick={() => onClose(false)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download Document
              </button>
            </div>
          </div>

          {/* Right: Review Panel */}
          <div className="w-full lg:w-96 min-h-0 flex flex-col bg-white overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="p-6 border-b border-gray-200 space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    Document Type
                  </div>
                  <div className="font-medium text-gray-900">
                    {doc.documentType}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">File Name</div>
                  <div className="font-medium text-gray-900 text-sm break-all">
                    {doc.fileName}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  {getReviewStatusBadge(getDocumentReviewStatus(doc))}
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Uploaded</div>
                  <div className="text-sm text-gray-900">
                    {formatDate(normalizeDocumentUploadedAt(doc))}
                  </div>
                </div>

                {doc.reviewedAt && (
                  <>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Reviewed By
                      </div>
                      <div className="text-sm text-gray-900">
                        {doc.reviewerName}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Review Date
                      </div>
                      <div className="text-sm text-gray-900">
                        {formatDate(doc.reviewedAt)}
                      </div>
                    </div>
                  </>
                )}

                {doc.reviewerComments && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">
                      Previous Comments
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-900 italic">
                      "{doc.reviewerComments}"
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-b border-gray-200 bg-blue-50">
                <div className="text-sm font-semibold text-blue-900 mb-3">
                  Applicant Information
                </div>
                <div className="space-y-2 text-sm text-blue-900">
                  <div>
                    <span className="font-medium">Name:</span>{" "}
                    {application.firstName} {application.lastName}
                  </div>
                  <div>
                    <span className="font-medium">PIN:</span>{" "}
                    {application.rsaPin}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>{" "}
                    {application.userEmail}
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 flex flex-col">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Review Comments
                  </label>
                  <textarea
                    value={documentComments}
                    onChange={(e) => setDocumentComments(e.target.value)}
                    placeholder="Enter your document review comments..."
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100"
                    rows="6"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {documentComments.length} characters
                  </div>
                </div>

                <div className="space-y-3 mt-auto">
                  <button
                    onClick={() => handleAction("approve")}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#003883] text-white rounded-lg hover:bg-[#002f6f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {actionInProgress === "approve" && loading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Approve Document
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleAction("reject")}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#A39382] text-white rounded-lg hover:bg-[#8b7c6f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {actionInProgress === "reject" && loading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Reject Document
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentReviewPanel;
