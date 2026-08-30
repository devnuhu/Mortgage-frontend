import api from "./axios-config";

/**
 * User Management API Service Functions
 * These functions integrate with your .NET UsersController and PMIController endpoints
 */

// ==========================================
// USER MANAGEMENT ENDPOINTS
// ==========================================

/**
 * Get all users (Super Admin only)
 * GET /api/Users
 * @returns {Promise<Array>} List of all users with PMI company info
 */
export const getAllUsers = async () => {
  try {
    const response = await api.get("/Users");
    return response.data;
  } catch (error) {
    console.error("❌ Get all users error:", error);
    throw error;
  }
};

/**
 * Get current user profile
 * GET /api/Users/profile
 * @returns {Promise<Object>} Current user profile
 */
export const getUserProfile = async () => {
  try {
    const response = await api.get("/Users/profile");
    return response.data;
  } catch (error) {
    console.error("❌ Get user profile error:", error);
    throw error;
  }
};

/**
 * Create new user (Super Admin only) - Enhanced Debug Version
 * POST /api/Users
 */
export const createUser = async (userData) => {
  try {
    console.log("🔍 Raw userData received:", userData);

    if (!userData) {
      throw new Error("User data is required");
    }

    // Validate required fields
    const requiredFields = [
      "email",
      "firstName",
      "lastName",
      "role",
      "temporaryPassword",
    ];
    for (const field of requiredFields) {
      if (!userData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // Validate CLIENT and SERVICE_MANAGER roles have PMI company
    if (
      (userData.role === "CLIENT" || userData.role === "SERVICE_MANAGER") &&
      !userData.pmiCompanyId
    ) {
      throw new Error(
        "PMI Company is required for CLIENT and SERVICE_MANAGER roles",
      );
    }

    // Prepare the payload with explicit null handling
    const payload = {
      email: userData.email?.trim() || "",
      firstName: userData.firstName?.trim() || "",
      lastName: userData.lastName?.trim() || "",
      role: userData.role || "",
      temporaryPassword: userData.temporaryPassword || "",
      // Explicitly include pmiCompanyId for CLIENT and SERVICE_MANAGER roles
      ...((userData.role === "CLIENT" || userData.role === "SERVICE_MANAGER") &&
      userData.pmiCompanyId
        ? { pmiCompanyId: userData.pmiCompanyId }
        : {}),
    };

    // Detailed payload logging
    console.log(
      "📤 Final payload being sent:",
      JSON.stringify(payload, null, 2),
    );
    console.log("📤 Payload keys:", Object.keys(payload));
    console.log("📤 PMI Company ID:", userData.pmiCompanyId);
    console.log("📤 Role:", userData.role);

    const response = await api.post("/Users", payload);

    console.log("✅ User created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Create user error:", error);

    // Comprehensive error logging
    console.error("❌ Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      requestConfig: error.config,
      requestData: error.config?.data,
    });

    // Log the full response data structure
    if (error.response?.data) {
      console.error(
        "❌ Full server response:",
        JSON.stringify(error.response.data, null, 2),
      );

      // Check for common .NET validation error patterns
      if (error.response.data.errors) {
        console.error("❌ Validation errors:", error.response.data.errors);
      }
      if (error.response.data.title) {
        console.error("❌ Error title:", error.response.data.title);
      }
      if (error.response.data.detail) {
        console.error("❌ Error detail:", error.response.data.detail);
      }
    }

    throw error;
  }
};

/**
 * Update user (Super Admin only)
 * PUT /api/Users/{id}
 * @param {string} userId - User ID
 * @param {Object} updateData - User update data
 * @returns {Promise<Object>} Success response
 */
export const updateUser = async (userId, updateData) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!updateData) {
      throw new Error("Update data is required");
    }

    const response = await api.put(`/Users/${userId}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`❌ Update user ${userId} error:`, error);
    throw error;
  }
};

/**
 * Delete user (Super Admin only)
 * DELETE /api/Users/{id}
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Success response
 */
export const deleteUser = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    console.log(`🗑️ Deleting user ${userId} -> DELETE /Users/${userId}`);
    const response = await api.delete(`/Users/${userId}`);
    console.log(
      `✅ Delete user ${userId} response:`,
      response.status,
      response.data,
    );
    return response.data;
  } catch (error) {
    // Surface useful server messages
    console.error(`❌ Delete user ${userId} error:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Build a helpful error for the UI
    const serverMsg =
      error.response?.data?.message || error.response?.data || error.message;
    const err = new Error(serverMsg);
    err.response = error.response;
    throw err;
  }
};

