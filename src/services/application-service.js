// src/services/application-service.js
import api from "./axios-config";

/**
 * Application Service - Handles all application-related API calls
 * Maps to your .NET ApplicationService endpoints
 */

// API endpoints
const ENDPOINTS = {
  applications: "/applications",
  applicationsByUser: (userId) => `/applications/user/${userId}`,
  applicationsByUserPaged: "/applications/my-applications/paged",
  applicationsByPMI: (pmiCompanyId) => `/applications/pmi/${pmiCompanyId}`,
  applicationById: (id) => `/applications/${id}`,
  createApplication: "/applications",
  updateStatus: (id) => `/applications/${id}/status`,
  submitApplication: (id) => `/applications/${id}/submit`,
  deleteApplication: (id) => `/applications/${id}`,
};

/**
 * Get all applications (paginated)
 * Maps to: GetAllApplicationsPagedAsync()
 * @param {number} pageNumber - Page number (default: 1)
 * @param {number} pageSize - Page size (default: 50)
 * @returns {Promise<{data: Array, totalCount: number, pageNumber: number, pageSize: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean}>}
 */
export const getAllApplications = async (pageNumber = 1, pageSize = 50) => {
  try {
    const response = await api.get(ENDPOINTS.applications, {
      params: { pageNumber, pageSize },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching all applications:", error);
    throw new Error(error.message || "Failed to fetch applications");
  }
};

/**
 * Get applications by user ID (paginated)
 * Maps to: GetMyApplicationsPagedAsync()
 * @param {string} userId - User ID
 * @param {number} pageNumber - Page number (default: 1)
 * @param {number} pageSize - Page size (default: 50)
 * @returns {Promise<{data: Array, totalCount: number, pageNumber: number, pageSize: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean}>}
 */
export const getApplicationsByUser = async (
  userId,
  pageNumber = 1,
  pageSize = 50,
  searchTerm = "",
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const params = { pageNumber, pageSize };
    if (String(searchTerm || "").trim()) {
      params.searchTerm = String(searchTerm).trim();
    }

    const response = await api.get(ENDPOINTS.applicationsByUserPaged, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching applications for user ${userId}:`, error);
    throw new Error(error.message || "Failed to fetch user applications");
  }
};

/**
 * Get applications by PMI Company ID
 * Maps to: GetApplicationsByPMIAsync(Guid pmiCompanyId)
 */
export const getApplicationsByPMI = async (pmiCompanyId) => {
  if (!pmiCompanyId) {
    throw new Error("PMI Company ID is required");
  }

  try {
    const response = await api.get(ENDPOINTS.applicationsByPMI(pmiCompanyId));
    return response.data;
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
 * Maps to: GetApplicationByIdAsync(Guid id)
 */
export const getApplicationById = async (id) => {
  if (!id) {
    throw new Error("Application ID is required");
  }

  try {
    const response = await api.get(ENDPOINTS.applicationById(id));
    return response.data;
  } catch (error) {
    console.error(`Error fetching application ${id}:`, error);
    throw new Error(error.message || "Failed to fetch application");
  }
};

/**
 * Create a new application
 * Maps to: CreateApplicationAsync(Guid userId, CreateApplicationRequest request)
 */
export const createApplication = async (userId, applicationData) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!applicationData) {
    throw new Error("Application data is required");
  }

  try {
    const payload = {
      userId,
      ...applicationData,
    };

    const response = await api.post(ENDPOINTS.createApplication, payload);
    return response.data;
  } catch (error) {
    console.error("Error creating application:", error);
    throw new Error(error.message || "Failed to create application");
  }
};

/**
 * Update application status
 * Maps to: UpdateApplicationStatusAsync(Guid id, Guid reviewerId, UpdateApplicationStatusRequest request)
 */
export const updateApplicationStatus = async (id, statusData) => {
  if (!id) {
    throw new Error("Application ID is required");
  }
  if (!statusData || !statusData.status) {
    throw new Error("Status data is required");
  }

  try {
    const response = await api.put(ENDPOINTS.updateStatus(id), statusData);
    return response.data;
  } catch (error) {
    console.error(`Error updating application ${id} status:`, error);
    throw new Error(error.message || "Failed to update application status");
  }
};

/**
 * Submit application (change from draft to submitted)
 * Maps to: SubmitApplicationAsync(Guid id)
 */
export const submitApplication = async (id) => {
  if (!id) {
    throw new Error("Application ID is required");
  }

  try {
    const response = await api.put(ENDPOINTS.submitApplication(id));
    return response.data;
  } catch (error) {
    console.error(`Error submitting application ${id}:`, error);
    throw new Error(error.message || "Failed to submit application");
  }
};

/**
 * Delete application (only drafts can be deleted)
 * Maps to: DeleteApplicationAsync(Guid id)
 */
export const deleteApplication = async (id) => {
  if (!id) {
    throw new Error("Application ID is required");
  }

  try {
    const response = await api.delete(ENDPOINTS.deleteApplication(id));
    return response.data;
  } catch (error) {
    console.error(`Error deleting application ${id}:`, error);
    throw new Error(error.message || "Failed to delete application");
  }
};

/**
 * Calculate dashboard statistics from applications array
 * This replaces the mock calculateDashboardStats function
 */
export const calculateDashboardStats = (applications = []) => {
  const stats = {
    total: applications.length,
    draft: 0,
    submitted: 0,
    pending: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    returned: 0,
    completed: 0,
    incomplete: 0,
  };

  applications.forEach((app) => {
    const status = app.status?.toLowerCase();
    if (stats.hasOwnProperty(status)) {
      stats[status]++;
    }
  });

  return stats;
};

/**
 * Application Status Constants
 * These should match your backend status values
 */
export const ApplicationStatus = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  RETURNED: "returned",
  COMPLETED: "completed",
};

/**
 * Application Priority Constants
 */
export const ApplicationPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

/**
 * Helper function to format application data for display
 */
export const formatApplicationForDisplay = (application) => {
  if (!application) return null;

  return {
    ...application,
    fullName: `${application.firstName} ${application.middleName || ""} ${
      application.lastName
    }`.trim(),
    createdAtFormatted: new Date(application.createdAt).toLocaleDateString(),
    updatedAtFormatted: new Date(application.updatedAt).toLocaleDateString(),
    submittedAtFormatted: application.submittedAt
      ? new Date(application.submittedAt).toLocaleDateString()
      : null,
    // Format currency values
    equityValueFormatted: new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(application.equityValue),
    loanAmountFormatted: new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(application.loanAmount),
    propertyValueFormatted: new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(application.propertyValue),
    supplementaryValueFormatted: new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(application.supplementaryValue),
  };
};

/**
 * Helper function to get status color for UI
 */
export const getStatusColor = (status) => {
  const colors = {
    [ApplicationStatus.DRAFT]: "#6B7280",
    [ApplicationStatus.SUBMITTED]: "#3B82F6",
    [ApplicationStatus.UNDER_REVIEW]: "#F59E0B",
    [ApplicationStatus.APPROVED]: "#10B981",
    [ApplicationStatus.REJECTED]: "#EF4444",
    [ApplicationStatus.RETURNED]: "#F97316",
    [ApplicationStatus.COMPLETED]: "#10B981",
  };

  return colors[status?.toLowerCase()] || "#6B7280";
};

/**
 * Helper function to get priority color for UI
 */
export const getPriorityColor = (priority) => {
  const colors = {
    [ApplicationPriority.LOW]: "#10B981",
    [ApplicationPriority.MEDIUM]: "#F59E0B",
    [ApplicationPriority.HIGH]: "#F97316",
    [ApplicationPriority.URGENT]: "#EF4444",
  };

  return colors[priority?.toLowerCase()] || "#6B7280";
};

/**
 * Helper function to filter applications by status
 */
export const filterApplicationsByStatus = (applications, statusFilter) => {
  if (!statusFilter || statusFilter === "all") {
    return applications;
  }

  // Handle special filters
  if (statusFilter === "action_required") {
    return applications.filter(
      (app) =>
        app.status === ApplicationStatus.RETURNED ||
        app.status === "incomplete",
    );
  }

  if (statusFilter === "pending") {
    return applications.filter(
      (app) =>
        app.status === ApplicationStatus.SUBMITTED ||
        app.status === ApplicationStatus.UNDER_REVIEW,
    );
  }

  // Standard status filter
  return applications.filter(
    (app) => app.status?.toLowerCase() === statusFilter.toLowerCase(),
  );
};

/**
 * Helper function to sort applications
 */
export const sortApplications = (
  applications,
  sortBy = "createdAt",
  sortOrder = "desc",
) => {
  return [...applications].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle date fields
    if (sortBy.includes("At") || sortBy.includes("Date")) {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    // Handle numeric fields
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }

    // Handle string fields
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // Handle dates
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });
};

/**
 * Validation helper for application data
 */
export const validateApplicationData = (applicationData) => {
  const errors = [];

  // Required fields validation
  const requiredFields = [
    "firstName",
    "lastName",
    "rsaPin",
    "equityValue",
    "supplementaryValue",
    "loanAmount",
    "propertyValue",
  ];

  requiredFields.forEach((field) => {
    if (!applicationData[field]) {
      errors.push(`${field} is required`);
    }
  });

  // Numeric validation
  const numericFields = [
    "equityValue",
    "supplementaryValue",
    "loanAmount",
    "propertyValue",
  ];
  numericFields.forEach((field) => {
    if (
      applicationData[field] &&
      (isNaN(applicationData[field]) || applicationData[field] < 0)
    ) {
      errors.push(`${field} must be a valid positive number`);
    }
  });

  // RSA PIN validation (basic)
  if (applicationData.rsaPin && applicationData.rsaPin.length > 15) {
    errors.push("RSA PIN cannot exceed 15 characters");
  }

  // Email validation for PMI rep
  if (
    applicationData.pmiRepEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicationData.pmiRepEmail)
  ) {
    errors.push("PMI representative email must be valid");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Error handling wrapper for API calls
 * This provides consistent error handling across all API functions
 */
export const withErrorHandling = async (apiCall, errorContext = "API call") => {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`${errorContext} failed:`, error);

    // Extract meaningful error message
    let errorMessage = error.message;

    if (error.response?.data) {
      errorMessage =
        error.response.data.message ||
        error.response.data.error ||
        error.response.data;
    }

    throw new Error(errorMessage);
  }
};

/**
 * Bulk operations helper (for future use)
 */
export const bulkUpdateApplications = async (applicationIds, updateData) => {
  const promises = applicationIds.map((id) =>
    updateApplicationStatus(id, updateData.reviewerId, updateData),
  );

  try {
    const results = await Promise.allSettled(promises);
    const successes = results.filter((r) => r.status === "fulfilled");
    const failures = results.filter((r) => r.status === "rejected");

    return {
      success: successes.length,
      failed: failures.length,
      total: applicationIds.length,
      errors: failures.map((f) => f.reason.message),
    };
  } catch (error) {
    console.error("Bulk update failed:", error);
    throw error;
  }
};

// Export all functions as default object for easier importing
export default {
  getAllApplications,
  getApplicationsByUser,
  getApplicationsByPMI,
  getApplicationById,
  createApplication,
  updateApplicationStatus,
  submitApplication,
  deleteApplication,
  calculateDashboardStats,
  formatApplicationForDisplay,
  getStatusColor,
  getPriorityColor,
  filterApplicationsByStatus,
  sortApplications,
  validateApplicationData,
  withErrorHandling,
  bulkUpdateApplications,
  ApplicationStatus,
  ApplicationPriority,
};
