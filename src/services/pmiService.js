import api from "./axios-config";
import * as UserManagementAPI from "./user-management-api";

/**
 * PMI Company API Service Functions
 */

/**
 * Get all PMI companies
 * @returns {Promise<Array>} List of PMI companies
 */
export const getAllPMICompanies = async () => {
  try {
    const response = await UserManagementAPI.getAllPMICompanies();
    return response;
  } catch (error) {
    console.error("❌ Get all PMI companies error:", error);
    throw error;
  }
};

/**
 * Get PMI company by ID
 * @param {string} id - PMI Company ID
 * @returns {Promise<Object>} PMI company details
 */
export const getPMICompanyById = async (id) => {
  try {
    if (!id) {
      throw new Error("PMI Company ID is required");
    }

    const response = await UserManagementAPI.getPMICompanyById(id);
    return response;
  } catch (error) {
    console.error(`❌ Get PMI company ${id} error:`, error);
    throw error;
  }
};

/**
 * Create new PMI company
 * @param {Object} pmiData - PMI company data
 * @returns {Promise<Object>} Created PMI company
 */
export const createPMICompany = async (pmiData) => {
  try {
    const response = await UserManagementAPI.createPMICompany(pmiData);
    return response;
  } catch (error) {
    console.error("❌ Create PMI company error:", error);
    throw error;
  }
};

/**
 * Update PMI company
 * @param {string} id - PMI Company ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated PMI company
 */
export const updatePMICompany = async (id, updateData) => {
  try {
    const response = await UserManagementAPI.updatePMICompany(id, updateData);
    return response;
  } catch (error) {
    console.error("❌ Update PMI company error:", error);
    throw error;
  }
};

/**
 * Update PMI company status
 * @param {string} id - PMI Company ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Success response
 */
export const updatePMICompanyStatus = async (id, status) => {
  try {
    const response = await UserManagementAPI.updatePMICompanyStatus(id, status);
    return response;
  } catch (error) {
    console.error("❌ Update PMI company status error:", error);
    throw error;
  }
};

/**
 * Reset PMI company temporary password
 * @param {string} id - PMI Company ID
 * @returns {Promise<Object>} Response with new temporary password
 */
export const resetTempPassword = async (id) => {
  try {
    // This endpoint is not currently exposed in the shared API helper.
    // Fallback to using a backend reset route if available.
    const response = await api.post(`/PMI/${id}/reset-password`);
    return response.data;
  } catch (error) {
    console.error("❌ Reset PMI password error:", error);
    throw error;
  }
};

/**
 * Delete PMI company
 * @param {string} id - PMI Company ID
 * @returns {Promise<Object>} Success response
 */
export const deletePMICompany = async (id) => {
  try {
    const response = await UserManagementAPI.deletePMICompany(id);
    return response;
  } catch (error) {
    console.error("❌ Delete PMI company error:", error);
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
        "User doesn't have permission to access PMI details, using fallback",
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

  // Handle both formats: from applications (name, email) and from PMI controller (pmiName, emailAddress)
  const name = pmiCompany.name || pmiCompany.pmiName;
  const email = pmiCompany.email || pmiCompany.emailAddress;

  return {
    id: pmiCompany.id,
    name: name,
    pmiName: name, // Keep both for compatibility
    email: email,
    emailAddress: email, // Keep both for compatibility
    resourcePersonName: pmiCompany.resourcePersonName || "",
    resourcePersonEmail: pmiCompany.resourcePersonEmail || "",
    phoneNumber: pmiCompany.phoneNumber || "",
    status: pmiCompany.status || "ACTIVE",
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
