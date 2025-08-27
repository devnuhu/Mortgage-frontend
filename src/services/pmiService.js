import api from "./axios-config";

/**
 * PMI Company API Service Functions
 * These functions interface with your .NET PMI Controller endpoints
 */

// ==========================================
// PMI COMPANY ENDPOINTS
// ==========================================

/**
 * Get all PMI companies (Admin only)
 * GET /api/PMI
 * @returns {Promise<Array>} List of all PMI companies
 */
export const getAllPMICompanies = async () => {
  try {
    const response = await api.get("/PMI");
    return response.data;
  } catch (error) {
    console.error("❌ Get all PMI companies error:", error);
    throw error;
  }
};

/**
 * Get PMI company by ID
 * GET /api/PMI/{id}
 * @param {string} id - PMI Company ID
 * @returns {Promise<Object>} PMI company details
 */
export const getPMICompanyById = async (id) => {
  try {
    if (!id) {
      throw new Error("PMI Company ID is required");
    }

    const response = await api.get(`/PMI/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Get PMI company ${id} error:`, error);
    throw error;
  }
};

/**
 * Create new PMI company (Admin only)
 * POST /api/PMI
 * @param {Object} pmiData - PMI company data
 * @returns {Promise<Object>} Created PMI company with temporary password
 */
export const createPMICompany = async (pmiData) => {
  try {
    if (!pmiData) {
      throw new Error("PMI company data is required");
    }

    const response = await api.post("/PMI", pmiData);
    return response.data;
  } catch (error) {
    console.error("❌ Create PMI company error:", error);
    throw error;
  }
};

/**
 * Update PMI company (Admin only)
 * PUT /api/PMI/{id}
 * @param {string} id - PMI Company ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated PMI company
 */
export const updatePMICompany = async (id, updateData) => {
  try {
    if (!id) {
      throw new Error("PMI Company ID is required");
    }
    if (!updateData) {
      throw new Error("Update data is required");
    }

    const response = await api.put(`/PMI/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`❌ Update PMI company ${id} error:`, error);
    throw error;
  }
};

/**
 * Update PMI company status (Admin only)
 * PATCH /api/PMI/{id}/status
 * @param {string} id - PMI Company ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Success response
 */
export const updatePMICompanyStatus = async (id, status) => {
  try {
    if (!id) {
      throw new Error("PMI Company ID is required");
    }
    if (!status) {
      throw new Error("Status is required");
    }

    const response = await api.patch(`/PMI/${id}/status`, { Status: status });
    return response.data;
  } catch (error) {
    console.error(`❌ Update PMI company ${id} status error:`, error);
    throw error;
  }
};

/**
 * Reset PMI company temporary password (Admin only)
 * POST /api/PMI/{id}/reset-password
 * @param {string} id - PMI Company ID
 * @returns {Promise<Object>} Response with new temporary password
 */
export const resetTempPassword = async (id) => {
  try {
    if (!id) {
      throw new Error("PMI Company ID is required");
    }

    const response = await api.post(`/PMI/${id}/reset-password`);
    return response.data;
  } catch (error) {
    console.error(`❌ Reset PMI company ${id} password error:`, error);
    throw error;
  }
};

/**
 * Delete PMI company (Admin only)
 * DELETE /api/PMI/{id}
 * @param {string} id - PMI Company ID
 * @returns {Promise<Object>} Success response
 */
export const deletePMICompany = async (id) => {
  try {
    if (!id) {
      throw new Error("PMI Company ID is required");
    }

    const response = await api.delete(`/PMI/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Delete PMI company ${id} error:`, error);
    throw error;
  }
};

// ==========================================
// HELPER FUNCTIONS FOR CLIENT ACCESS
// ==========================================

/**
 * Get PMI company data for current user (Client access)
 * This function tries to get PMI data, handling authorization gracefully
 * @param {string} pmiCompanyId - PMI Company ID from user profile
 * @returns {Promise<Object|null>} PMI company data or null if access denied
 */
export const getPMICompanyForUser = async (pmiCompanyId) => {
  try {
    if (!pmiCompanyId) {
      console.warn("No PMI Company ID provided for user");
      return null;
    }

    // Try to get the PMI company data
    const pmiCompany = await getPMICompanyById(pmiCompanyId);
    return pmiCompany;
  } catch (error) {
    // If access is denied (401/403), return limited data
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn(
        "User doesn't have permission to access PMI details, using fallback"
      );
      return null;
    }

    // For other errors, re-throw
    throw error;
  }
};

// ==========================================
// FORMATTING HELPERS
// ==========================================

/**
 * Format PMI company for display
 * @param {Object} pmiCompany - Raw PMI company from API
 * @returns {Object} Formatted PMI company for UI
 */
export const formatPMICompanyForDisplay = (pmiCompany) => {
  if (!pmiCompany) return null;

  return {
    id: pmiCompany.id,
    name: pmiCompany.pmiName,
    pmiName: pmiCompany.pmiName, // Keep both for compatibility
    email: pmiCompany.emailAddress,
    emailAddress: pmiCompany.emailAddress, // Keep both for compatibility
    resourcePersonName: pmiCompany.resourcePersonName,
    resourcePersonEmail: pmiCompany.resourcePersonEmail,
    phoneNumber: pmiCompany.phoneNumber,
    status: pmiCompany.status,
    createdAt: pmiCompany.createdAt,
    updatedAt: pmiCompany.updatedAt,
    totalApplications: pmiCompany.totalApplications || 0,
    pendingApplications: pmiCompany.pendingApplications || 0,
    approvedApplications: pmiCompany.approvedApplications || 0,
  };
};

/**
 * Get PMI status color for UI display
 * @param {string} status - PMI company status
 * @returns {string} CSS classes for status color
 */
export const getPMIStatusColor = (status) => {
  const normalizedStatus = status?.toLowerCase();
  switch (normalizedStatus) {
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "suspended":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// ==========================================
// DEFAULT EXPORT (PMI Service Object)
// ==========================================

const PMIService = {
  getAllPMICompanies,
  getPMICompanyById,
  createPMICompany,
  updatePMICompany,
  updatePMICompanyStatus,
  resetTempPassword, // Added this function
  deletePMICompany,
  getPMICompanyForUser,
  formatPMICompanyForDisplay,
  getPMIStatusColor,
};

export default PMIService;
