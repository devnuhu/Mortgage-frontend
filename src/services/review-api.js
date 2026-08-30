import api from "./axios-config";

/**
 * Review API Service Functions
 * Handles reviewer/admin workflow for document and application review
 */

// ==========================================
// ASSIGNMENT ENDPOINTS
// ==========================================

/**
 * Get assigned applications for the current reviewer
 * GET /api/assignments/mine
 * @returns {Promise<Array>} List of ApplicationDto objects
 */
export const getAssignedApplications = async () => {
  try {
    const response = await api.get("/assignments/mine");
    return Array.isArray(response.data)
      ? response.data
      : response.data.data || [];
  } catch (error) {
    console.error("❌ Get assigned applications error:", error);
    throw error;
  }
};

// ==========================================
// APPLICATION DETAILS ENDPOINTS
// ==========================================

/**
 * Get full application details with documents and review status
 * GET /api/applications/{id}/details
 * @param {string} applicationId - The application ID (Guid)
 * @returns {Promise<Object>} ApplicationDetailsDto with full details, documents, and review history
 */
export const getApplicationDetails = async (applicationId) => {
  try {
    const response = await api.get(`/applications/${applicationId}/details`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Get application details error for ${applicationId}:`,
      error,
    );
    throw error;
  }
};

/**
 * Get application summary by id using the standard applications endpoint
 * GET /api/applications/{id}
 * @param {string} applicationId
 * @returns {Promise<Object>} Application summary object
 */
export const getApplicationById = async (applicationId) => {
  try {
    const response = await api.get(`/applications/${applicationId}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Get application by id error for ${applicationId}:`,
      error,
    );
    throw error;
  }
};

// ==========================================
// DOCUMENT REVIEW ACTIONS
// ==========================================

/**
 * Approve a document for review
 * POST /api/review/approve/{documentId}
 * @param {string} documentId - The document ID (Guid)
 * @param {string} comments - Reviewer comments on the document
 * @returns {Promise<Object>} Response with message and documentId
 */
export const approveDocument = async (documentId, comments = "") => {
  try {
    const response = await api.post(`/review/approve/${documentId}`, {
      comments,
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Approve document error for ${documentId}:`, error);
    throw error;
  }
};

/**
 * Reject a document for review
 * POST /api/review/reject/{documentId}
 * @param {string} documentId - The document ID (Guid)
 * @param {string} comments - Reason for rejection
 * @returns {Promise<Object>} Response with message and documentId
 */
export const rejectDocument = async (documentId, comments = "") => {
  try {
    const response = await api.post(`/review/reject/${documentId}`, {
      comments,
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Reject document error for ${documentId}:`, error);
    throw error;
  }
};

/**
 * Request revision on a document
 * POST /api/review/request-revision/{documentId}
 * @param {string} documentId - The document ID (Guid)
 * @param {string} comments - Requested changes
 * @returns {Promise<Object>} Response with message and documentId
 */
export const requestDocumentRevision = async (documentId, comments = "") => {
  try {
    const response = await api.post(`/review/request-revision/${documentId}`, {
      comments,
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Request revision error for ${documentId}:`, error);
    throw error;
  }
};

// ==========================================
// DOCUMENT DOWNLOAD
// ==========================================

/**
 * Download document binary content
 * GET /api/file/download/{fileId}
 * @param {string} fileId - The file/document ID (Guid)
 * @returns {Promise<Blob>} Binary file content
 */
export const downloadDocument = async (fileId) => {
  try {
    const response = await api.get(`/file/download/${fileId}`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Download document error for ${fileId}:`, error);
    throw error;
  }
};

/**
 * Get download URL for a document (for iframe embedding)
 * @param {string} fileId - The file/document ID
 * @returns {string} Full download URL with auth token
 */
export const getDocumentDownloadUrl = (fileId) => {
  const token = localStorage.getItem("authToken");
  const baseUrl = api.defaults.baseURL || "http://localhost:5000/api";
  return `${baseUrl}/file/download/${fileId}${token ? `?token=${token}` : ""}`;
};

// ==========================================
// DOCUMENT LIST (by application)
// ==========================================

/**
 * Get list of documents for an application
 * GET /api/file/application/{applicationId}
 * @param {string} applicationId - The application ID (Guid)
 * @returns {Promise<Array>} List of FileUploadResponse objects
 */
export const getApplicationDocuments = async (applicationId) => {
  try {
    const response = await api.get(`/file/application/${applicationId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(
      `❌ Get application documents error for ${applicationId}:`,
      error,
    );
    throw error;
  }
};

// ==========================================
// MERGED DOCUMENT DOWNLOAD
// ==========================================

/**
 * Download all application documents merged as a single PDF
 * GET /api/applications/{applicationId}/documents/download-all
 * @param {string} applicationId - The application ID (Guid)
 * @returns {Promise<Blob>} Merged PDF file content
 */
export const downloadAllApplicationDocuments = async (applicationId) => {
  try {
    const response = await api.get(
      `/applications/${applicationId}/documents/download-all`,
      {
        responseType: "blob",
      },
    );
    return response.data;
  } catch (error) {
    console.error(
      `❌ Download all documents error for ${applicationId}:`,
      error,
    );
    throw error;
  }
};
