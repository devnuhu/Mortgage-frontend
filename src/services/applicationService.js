// src/services/applicationService.js
import api from "./axios-config";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100; // Backend maximum allowed page size

export { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE };

/**
 * Application API Service Functions
 * These functions match your .NET ApplicationsController endpoints
 */

// ==========================================
// APPLICATION ENDPOINTS
// ==========================================

/**
 * Get all applications
 * GET /api/applications with optional pagination query parameters
 */
export const getAllApplications = async (
  pageNumber = null,
  pageSize = DEFAULT_PAGE_SIZE,
) => {
  try {
    const params = {};
    if (pageNumber != null) {
      params.pageNumber = pageNumber;
      params.pageSize = pageSize;
    }

    const response = await api.get("/applications", { params });
    return response;
  } catch (error) {
    console.error("Error fetching applications:", error);
    throw error;
  }
};

/**
 * Search applications using the backend search endpoint
 * GET /api/applications/search?searchTerm={query}
 */
export const searchApplications = async (
  query,
  pageNumber = 1,
  pageSize = DEFAULT_PAGE_SIZE,
) => {
  try {
    const params = { pageNumber, pageSize };
    const normalized = query?.trim();

    if (normalized) {
      // Prefer explicit RSA PIN searches when the term looks like one.
      const rsaPinMatch = normalized.match(/^PEN[0-9A-Z]+$/i);
      if (rsaPinMatch) {
        params.rsaPin = normalized.toUpperCase();
      } else {
        params.borrowerName = normalized;
      }
    }

    const response = await api.get("/applications/search", { params });
    return response.data;
  } catch (error) {
    console.error("Error searching applications:", error);
    throw error;
  }
};

/**
 * Get applications by PMI company ID (filtered from all applications)
 * Uses the general /api/applications endpoint and filters by pmiCompanyId
 * @param {string} pmiCompanyId - PMI Company ID to filter by
 * @param {number} pageNumber - Page number (default: 1)
 * @param {number} pageSize - Page size (default: 50)
 * @returns {Promise<{data: Array, totalCount: number, pageNumber: number, pageSize: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean}>}
 */
