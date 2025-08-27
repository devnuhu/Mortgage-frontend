import api from "./axios-config";

/**
 * Application API Service Functions
 * These functions match your .NET ApplicationsController endpoints
 */

// ==========================================
// APPLICATION ENDPOINTS
// ==========================================

/**
 * Get all applications (Admin only)
 * GET /api/Applications
 * @returns {Promise<Array>} List of all applications
 */
export const getAllApplications = async () => {
  try {
    const response = await api.get("/Applications");
    return response.data;
  } catch (error) {
    console.error("❌ Get all applications error:", error);
    throw error;
  }
};

/**
 * Get current user's applications (Client only)
 * GET /api/Applications/my-applications
 * @returns {Promise<Array>} List of user's applications
 */
export const getMyApplications = async () => {
  try {
    const response = await api.get("/Applications/my-applications");
    return response.data;
  } catch (error) {
    console.error("❌ Get my applications error:", error);
    throw error;
  }
};

/**
 * Get application by ID
 * GET /api/Applications/{id}
 * @param {string} id - Application ID
 * @returns {Promise<Object>} Application details
 */
export const getApplicationById = async (id) => {
  try {
    if (!id) {
      throw new Error("Application ID is required");
    }

    const response = await api.get(`/Applications/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Get application ${id} error:`, error);
    throw error;
  }
};

/**
 * Get application review history
 * GET /api/Applications/{id}/review-history
 * @param {string} id - Application ID
 * @returns {Promise<Array>} List of review history entries
 */
export const getApplicationReviewHistory = async (id) => {
  try {
    if (!id) {
      throw new Error("Application ID is required");
    }

    const response = await api.get(`/Applications/${id}/review-history`);
    return response.data;
  } catch (error) {
    console.error(`❌ Get application ${id} review history error:`, error);
    throw error;
  }
};

/**
 * Create new application (Client only)
 * POST /api/Applications
 * @param {Object} applicationData - Application data
 * @returns {Promise<Object>} Created application
 */
export const createApplication = async (applicationData) => {
  try {
    if (!applicationData) {
      throw new Error("Application data is required");
    }

    const response = await api.post("/Applications", applicationData);
    return response.data;
  } catch (error) {
    console.error("❌ Create application error:", error);
    throw error;
  }
};

/**
 * Submit application (Client only)
 * POST /api/Applications/{id}/submit
 * @param {string} id - Application ID
 * @returns {Promise<Object>} Success response
 */
export const submitApplication = async (id) => {
  try {
    if (!id) {
      throw new Error("Application ID is required");
    }

    const response = await api.post(`/Applications/${id}/submit`);
    return response.data;
  } catch (error) {
    console.error(`❌ Submit application ${id} error:`, error);
    throw error;
  }
};

/**
 * Update application status (Admin only)
 * PUT /api/Applications/{id}/status
 * @param {string} id - Application ID
 * @param {Object} statusUpdate - Status update data
 * @param {string} statusUpdate.status - New status
 * @param {string} [statusUpdate.comments] - Optional comments
 * @returns {Promise<Object>} Updated application
 */
export const updateApplicationStatus = async (id, statusUpdate) => {
  try {
    if (!id) {
      throw new Error("Application ID is required");
    }
    if (!statusUpdate?.status) {
      throw new Error("Status is required");
    }

    const response = await api.put(`/Applications/${id}/status`, statusUpdate);
    return response.data;
  } catch (error) {
    console.error(`❌ Update application ${id} status error:`, error);
    throw error;
  }
};

/**
 * Delete application (Client only)
 * DELETE /api/Applications/{id}
 * @param {string} id - Application ID
 * @returns {Promise<Object>} Success response
 */
export const deleteApplication = async (id) => {
  try {
    if (!id) {
      throw new Error("Application ID is required");
    }

    const response = await api.delete(`/Applications/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Delete application ${id} error:`, error);
    throw error;
  }
};

// ==========================================
// FILE/DOCUMENT ENDPOINTS
// ==========================================

