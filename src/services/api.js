// src/services/api.js
import api from "./axios-config";

/**
 * Application API Service Functions
 * These functions match your .NET ApplicationsController endpoints
 */

// ==========================================
// APPLICATION ENDPOINTS
// ==========================================

/**
 * Get all applications (Admin/Super Admin only)
 * GET /api/applications
 * @returns {Promise<Array>} List of all applications
 */
export const getAllApplications = async () => {
  try {
    const response = await api.get("/applications");
    return response.data;
  } catch (error) {
    console.error("Error fetching all applications:", error);
    throw error;
  }
};

/**
 * Get current user's applications (Client only)
 * GET /api/applications/my-applications
 * @returns {Promise<Array>} List of user's applications
 */
export const getMyApplications = async () => {
  try {
    const response = await api.get("/applications/my-applications");
    return response.data;
  } catch (error) {
    console.error("Error fetching my applications:", error);
    throw error;
  }
};

/**
 * Get a specific application by ID
 * GET /api/applications/{id}
 * @param {string} id - Application ID (GUID)
 * @returns {Promise<Object>} Application details
 */
export const getApplicationById = async (id) => {
  try {
    if (!id) {
      throw new Error("Application ID is required");
    }
    const response = await api.get(`/applications/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching application ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new application (Client only)
 * POST /api/applications
 * @param {Object} applicationData - Application creation data
 * @param {string} applicationData.firstName - First name
 * @param {string} applicationData.lastName - Last name
 * @param {string} [applicationData.middleName] - Middle name (optional)
 * @param {string} applicationData.rsaPin - RSA Pin
 * @param {number} applicationData.equityValue - Equity value
 * @param {number} applicationData.supplementaryValue - Supplementary value
 * @param {number} applicationData.loanAmount - Loan amount
 * @param {number} applicationData.propertyValue - Property value
 * @returns {Promise<Object>} Created application
 */
export const createApplication = async (applicationData) => {
  try {
    // Validate required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "rsaPin",
      "equityValue",
      "supplementaryValue",
      "loanAmount",
      "propertyValue",
    ];
    const missingFields = requiredFields.filter(
      (field) => !applicationData[field] && applicationData[field] !== 0
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Prepare the payload to match your .NET API expectations
    const payload = {
      firstName: applicationData.firstName,
      lastName: applicationData.lastName,
      middleName: applicationData.middleName || null,
      rsaPin: applicationData.rsaPin,
      equityValue: Number(applicationData.equityValue),
      supplementaryValue: Number(applicationData.supplementaryValue),
      loanAmount: Number(applicationData.loanAmount),
      propertyValue: Number(applicationData.propertyValue),
    };

    const response = await api.post("/applications", payload);
    return response.data;
  } catch (error) {
    console.error("Error creating application:", error);
    throw error;
  }
};

/**
 * Submit an application (Client only)
 * POST /api/applications/{id}/submit
 * @param {string} id - Application ID (GUID)
 * @returns {Promise<Object>} Success message
 */
export const submitApplicationById = async (id) => {
  try {
    if (!id) {
      throw new Error("Application ID is required");
    }
    const response = await api.post(`/applications/${id}/submit`);
    return response.data;
  } catch (error) {
    console.error(`Error submitting application ${id}:`, error);
    throw error;
  }
};

/**
 * Update application status (Admin/Super Admin only)
 * PUT /api/applications/{id}/status
 * @param {string} id - Application ID (GUID)
 * @param {Object} statusData - Status update data
 * @param {string} statusData.status - New status
 * @param {string} [statusData.reviewerComments] - Optional reviewer comments
 * @returns {Promise<Object>} Updated application
 */
export const updateApplicationStatus = async (id, statusData) => {
  try {
    if (!id) {
      throw new Error("Application ID is required");
    }
    if (!statusData.status) {
      throw new Error("Status is required");
    }

    const response = await api.put(`/applications/${id}/status`, statusData);
    return response.data;
  } catch (error) {
    console.error(`Error updating application status ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an application (Client only)
 * DELETE /api/applications/{id}
 * @param {string} id - Application ID (GUID)
 * @returns {Promise<Object>} Success message
 */
export const deleteApplication = async (id) => {
  try {
    if (!id) {
      throw new Error("Application ID is required");
    }
    const response = await api.delete(`/applications/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting application ${id}:`, error);
    throw error;
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Check if current user has admin privileges
 * @returns {boolean} True if user is admin or super admin
 */
export const isUserAdmin = () => {
  const user = JSON.parse(localStorage.getItem("authUser") || "{}");
  const userRole = user.role || "";
  return ["ADMIN", "SUPER_ADMIN"].includes(userRole.toUpperCase());
};

/**
 * Check if current user is a client
 * @returns {boolean} True if user is client
 */
export const isUserClient = () => {
  const user = JSON.parse(localStorage.getItem("authUser") || "{}");
  const userRole = user.role || "";
  return userRole.toUpperCase() === "CLIENT";
};

/**
 * Get current user info
 * @returns {Object} Current user data
 */
export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("authUser") || "{}");
  } catch (error) {
    console.error("Error parsing user data:", error);
    return {};
  }
};

// ==========================================
// APPLICATION STATUS HELPERS
// ==========================================

/**
 * Application status constants that match your backend
 */
export const APPLICATION_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  RETURNED: "returned",
  COMPLETED: "completed",
};

/**
 * Get human-readable status text
 * @param {string} status - Application status
 * @returns {string} Formatted status text
 */
export const getStatusText = (status) => {
  const statusMap = {
    [APPLICATION_STATUS.DRAFT]: "Draft",
    [APPLICATION_STATUS.SUBMITTED]: "Submitted",
    [APPLICATION_STATUS.UNDER_REVIEW]: "Under Review",
    [APPLICATION_STATUS.APPROVED]: "Approved",
    [APPLICATION_STATUS.REJECTED]: "Rejected",
    [APPLICATION_STATUS.RETURNED]: "Returned",
    [APPLICATION_STATUS.COMPLETED]: "Completed",
  };

  return statusMap[status] || status;
};

/**
 * Get status color for UI styling
 * @param {string} status - Application status
 * @returns {string} Color class or hex code
 */
export const getStatusColor = (status) => {
  const colorMap = {
    [APPLICATION_STATUS.DRAFT]: "#6B7280", // Gray
    [APPLICATION_STATUS.SUBMITTED]: "#3B82F6", // Blue
    [APPLICATION_STATUS.UNDER_REVIEW]: "#F59E0B", // Amber
    [APPLICATION_STATUS.APPROVED]: "#10B981", // Green
    [APPLICATION_STATUS.REJECTED]: "#EF4444", // Red
    [APPLICATION_STATUS.RETURNED]: "#8B5CF6", // Purple
    [APPLICATION_STATUS.COMPLETED]: "#059669", // Emerald
  };

  return colorMap[status] || "#6B7280";
};

// ==========================================
// FILE MANAGEMENT ENDPOINTS
// ==========================================

/**
 * Upload PDF file for application
 * POST /api/File/upload
 * @param {string} applicationId - Application ID
 * @param {string} documentType - Type of document
 * @param {File} file - File to upload
 * @returns {Promise<Object>} Upload response
 */
export const uploadPdfForApplication = async (
  applicationId,
  documentType,
  file
) => {
  try {
    // Validate input
    if (!applicationId || !documentType || !file) {
      throw new Error("Application ID, document type, and file are required");
    }

    if (file.type !== "application/pdf") {
      throw new Error("Only PDF files are allowed");
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("File", file);
    formData.append("ApplicationId", applicationId);
    formData.append("DocumentType", documentType);

    // Make API call with multipart/form-data
    const response = await api.post("/File/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("📄 File uploaded successfully:", {
      fileName: file.name,
      size: file.size,
      applicationId,
      documentType,
    });

    return response.data;
  } catch (error) {
    console.error("❌ File upload error:", error);

    // Enhanced error handling
    if (error.response?.status === 400) {
      const serverMessage = error.response.data?.message;
      if (serverMessage?.toLowerCase().includes("file type")) {
        throw new Error("Invalid file type. Only PDF files are allowed");
      } else if (serverMessage?.toLowerCase().includes("size")) {
        throw new Error("File size exceeds maximum limit");
      }
    } else if (error.response?.status === 401) {
      throw new Error("You must be logged in to upload files");
    } else if (!error.response) {
      throw new Error("Network error. Please check your connection");
    }

    throw error;
  }
};

/**
 * Get files by application ID
 * GET /api/File/application/{applicationId}
 * @param {string} applicationId - Application ID
 * @returns {Promise<Array>} List of files
 */
export const listFiles = async (applicationId) => {
  try {
    if (!applicationId) {
      throw new Error("Application ID is required");
    }

    const response = await api.get(`/File/application/${applicationId}`);

    console.log("📋 Files retrieved:", {
      applicationId,
      count: response.data?.length || 0,
    });

    return response.data || [];
  } catch (error) {
    console.error("❌ List files error:", error);

    if (error.response?.status === 404) {
      return []; // Return empty array if no files found
    } else if (error.response?.status === 401) {
      throw new Error("You must be logged in to view files");
    } else if (!error.response) {
      throw new Error("Network error. Please check your connection");
    }

    throw error;
  }
};

/**
 * Delete file by ID
 * DELETE /api/File/{fileId}
 * @param {string} fileId - File ID to delete
 * @returns {Promise<Object>} Delete response
 */
export const deleteFileById = async (fileId) => {
  try {
    if (!fileId) {
      throw new Error("File ID is required");
    }

    const response = await api.delete(`/File/${fileId}`);

    console.log("🗑️ File deleted successfully:", { fileId });

    return response.data;
  } catch (error) {
    console.error("❌ Delete file error:", error);

    if (error.response?.status === 404) {
      throw new Error("File not found");
    } else if (error.response?.status === 401) {
      throw new Error("You must be logged in to delete files");
    } else if (error.response?.status === 403) {
      throw new Error("You don't have permission to delete this file");
    } else if (!error.response) {
      throw new Error("Network error. Please check your connection");
    }

    throw error;
  }
};

/**
 * Download file by ID
 * GET /api/File/download/{fileId}
 * @param {string} fileId - File ID to download
 * @returns {Promise<Blob>} File blob for download
 */
export const downloadFile = async (fileId) => {
  try {
    if (!fileId) {
      throw new Error("File ID is required");
    }

    const response = await api.get(`/File/download/${fileId}`, {
      responseType: "blob", // Important for file downloads
    });

    console.log("⬇️ File download started:", { fileId });

    return response.data;
  } catch (error) {
    console.error("❌ Download file error:", error);

    if (error.response?.status === 404) {
      throw new Error("File not found");
    } else if (error.response?.status === 401) {
      throw new Error("You must be logged in to download files");
    } else if (error.response?.status === 403) {
      throw new Error("You don't have permission to download this file");
    }

    throw error;
  }
};

/**
 * Trigger file download in browser
 * @param {Blob} blob - File blob
 * @param {string} filename - File name
 */
export const triggerFileDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
