// src/services/api.js
import api from "./axios-config.js";
import {
  getDocumentMaxFileSizeBytes,
  getDocumentMaxFileSizeLabel,
} from "./documentSize.js";

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
export const getAllApplications = async (pageNumber = null, pageSize = 50) => {
  try {
    const params = {};
    if (pageNumber != null) {
      params.pageNumber = pageNumber;
      params.pageSize = pageSize;
    }

    const response = await api.get("/applications", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching all applications:", error);
    throw error;
  }
};

/**
 * Get current user's applications (Client only) - Paginated
 * GET /api/applications/my-applications/paged
 * @param {number} pageNumber - Page number (default: 1)
 * @param {number} pageSize - Page size (default: 50)
 * @returns {Promise<{data: Array, totalCount: number, pageNumber: number, pageSize: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean}>}
 */
export const getMyApplications = async (pageNumber = 1, pageSize = 50) => {
  try {
    const response = await api.get("/applications/my-applications/paged", {
      params: { pageNumber, pageSize },
    });
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
      (field) => !applicationData[field] && applicationData[field] !== 0,
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
 * PUT /api/applications/{id}/submit
 * @param {string} id - Application ID (GUID)
 * @returns {Promise<Object>} Success message
 */
export const submitApplicationById = async (id) => {
  try {
    if (!id) {
      throw new Error("Application ID is required");
    }
    const response = await api.put(`/applications/${id}/submit`);
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
  PENDING: "pending",
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
    [APPLICATION_STATUS.PENDING]: "Pending",
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
    [APPLICATION_STATUS.PENDING]: "#F59E0B", // Amber
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
 * POST /api/files/upload
 * @param {string} applicationId - Application ID
 * @param {string} documentType - Type of document
 * @param {File} file - File to upload
 * @returns {Promise<Object>} Upload response
 */
export const uploadPdfForApplication = async (
  applicationId,
  documentType,
  file,
) => {
  try {
    // Validate input
    if (!applicationId || !documentType || !file) {
      throw new Error("Application ID, document type, and file are required");
    }

    if (file.type !== "application/pdf") {
      throw new Error("Only PDF files are allowed");
    }

    const maxFileSizeBytes = getDocumentMaxFileSizeBytes(documentType);
    if (file.size > maxFileSizeBytes) {
      throw new Error(
        `File size exceeds maximum limit of ${getDocumentMaxFileSizeLabel(documentType)} for this document type`,
      );
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("File", file);
    formData.append("ApplicationId", applicationId);
    formData.append("DocumentType", documentType);

    // Make API call with multipart/form-data
    let response;
    try {
      response = await api.post("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn(
          "⚠️ /files/upload not found, retrying legacy /file/upload route",
        );
        response = await api.post("/file/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        throw error;
      }
    }

    console.log("📄 File uploaded successfully:", {
      fileName: file.name,
      size: file.size,
      applicationId,
      documentType,
    });

    return response.data;
  } catch (error) {
    console.error("❌ File upload error:", error);

    const responseData = error.response?.data;

    if (error.response?.status === 400) {
      const serverMessage =
        responseData?.message ||
        responseData?.error ||
        responseData?.title ||
        (typeof responseData === "string" ? responseData : "");

      if (serverMessage) {
        throw new Error(serverMessage);
      }

      if (responseData?.errors) {
        const flattenedErrors = Object.values(responseData.errors)
          .flat()
          .filter(Boolean)
          .join(" ");

        if (flattenedErrors) {
          throw new Error(flattenedErrors);
        }
      }

      throw new Error("File upload failed due to invalid input");
    } else if (error.response?.status === 401) {
      throw new Error("You must be logged in to upload files");
    } else if (error.response?.status === 403) {
      throw new Error(
        "You don't have permission to upload files or the application is not editable",
      );
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

    const response = await api.get(`/file/application/${applicationId}`);

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
    } else if (error.response?.status === 403) {
      throw new Error(
        "You don't have permission to view files for this application",
      );
    } else if (!error.response) {
      throw new Error("Network error. Please check your connection");
    }

    throw error;
  }
};

/**
 * Get all document types
 * GET /api/documenttypes
 * @returns {Promise<Array>} List of supported document types
 */
export const getDocumentTypes = async () => {
  try {
    const response = await api.get("/documenttypes");
    return response.data || [];
  } catch (error) {
    console.error("❌ Get document types error:", error);

    if (error.response?.status === 401) {
      throw new Error("You must be logged in to fetch document types");
    } else if (error.response?.status === 403) {
      throw new Error("You don't have permission to fetch document types");
    } else if (!error.response) {
      throw new Error("Network error. Please check your connection");
    }

    throw error;
  }
};

/**
 * Delete file by ID
 * DELETE /api/files/{fileId}
 * @param {string} fileId - File ID to delete
 * @returns {Promise<Object>} Delete response
 */
export const deleteFileById = async (fileId) => {
  try {
    if (!fileId) {
      throw new Error("File ID is required");
    }

    let response;
    try {
      response = await api.delete(`/files/${fileId}`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn(
          "⚠️ /files/{fileId} not found, retrying legacy /file/{fileId} route",
        );
        response = await api.delete(`/file/${fileId}`);
      } else {
        throw error;
      }
    }

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
 * @param {string} fileName - Optional filename for download
 * @returns {Promise<Blob>} File blob for download
 */
export const downloadFile = async (fileId, fileName = null) => {
  try {
    if (!fileId) {
      throw new Error("File ID is required");
    }

    const response = await api.get(`/file/download/${fileId}`, {
      responseType: "blob", // Important for file downloads
    });

    console.log("⬇️ File download started:", { fileId });

    // Create blob and trigger browser download
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;

    // Try to extract filename from Content-Disposition header
    const contentDisposition = response.headers["content-disposition"];
    let downloadFileName = fileName;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/i);
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
 * Replace an existing file by ID
 * PUT /api/files/{fileId}/replace
 * @param {string} existingFileId - Existing file ID to replace
 * @param {File} file - New file to upload
 * @returns {Promise<Object>} Replace response
 */
export const replaceFileById = async (
  existingFileId,
  file,
  documentType = "",
) => {
  try {
    if (!existingFileId || !file) {
      throw new Error("File ID and replacement file are required");
    }

    if (file.type !== "application/pdf") {
      throw new Error("Only PDF files are allowed");
    }

    const maxFileSizeBytes = getDocumentMaxFileSizeBytes(documentType);
    if (file.size > maxFileSizeBytes) {
      throw new Error(
        `File size exceeds maximum limit of ${getDocumentMaxFileSizeLabel(documentType)} for this document type`,
      );
    }

    const formData = new FormData();
    formData.append("File", file);
    formData.append("ExistingFileId", existingFileId);

    let response;
    try {
      response = await api.put(`/files/${existingFileId}/replace`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn(
          "⚠️ /files/{fileId}/replace not found, retrying legacy /file/replace route",
        );
        response = await api.post("/file/replace", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        throw error;
      }
    }

    console.log("🔁 File replaced successfully:", {
      existingFileId,
      fileName: file.name,
    });

    return response.data;
  } catch (error) {
    console.error("❌ Replace file error:", error);

    const responseData = error.response?.data;

    if (error.response?.status === 400) {
      const serverMessage =
        responseData?.message ||
        responseData?.error ||
        responseData?.title ||
        (typeof responseData === "string" ? responseData : "");

      if (serverMessage) {
        throw new Error(serverMessage);
      }

      if (responseData?.errors) {
        const flattenedErrors = Object.values(responseData.errors)
          .flat()
          .filter(Boolean)
          .join(" ");

        if (flattenedErrors) {
          throw new Error(flattenedErrors);
        }
      }

      throw new Error("File replacement failed due to invalid input");
    } else if (error.response?.status === 401) {
      throw new Error("You must be logged in to replace files");
    } else if (error.response?.status === 403) {
      throw new Error(
        "You don't have permission to replace this file or the application is not in a replacable state",
      );
    } else if (!error.response) {
      throw new Error("Network error. Please check your connection");
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