/**
 * Upload file for an application
 * POST /api/File/upload
 * @param {File} file - File to upload
 * @param {string} applicationId - Application ID
 * @param {string} documentType - Type of document
 * @returns {Promise<Object>} Upload response
 */
export const uploadFile = async (file, applicationId, documentType) => {
  try {
    if (!file || !applicationId || !documentType) {
      throw new Error("File, application ID, and document type are required");
    }

    const formData = new FormData();
    formData.append("File", file);
    formData.append("ApplicationId", applicationId);
    formData.append("DocumentType", documentType);

    const response = await api.post("/File/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("❌ Upload file error:", error);
    throw error;
  }
};

/**
 * Get files for an application
 * GET /api/File/application/{applicationId}
 * @param {string} applicationId - Application ID
 * @returns {Promise<Array>} List of files
 */
export const getFilesByApplication = async (applicationId) => {
  try {
    if (!applicationId) {
      throw new Error("Application ID is required");
    }

    const response = await api.get(`/File/application/${applicationId}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Get files for application ${applicationId} error:`,
      error
    );
    throw error;
  }
};

/**
 * Download file by ID
 * GET /api/File/download/{fileId}
 * @param {string} fileId - File ID
 * @param {string} fileName - Optional file name for download
 * @returns {Promise<Blob>} File blob for download
 */
export const downloadFile = async (fileId, fileName = null) => {
  try {
    if (!fileId) {
      throw new Error("File ID is required");
    }

    const response = await api.get(`/File/download/${fileId}`, {
      responseType: "blob",
    });

    // Create blob URL and trigger download
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = downloadUrl;

    // Try to get filename from response headers or use provided name
    const contentDisposition = response.headers["content-disposition"];
    let downloadFileName = fileName;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        downloadFileName = filenameMatch[1];
      }
    }

    link.download = downloadFileName || `document-${fileId}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL
    window.URL.revokeObjectURL(downloadUrl);

    return response.data;
  } catch (error) {
    console.error(`❌ Download file ${fileId} error:`, error);
    throw error;
  }
};

/**
 * Delete file by ID
 * DELETE /api/File/{fileId}
 * @param {string} fileId - File ID
 * @returns {Promise<Object>} Success response
 */
export const deleteFile = async (fileId) => {
  try {
    if (!fileId) {
      throw new Error("File ID is required");
    }

    const response = await api.delete(`/File/${fileId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Delete file ${fileId} error:`, error);
    throw error;
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Calculate application statistics from applications list
 * @param {Array} applications - List of applications
 * @returns {Object} Statistics object with counts by status
 */
export const calculateApplicationStats = (applications) => {
  if (!Array.isArray(applications)) {
    return {
      total: 0,
      pending: 0,
      approved: 0,
      returned: 0,
      submitted: 0,
      rejected: 0,
    };
  }

  return applications.reduce(
    (acc, app) => {
      acc.total++;
      const status = app.status?.toLowerCase();

      // Map backend statuses to frontend display statuses
      switch (status) {
        case "pending":
          acc.pending++;
          break;
        case "approved":
          acc.approved++;
          break;
        case "returned":
        case "needs_revision":
          acc.returned++;
          break;
        case "submitted":
        case "under_review":
          acc.submitted++;
          break;
        case "rejected":
        case "declined":
          acc.rejected++;
          break;
        default:
          // Handle unknown statuses as pending
          acc.pending++;
      }

      return acc;
    },
    {
      total: 0,
      pending: 0,
      approved: 0,
      returned: 0,
      submitted: 0,
      rejected: 0,
    }
  );
};

/**
 * Format application data for display
 * @param {Object} application - Raw application from API
 * @returns {Object} Formatted application for UI
 */
export const formatApplicationForDisplay = (application) => {
  if (!application) return null;

  return {
    id: application.applicationNumber || application.id,
    referenceNumber:
      application.applicationNumber || `REF-${application.id?.slice(0, 8)}`,
    borrowerName: `${application.firstName} ${
      application.middleName ? application.middleName + " " : ""
    }${application.lastName}`.trim(),
    loanAmount: application.loanAmount,
    propertyValue: application.propertyValue,
    status: application.status?.toLowerCase(),
    submissionDate: application.submittedAt || application.createdAt,
    lastUpdated: application.updatedAt,
    pmiCompany: application.companyName || application.pmiCompanyName,
    documentCount: application.documentCount || 0,
    rsaPin: application.rsaPin,
    equityValue: application.equityValue,
    supplementaryValue: application.supplementaryValue,
    pmiRepName: application.pmiRepName,
    pmiRepEmail: application.pmiRepEmail,
    priority: application.priority,
    // Additional fields for detailed view
    firstName: application.firstName,
    middleName: application.middleName,
    lastName: application.lastName,
    createdAt: application.createdAt,
    submittedAt: application.submittedAt,
  };
};

/**
 * Get status color for UI display
 * @param {string} status - Application status
 * @returns {string} CSS classes for status color
 */
export const getStatusColor = (status) => {
  const normalizedStatus = status?.toLowerCase();
  switch (normalizedStatus) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "submitted":
    case "under_review":
      return "bg-blue-100 text-blue-800";
    case "returned":
    case "needs_revision":
      return "bg-orange-100 text-orange-800";
    case "rejected":
    case "declined":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/**
 * Get status icon for UI display (returns Lucide React icon component)
 * @param {string} status - Application status
 * @returns {React.Component} Lucide React icon component
 */
export const getStatusIcon = (status) => {
  const normalizedStatus = status?.toLowerCase();
  switch (normalizedStatus) {
    case "approved":
      return CheckCircle;
    case "pending":
      return Clock;
    case "submitted":
    case "under_review":
      return AlertTriangle;
    case "returned":
    case "needs_revision":
      return XCircle;
    case "rejected":
    case "declined":
      return XCircle;
    default:
      return Clock;
  }
};

/**
 * Get status icon name for UI display
 * @param {string} status - Application status
 * @returns {string} Icon name identifier
 */
export const getStatusIconName = (status) => {
  const normalizedStatus = status?.toLowerCase();
  switch (normalizedStatus) {
    case "approved":
      return "check-circle";
    case "pending":
      return "clock";
    case "submitted":
    case "under_review":
      return "alert-triangle";
    case "returned":
    case "needs_revision":
      return "arrow-left";
    case "rejected":
    case "declined":
      return "x-circle";
    default:
      return "clock";
  }
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "N/A";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return "N/A";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

/**
 * Format relative time for display
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  if (!date) return "N/A";

  const now = new Date();
  const reviewDate = new Date(date);
  const diffInMs = now - reviewDate;

  const seconds = Math.floor(diffInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Get document type display name
 * @param {string} documentType - Document type from backend
 * @returns {string} User-friendly document type name
 */
export const getDocumentTypeDisplayName = (documentType) => {
  const typeMap = {
    identity_document: "Identity Document",
    income_proof: "Income Proof",
    property_document: "Property Document",
    bank_statement: "Bank Statement",
    employment_letter: "Employment Letter",
    property_valuation: "Property Valuation",
    other: "Other Document",
  };

  return typeMap[documentType?.toLowerCase()] || documentType || "Document";
};

// ==========================================
// COMPATIBILITY ALIAS EXPORTS
// ==========================================

// Import the required icons at the top
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

/**
 * Alias for getFilesByApplication to match component usage
 * @param {string} applicationId - Application ID
 * @returns {Promise<Array>} List of documents/files
 */
export const getApplicationDocuments = getFilesByApplication;

/**
 * Alias for downloadFile to match component usage
 * @param {string} fileId - File ID
 * @param {string} fileName - Optional file name for download
 * @returns {Promise<Blob>} File blob for download
 */
export const downloadDocument = downloadFile;

/**
 * Alias for submitApplication to match ApplicationContext expected import
 * @param {string} id - Application ID
 * @returns {Promise<Object>} Success response
 */
export const submitApplicationById = submitApplication;