export const getApplicationsByPMI = async (
  pmiCompanyId,
  pageNumber = 1,
  pageSize = DEFAULT_PAGE_SIZE,
) => {
  if (!pmiCompanyId) {
    throw new Error("PMI Company ID is required");
  }

  try {
    // Use the general applications endpoint with pagination
    const response = await api.get("/applications", {
      params: { pageNumber, pageSize },
    });

    // Filter applications by PMI company on the frontend
    const allApplications = response.data.data || [];
    const pmiApplications = allApplications.filter(
      (app) => app.pmiCompanyId === pmiCompanyId,
    );

    // Calculate pagination metadata for filtered results
    const totalCount = pmiApplications.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPreviousPage = pageNumber > 1;

    return {
      data: pmiApplications,
      totalCount,
      pageNumber,
      pageSize,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  } catch (error) {
    console.error(
      `Error fetching applications for PMI ${pmiCompanyId}:`,
      error,
    );
    throw new Error(error.message || "Failed to fetch PMI applications");
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
 * POST /api/files/upload
 */
export const uploadFile = async (applicationId, file, documentType) => {
  try {
    const formData = new FormData();
    formData.append("File", file);
    formData.append("ApplicationId", applicationId);
    formData.append("DocumentType", documentType);

    const response = await api.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      `Error uploading file for application ${applicationId}:`,
      error,
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
      error,
    );
    throw error;
  }
};

/**
 * Download file
 * GET /api/file/download/{fileId}
 */
export const downloadFile = async (fileId, fileName = null) => {
  try {
    const response = await api.get(`/file/download/${fileId}`, {
      responseType: "blob",
    });

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
// REPORTS ENDPOINTS
// ==========================================

/**
 * Generate application report with filtering and pagination
 * GET /api/reports/applications with query parameters
 */
const normalizeFilterArray = (filterValues) => {
  if (!filterValues) return undefined;

  let values = filterValues;
  if (typeof values === "string") {
    values = values.split(",");
  }
  if (!Array.isArray(values)) return undefined;

  const cleaned = values
    .map((value) =>
      String(value || "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned.join(",") : undefined;
};

const buildDateQueryValue = (dateValue, isEndOfDay = false) => {
  if (!dateValue) return undefined;

  if (dateValue instanceof Date) {
    dateValue = dateValue.toISOString().slice(0, 10);
  }

  if (typeof dateValue === "string") {
    dateValue = dateValue.trim();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const fractional = isEndOfDay ? "9999999" : "0000000";
    const time = isEndOfDay ? "23:59:59" : "00:00:00";
    return `${dateValue} ${time}.${fractional}`;
  }
  return dateValue;
};

export const generateApplicationReport = async (filters = {}) => {
  try {
    const params = {};

    // Pagination
    if (filters.pageNumber != null) params.pageNumber = filters.pageNumber;
    if (filters.pageSize != null) params.pageSize = filters.pageSize;

    // Date filters
    if (filters.dateFrom)
      params.dateFrom = buildDateQueryValue(filters.dateFrom);
    if (filters.dateTo)
      params.dateTo = buildDateQueryValue(filters.dateTo, true);
    if (filters.dateField) params.dateField = filters.dateField;

    // Status filters (comma-separated)
    const normalizedStatuses = normalizeFilterArray(filters.statuses);
    if (normalizedStatuses) {
      params.statuses = normalizedStatuses;
    }

    // Priority filters (comma-separated)
    const normalizedPriorities = normalizeFilterArray(filters.priorities);
    if (normalizedPriorities) {
      params.priorities = normalizedPriorities;
    }

    // Other filters
    if (filters.pmiCompanyId) params.pmiCompanyId = filters.pmiCompanyId;
    if (filters.userId) params.userId = filters.userId;
    if (filters.searchTerm) params.searchTerm = filters.searchTerm;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortDescending != null)
      params.sortDescending = filters.sortDescending;

    console.log("📊 Report Filter Inputs:", {
      filterStatuses: filters.statuses,
      statusesType: typeof filters.statuses,
      statusesLength: filters.statuses?.length,
    });
    console.log("📤 API Report Request params:", params);

    const response = await api.get("/reports/applications", { params });
    return response.data;
  } catch (error) {
    console.error("Error generating application report:", error);
    throw error;
  }
};

/**
 * Get report summary statistics
 * GET /api/reports/applications/summary with query parameters
 */
export const getReportSummary = async (filters = {}) => {
  try {
    const params = {};

    // Date filters
    if (filters.dateFrom)
      params.dateFrom = buildDateQueryValue(filters.dateFrom);
    if (filters.dateTo)
      params.dateTo = buildDateQueryValue(filters.dateTo, true);
    if (filters.dateField) params.dateField = filters.dateField;

    // Status filters (comma-separated)
    const normalizedStatuses = normalizeFilterArray(filters.statuses);
    if (normalizedStatuses) {
      params.statuses = normalizedStatuses;
    }

    // Priority filters (comma-separated)
    const normalizedPriorities = normalizeFilterArray(filters.priorities);
    if (normalizedPriorities) {
      params.priorities = normalizedPriorities;
    }

    // Other filters
    if (filters.pmiCompanyId) params.pmiCompanyId = filters.pmiCompanyId;
    if (filters.userId) params.userId = filters.userId;
    if (filters.searchTerm) params.searchTerm = filters.searchTerm;

    const response = await api.get("/reports/applications/summary", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching report summary:", error);
    throw error;
  }
};

const buildExportDateQueryValue = (dateValue) => {
  if (!dateValue) return undefined;

  if (dateValue instanceof Date) {
    return dateValue.toISOString().slice(0, 10);
  }

  if (typeof dateValue === "string") {
    const trimmed = dateValue.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : trimmed;
  }

  return dateValue;
};

export const exportApplicationReportExcel = async (filters = {}) => {
  try {
    const params = {};

    if (filters.dateFrom)
      params.dateFrom = buildExportDateQueryValue(filters.dateFrom);
    if (filters.dateTo)
      params.dateTo = buildExportDateQueryValue(filters.dateTo);
    if (filters.dateField) params.dateField = filters.dateField;

    const normalizedStatuses = normalizeFilterArray(filters.statuses);
    if (normalizedStatuses) {
      params.statuses = normalizedStatuses;
    }

    const normalizedPriorities = normalizeFilterArray(filters.priorities);
    if (normalizedPriorities) {
      params.priorities = normalizedPriorities;
    }

    if (filters.pmiCompanyId) params.pmiCompanyId = filters.pmiCompanyId;
    if (filters.userId) params.userId = filters.userId;
    if (filters.searchTerm) params.searchTerm = filters.searchTerm;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortDescending != null)
      params.sortDescending = filters.sortDescending;

    const response = await api.get("/reports/applications/export/excel", {
      params,
      responseType: "blob",
      headers: {
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, */*",
      },
    });

    return response;
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try {
        const errorText = await error.response.data.text();
        const parsed = JSON.parse(errorText);
        error.message = parsed.message || errorText;
      } catch (parseError) {
        // Ignore parse error and preserve original message
      }
    }
    console.error("Error exporting application report:", error);
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
      }),
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