// ==========================================
// PMI COMPANY ENDPOINTS
// ==========================================

/**
 * Get all PMI companies (Super Admin only)
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
 * Get PMI company by ID (Super Admin only)
 * GET /api/PMI/{id}
 * @param {string} pmiId - PMI Company ID
 * @returns {Promise<Object>} PMI company details
 */
export const getPMICompanyById = async (pmiId) => {
  try {
    if (!pmiId) {
      throw new Error("PMI Company ID is required");
    }

    const response = await api.get(`/PMI/${pmiId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Get PMI company ${pmiId} error:`, error);
    throw error;
  }
};

/**
 * Create PMI company (Super Admin only)
 * POST /api/PMI
 * @param {Object} pmiData - PMI company creation data
 * @returns {Promise<Object>} Created PMI company
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
 * Update PMI company (Super Admin only)
 * PUT /api/PMI/{id}
 * @param {string} pmiId - PMI Company ID
 * @param {Object} updateData - PMI company update data
 * @returns {Promise<Object>} Updated PMI company
 */
export const updatePMICompany = async (pmiId, updateData) => {
  try {
    if (!pmiId) {
      throw new Error("PMI Company ID is required");
    }
    if (!updateData) {
      throw new Error("Update data is required");
    }

    const response = await api.put(`/PMI/${pmiId}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`❌ Update PMI company ${pmiId} error:`, error);
    throw error;
  }
};

/**
 * Delete PMI company (Super Admin only)
 * DELETE /api/PMI/{id}
 * @param {string} pmiId - PMI Company ID
 * @returns {Promise<Object>} Success response
 */
export const deletePMICompany = async (pmiId) => {
  try {
    if (!pmiId) {
      throw new Error("PMI Company ID is required");
    }

    const response = await api.delete(`/PMI/${pmiId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Delete PMI company ${pmiId} error:`, error);
    throw error;
  }
};

/**
 * Update PMI company status (Super Admin only)
 * PATCH /api/PMI/{id}/status
 * @param {string} pmiId - PMI Company ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Success response
 */
export const updatePMICompanyStatus = async (pmiId, status) => {
  try {
    if (!pmiId) {
      throw new Error("PMI Company ID is required");
    }
    if (!status) {
      throw new Error("Status is required");
    }

    const response = await api.patch(`/PMI/${pmiId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(`❌ Update PMI company ${pmiId} status error:`, error);
    throw error;
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Format user data for display
 * @param {Object} user - Raw user from API
 * @returns {Object} Formatted user for UI
 */
export const formatUserForDisplay = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    role: user.role,
    isFirstLogin: user.isFirstLogin,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    pmiCompanyId: user.pmiCompanyId,
    pmiCompanyName: user.pmiCompanyName,
    pmiEmail: user.pmiEmail,
  };
};

/**
 * Format PMI company data for display
 * @param {Object} pmi - Raw PMI company from API
 * @returns {Object} Formatted PMI company for UI
 */
export const formatPMIForDisplay = (pmi) => {
  if (!pmi) return null;

  return {
    id: pmi.id,
    pmiName: pmi.pmiName,
    emailAddress: pmi.emailAddress,
    status: pmi.status,
    createdAt: pmi.createdAt,
    updatedAt: pmi.updatedAt,
  };
};

/**
 * Get role display info
 * @param {string} role - User role
 * @returns {Object} Role display information
 */
export const getRoleDisplayInfo = (role) => {
  const roleMap = {
    SUPER_ADMIN: {
      label: "Super Admin",
      description: "Full system access",
      color: "bg-purple-100 text-purple-800",
      icon: "👑",
    },
    ADMIN: {
      label: "Admin",
      description: "System administrator",
      color: "bg-blue-100 text-blue-800",
      icon: "🛡️",
    },
    LEAD_REVIEWER: {
      label: "Lead Reviewer",
      description: "Review queue and escalation manager",
      color: "bg-indigo-100 text-indigo-800",
      icon: "🧑‍⚖️",
    },
    CLIENT: {
      label: "Client",
      description: "PMI company user",
      color: "bg-green-100 text-green-800",
      icon: "👤",
    },
    SERVICE_MANAGER: {
      label: "Service Manager",
      description:
        "Create own applications and monitor system-wide submissions",
      color: "bg-teal-100 text-teal-800",
      icon: "🧭",
    },
  };

  return (
    roleMap[role] || {
      label: role,
      description: "Unknown role",
      color: "bg-gray-100 text-gray-800",
      icon: "❓",
    }
  );
};

/**
 * Validate user creation data - FIXED VERSION FOR JAVASCRIPT
 * @param {Object} userData - User data to validate (with default empty object)
 * @returns {Object} Validation result { isValid: boolean, errors: Object }
 */
export const validateUserData = (userData = {}) => {
  const errors = {};

  // Ensure userData is a valid object first
  if (!userData || typeof userData !== "object") {
    return {
      isValid: false,
      errors: { general: "Invalid user data provided" },
    };
  }

  // Email validation
  if (!userData.email?.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    errors.email = "Invalid email format";
  }

  // Name validation
  if (!userData.firstName?.trim()) {
    errors.firstName = "First name is required";
  }

  if (!userData.lastName?.trim()) {
    errors.lastName = "Last name is required";
  }

  // Role validation
  if (!userData.role) {
    errors.role = "Role is required";
  } else if (
    ![
      "SUPER_ADMIN",
      "ADMIN",
      "LEAD_REVIEWER",
      "CLIENT",
      "SERVICE_MANAGER",
    ].includes(userData.role)
  ) {
    errors.role = "Invalid role";
  }

  // PMI Company validation for CLIENT and SERVICE_MANAGER roles
  if (
    (userData.role === "CLIENT" || userData.role === "SERVICE_MANAGER") &&
    !userData.pmiCompanyId
  ) {
    errors.pmiCompanyId =
      "PMI Company is required for Client and Service Manager users";
  }

  // Password validation
  if (!userData.temporaryPassword?.trim()) {
    errors.temporaryPassword = "Temporary password is required";
  } else if (userData.temporaryPassword.length < 8) {
    errors.temporaryPassword = "Password must be at least 8 characters long";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Generate secure temporary password
 * @param {number} length - Password length (default: 12)
 * @returns {string} Generated password
 */
export const generateTemporaryPassword = (length = 12) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  // Ensure at least one character from each type
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";

  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += symbols.charAt(Math.floor(Math.random() * symbols.length));

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  // Shuffle the password to randomize character positions
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

/**
 * Calculate user statistics from users list
 * @param {Array} users - List of users
 * @returns {Object} Statistics object with counts by role and status
 */
export const calculateUserStats = (users) => {
  if (!Array.isArray(users)) {
    return {
      total: 0,
      active: 0,
      inactive: 0,
      firstLogin: 0,
      byRole: {
        SUPER_ADMIN: 0,
        ADMIN: 0,
        CLIENT: 0,
      },
    };
  }

  return users.reduce(
    (acc, user) => {
      acc.total++;

      if (user.isActive) {
        acc.active++;
      } else {
        acc.inactive++;
      }

      if (user.isFirstLogin) {
        acc.firstLogin++;
      }

      if (acc.byRole[user.role] !== undefined) {
        acc.byRole[user.role]++;
      }

      return acc;
    },
    {
      total: 0,
      active: 0,
      inactive: 0,
      firstLogin: 0,
      byRole: {
        SUPER_ADMIN: 0,
        ADMIN: 0,
        CLIENT: 0,
      },
    },
  );
};

/**
 * Filter users by search term
 * @param {Array} users - List of users
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered users
 */
export const filterUsers = (users, searchTerm) => {
  if (!searchTerm?.trim()) return users;

  const term = searchTerm.toLowerCase();
  return users.filter(
    (user) =>
      user.email.toLowerCase().includes(term) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(term) ||
      user.pmiCompanyName?.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term),
  );
};

/**
 * Sort users by specified field
 * @param {Array} users - List of users
 * @param {string} field - Field to sort by
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted users
 */
export const sortUsers = (users, field, order = "asc") => {
  return [...users].sort((a, b) => {
    let aVal = a[field];
    let bVal = b[field];

    // Handle null/undefined values
    if (aVal == null) aVal = "";
    if (bVal == null) bVal = "";

    // Convert to strings for comparison
    aVal = aVal.toString().toLowerCase();
    bVal = bVal.toString().toLowerCase();

    if (order === "desc") {
      return bVal.localeCompare(aVal);
    }
    return aVal.localeCompare(bVal);
  });
};

// ==========================================
// ADDITIONAL UTILITY FUNCTIONS
// ==========================================

/**
 * Check if current user has permission to perform action
 * @param {string} currentUserRole - Current user's role
 * @param {string} targetAction - Action to check (create, edit, delete)
 * @param {string} targetUserRole - Target user's role (optional)
 * @returns {boolean} Permission status
 */
export const hasPermission = (
  currentUserRole,
  targetAction,
  targetUserRole = null,
) => {
  const permissions = {
    SUPER_ADMIN: {
      create: [
        "SUPER_ADMIN",
        "ADMIN",
        "LEAD_REVIEWER",
        "CLIENT",
        "SERVICE_MANAGER",
      ],
      edit: [
        "SUPER_ADMIN",
        "ADMIN",
        "LEAD_REVIEWER",
        "CLIENT",
        "SERVICE_MANAGER",
      ],
      delete: [
        "SUPER_ADMIN",
        "ADMIN",
        "LEAD_REVIEWER",
        "CLIENT",
        "SERVICE_MANAGER",
      ],
      view: [
        "SUPER_ADMIN",
        "ADMIN",
        "LEAD_REVIEWER",
        "CLIENT",
        "SERVICE_MANAGER",
      ],
    },
    ADMIN: {
      create: ["CLIENT", "LEAD_REVIEWER"],
      edit: ["CLIENT", "LEAD_REVIEWER"],
      delete: ["CLIENT", "LEAD_REVIEWER"],
      view: ["ADMIN", "CLIENT", "LEAD_REVIEWER"],
    },
    LEAD_REVIEWER: {
      create: [],
      edit: [],
      delete: [],
      view: ["LEAD_REVIEWER"],
    },
    CLIENT: {
      create: [],
      edit: [],
      delete: [],
      view: ["CLIENT"], // Can only view themselves
    },
  };

  if (!permissions[currentUserRole]) {
    return false;
  }

  const allowedActions = permissions[currentUserRole][targetAction] || [];

  if (targetUserRole) {
    return allowedActions.includes(targetUserRole);
  }

  return allowedActions.length > 0;
};

/**
 * Format user role for display
 * @param {string} role - User role
 * @returns {string} Formatted role
 */
export const formatUserRole = (role) => {
  if (!role) return "Unknown";

  const roleMap = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    LEAD_REVIEWER: "Lead Reviewer",
    CLIENT: "Client",
  };

  return roleMap[role] || role;
};

/**
 * Get role badge color for UI
 * @param {string} role - User role
 * @returns {string} CSS class for role badge
 */
export const getRoleBadgeColor = (role) => {
  const colorMap = {
    SUPER_ADMIN: "bg-purple-100 text-purple-800",
    ADMIN: "bg-blue-100 text-blue-800",
    LEAD_REVIEWER: "bg-indigo-100 text-indigo-800",
    CLIENT: "bg-green-100 text-green-800",
  };

  return colorMap[role] || "bg-gray-100 text-gray-800";
};

/**
 * Validate PMI company data
 * @param {Object} pmiData - PMI company data to validate
 * @returns {Object} Validation result { isValid: boolean, errors: Object }
 */
export const validatePMICompanyData = (pmiData = {}) => {
  const errors = {};

  // Ensure pmiData is a valid object first
  if (!pmiData || typeof pmiData !== "object") {
    return {
      isValid: false,
      errors: { general: "Invalid PMI company data provided" },
    };
  }

  // PMI Name validation
  if (!pmiData.pmiName?.trim()) {
    errors.pmiName = "PMI Company name is required";
  }

  // Email validation
  if (!pmiData.emailAddress?.trim()) {
    errors.emailAddress = "Email address is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pmiData.emailAddress)) {
    errors.emailAddress = "Invalid email format";
  }

  // Status validation
  if (!pmiData.status) {
    errors.status = "Status is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Get user status display info
 * @param {boolean} isActive - User active status
 * @param {boolean} isFirstLogin - User first login status
 * @returns {Object} Status display information
 */
export const getUserStatusInfo = (isActive, isFirstLogin) => {
  if (!isActive) {
    return {
      label: "Inactive",
      color: "bg-red-100 text-red-800",
      icon: "❌",
    };
  }

  if (isFirstLogin) {
    return {
      label: "Pending First Login",
      color: "bg-yellow-100 text-yellow-800",
      icon: "⏳",
    };
  }

  return {
    label: "Active",
    color: "bg-green-100 text-green-800",
    icon: "✅",
  };
};

// ==========================================
// COMPATIBILITY ALIASES
// ==========================================

/**
 * Alias for getAllUsers to match existing imports
 */
export const getUsers = getAllUsers;

/**
 * Alias for getAllPMICompanies to match existing imports
 */
export const getPMICompanies = getAllPMICompanies;
