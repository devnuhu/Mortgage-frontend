// src/services/applicationService.js
import api from "./axios-config";

/**
 * Application API Service Functions
 * These functions match your .NET ApplicationsController endpoints
 */

// ==========================================
// APPLICATION ENDPOINTS
// ==========================================

/**
 * Get all applications
 * GET /api/applications
 */
export const getAllApplications = async () => {
  try {
    const response = await api.get("/applications");
    return response.data;
  } catch (error) {
    console.error("Error fetching applications:", error);
    throw error;
  }
};

/**
 * Get application by ID
 * GET /api/applications/{id}
 */
export const getApplicationById = async (id) => {
  try {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching application ${id}:`, error);
    throw error;
  }
};

/**
 * Create new application
 * POST /api/applications
 */
export const createApplication = async (applicationData) => {
  try {
    const response = await api.post("/applications", applicationData);
    return response.data;
  } catch (error) {
    console.error("Error creating application:", error);
    throw error;
  }
};

/**
 * Update application status
 * PUT /api/applications/{id}/status
 */
export const updateApplicationStatus = async (id, statusData) => {
  try {
    const response = await api.put(`/applications/${id}/status`, statusData);
    return response.data;
  } catch (error) {
    console.error(`Error updating application ${id} status:`, error);
    throw error;
  }
};

/**
 * Delete application
 * DELETE /api/applications/{id}
 */
export const deleteApplication = async (id) => {
  try {
    const response = await api.delete(`/applications/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting application ${id}:`, error);
    throw error;
  }
};

// ==========================================
// FILE/DOCUMENT ENDPOINTS
// ==========================================

/**
 * Upload file for application
 * POST /api/file/upload
 */
export const uploadFile = async (applicationId, file, documentType) => {
  try {
    const formData = new FormData();
    formData.append("File", file);
    formData.append("ApplicationId", applicationId);
    formData.append("DocumentType", documentType);

    const response = await api.post("/file/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      `Error uploading file for application ${applicationId}:`,
      error
    );
    throw error;
  }
};

/**
 * Get files for application
 * GET /api/file/application/{applicationId}
 */
export const getFilesByApplication = async (applicationId) => {
  try {
    const response = await api.get(`/file/application/${applicationId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching files for application ${applicationId}:`,
      error
    );
    throw error;
  }
};

/**
 * Download file
 * GET /api/file/download/{fileId}
 */
export const downloadFile = async (fileId) => {
  try {
    const response = await api.get(`/file/download/${fileId}`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error(`Error downloading file ${fileId}:`, error);
    throw error;
  }
};

/**
 * Delete file
 * DELETE /api/file/{fileId}
 */
export const deleteFile = async (fileId) => {
  try {
    const response = await api.delete(`/file/${fileId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting file ${fileId}:`, error);
    throw error;
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Format currency value
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Get status badge color
 */
export const getStatusColor = (status) => {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    under_review: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    submitted: "bg-purple-100 text-purple-800",
  };

  return statusColors[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
};

/**
 * Get priority badge color
 */
export const getPriorityColor = (priority) => {
  const priorityColors = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
    normal: "bg-blue-100 text-blue-800",
  };

  return priorityColors[priority?.toLowerCase()] || "bg-gray-100 text-gray-800";
};

/**
 * Map backend DTO to frontend format
 */
export const mapApplicationFromBackend = (backendApp) => {
  return {
    id: backendApp.id,
    applicationNumber: backendApp.applicationNumber,
    borrowerName: `${backendApp.firstName} ${
      backendApp.middleName ? backendApp.middleName + " " : ""
    }${backendApp.lastName}`.trim(),
    firstName: backendApp.firstName,
    middleName: backendApp.middleName,
    lastName: backendApp.lastName,
    rsaPin: backendApp.rsaPin,
    equityValue: backendApp.equityValue,
    supplementaryValue: backendApp.supplementaryValue,
    loanAmount: backendApp.loanAmount,
    propertyValue: backendApp.propertyValue,
    pmiCompany: backendApp.pmiCompanyName || backendApp.companyName,
    pmiRepName: backendApp.pmiRepName,
    pmiRepEmail: backendApp.pmiRepEmail,
    status: backendApp.status,
    priority: backendApp.priority,
    submissionDate: backendApp.submittedAt || backendApp.createdAt,
    createdAt: backendApp.createdAt,
    updatedAt: backendApp.updatedAt,
    submittedAt: backendApp.submittedAt,
    userId: backendApp.userId,
    userName: backendApp.userName,
    pmiCompanyId: backendApp.pmiCompanyId,
    companyName: backendApp.companyName,
    documents: Array.from(
      { length: backendApp.documentCount || 0 },
      (_, index) => ({
        id: `doc-${index}`,
        name: `Document ${index + 1}`,
        type: "application/pdf",
        size: "2.5 MB",
        uploadedAt: backendApp.createdAt,
      })
    ),
  };
};

/**
 * Map frontend data to backend DTO format
 */
export const mapApplicationToBackend = (frontendApp) => {
  return {
    firstName: frontendApp.firstName,
    middleName: frontendApp.middleName || null,
    lastName: frontendApp.lastName,
    rsaPin: frontendApp.rsaPin,
    equityValue: frontendApp.equityValue,
    supplementaryValue: frontendApp.supplementaryValue,
    loanAmount: frontendApp.loanAmount,
    propertyValue: frontendApp.propertyValue,
  };
};

/**
 * Generate file download URL
 */
export const getFileDownloadUrl = (fileId) => {
  return `/api/file/download/${fileId}`;
};

/**
 * Validate application data
 */
export const validateApplicationData = (data) => {
  const errors = [];

  if (!data.firstName?.trim()) {
    errors.push("First name is required");
  }

  if (!data.lastName?.trim()) {
    errors.push("Last name is required");
  }

  if (!data.rsaPin?.trim()) {
    errors.push("RSA PIN is required");
  }

  if (!data.equityValue || data.equityValue <= 0) {
    errors.push("Valid equity value is required");
  }

  if (!data.supplementaryValue || data.supplementaryValue < 0) {
    errors.push("Valid supplementary value is required");
  }

  if (!data.loanAmount || data.loanAmount <= 0) {
    errors.push("Valid loan amount is required");
  }

  if (!data.propertyValue || data.propertyValue <= 0) {
    errors.push("Valid property value is required");
  }

  return errors;
};
