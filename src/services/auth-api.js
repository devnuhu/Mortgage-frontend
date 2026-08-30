// src/services/auth-api.js
import api, { setAuthToken, clearAuthToken } from "./axios-config";

/**
 * Authentication API Service Functions
 * These functions match your .NET AuthController endpoints
 */

// ==========================================
// AUTH ENDPOINTS
// ==========================================

/**
 * Login user
 * POST /api/Auth/login
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} Login response with token and user data
 */
export const loginUser = async ({ email, password }) => {
  try {
    // Validate input
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Make API call
    const response = await api.post("/Auth/login", {
      email: email.trim(),
      password: password,
    });

    // Log response for debugging (development only)
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "localhost"
    ) {
      console.log("🔐 Login successful:", {
        email: email,
        hastoken: !!response.data?.token,
        userInfo: response.data?.userData ? "present" : "missing",
        requiresPasswordChange: response.data?.requiresPasswordChange, // FIXED: Added logging
      });
    }

    return response.data;
  } catch (error) {
    console.error("❌ Login error:", error);

    const responseData = error.response?.data;
    const accessResponse = responseData?.data || responseData;
    const responseCode = accessResponse?.code || accessResponse?.Code;
    const responseMessage =
      accessResponse?.message || accessResponse?.Message || error.message || "";
    const looksLikeAccessDisabledMessage =
      /access\s+is\s+temporarily\s+unavailable/i.test(responseMessage);

    // Keep this contract ahead of generic status handling so proxies that
    // normalize the 403 status cannot turn the access notice into a card error.
    if (
      String(responseCode).trim().toUpperCase() === "LOGIN_ACCESS_DISABLED" ||
      looksLikeAccessDisabledMessage
    ) {
      const accessError = new Error(
        responseMessage || "Login access is temporarily unavailable.",
      );
      accessError.code = "LOGIN_ACCESS_DISABLED";
      accessError.timestamp = accessResponse.timestamp;
      accessError.response = error.response;
      throw accessError;
    }

    // Enhanced error handling
    if (error.response?.status === 400) {
      const serverMessage = error.response.data?.message;
      if (serverMessage?.toLowerCase().includes("invalid")) {
        throw new Error("Invalid email or password");
      }
    } else if (error.response?.status === 401) {
      throw new Error("Invalid email or password");
    } else if (error.response?.status === 403) {
      throw new Error("Account is locked or disabled");
    } else if (!error.response) {
      throw new Error("Network error. Please check your connection");
    }

    // Re-throw with original message if not handled above
    throw error;
  }
};

/**
 * Change user password
 * POST /api/Auth/change-password
 * @param {Object} passwordData - Password change data
 * @param {string} passwordData.currentPassword - Current password
 * @param {string} passwordData.newPassword - New password
 * @param {string} passwordData.confirmPassword - Confirm new password
 * @returns {Promise<Object>} Success response
 */
export const changeUserPassword = async ({
  currentPassword,
  newPassword,
  confirmPassword,
}) => {
  try {
    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new Error("All password fields are required");
    }

    if (newPassword !== confirmPassword) {
      throw new Error("New password and confirm password must match");
    }

    if (currentPassword === newPassword) {
      throw new Error("New password must be different from current password");
    }

    if (newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long");
    }

    // Make API call with exact DTO structure
    const response = await api.post("/Auth/change-password", {
      currentPassword,
      newPassword,
      confirmPassword, // Backend DTO requires this field
    });

    if (
      typeof window !== "undefined" &&
      window.location.hostname === "localhost"
    ) {
      console.log("🔑 Password changed successfully");
    }

    return response.data;
  } catch (error) {
    console.error("❌ Change password error:", error);

    // Handle specific error scenarios
    if (error.response?.status === 400) {
      const serverMessage = error.response.data?.message;
      if (serverMessage?.toLowerCase().includes("current password")) {
        throw new Error("Current password is incorrect");
      } else if (
        serverMessage?.toLowerCase().includes("password requirements")
      ) {
        throw new Error("New password does not meet requirements");
      } else if (serverMessage?.toLowerCase().includes("match")) {
        throw new Error("New password and confirm password must match");
      }
    } else if (error.response?.status === 401) {
      throw new Error("You must be logged in to change your password");
    }

    throw error;
  }
};

/**
 * Test API connectivity
 * GET /api/Auth/test
 * @returns {Promise<Object>} Test response
 */
export const testAuthAPI = async () => {
  try {
    const response = await api.get("/Auth/test");
    return response.data;
  } catch (error) {
    console.error("❌ Auth API test error:", error);
    throw error;
  }
};

// ==========================================
// HELPER FUNCTIONS FOR AUTH FLOW
// ==========================================

/**
 * Handle successful login - store token and user data
 * @param {Object} loginResponse - Response from login API
 * @param {string} loginResponse.token - JWT token
 * @param {string} loginResponse.refreshToken - Refresh token (FIXED: capital T)
 * @param {string} loginResponse.expiresAt - token expiration
 * @param {Object} loginResponse.userData - User data
 * @param {boolean} loginResponse.requiresPasswordChange - FIXED: Added this field
 */
export const handleLoginSuccess = (loginResponse) => {
  // Some backends wrap response payload inside .data, .result or other properties.
  // Normalize to the most likely shapes to avoid missing fields.
  const payload =
    loginResponse?.data || loginResponse?.result || loginResponse || {};

  const token =
    payload.token ||
    payload.Token ||
    payload.accessToken ||
    payload.AccessToken;
  const refreshToken =
    payload.refreshToken || payload.RefreshToken || payload.refresh || null;
  const expiresAt =
    payload.expiresAt || payload.ExpiresAt || payload.expiry || null;

  // Try common user object locations
  const userData =
    payload.userData ||
    payload.UserData ||
    payload.user ||
    payload.User ||
    payload;

  const requiresPasswordChange =
    payload.requiresPasswordChange ||
    payload.RequiresPasswordChange ||
    payload.needsPasswordChange ||
    payload.isFirstLogin ||
    false;

  if (!token) {
    throw new Error("No token received from server");
  }

  if (!userData) {
    throw new Error("No user data received from server");
  }

  // Set token in axios and localStorage
  setAuthToken(token);

  // Store user data and token info
  try {
    localStorage.setItem("authUser", JSON.stringify(userData));
    if (expiresAt) localStorage.setItem("tokenExpiry", expiresAt);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  } catch (e) {
    console.warn("Could not persist auth data to localStorage:", e.message);
  }

  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    console.log("✅ Login data stored successfully:", {
      // use best-effort accessors
      userId: userData?.id || userData?.userId,
      email: userData?.email || userData?.Email,
      role: userData?.role || userData?.Role,
      isFirstLogin: userData?.isFirstLogin || userData?.IsFirstLogin || false,
      requiresPasswordChange: requiresPasswordChange,
      tokenExpiry: expiresAt,
    });
  }

  return {
    token,
    user: userData,
    refreshToken,
    expiresAt,
    requiresPasswordChange,
  };
};

/**
 * Handle logout - clear all stored data
 */
export const handleLogout = () => {
  clearAuthToken();

  // Clear additional token-related data
  localStorage.removeItem("tokenExpiry");
  localStorage.removeItem("refreshToken"); // FIXED: consistent naming

  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    console.log("🚪 Logout completed - all auth data cleared");
  }
};

/**
 * Get current user from localStorage
 * @returns {Object|null} Current user data or null
 */
export const getCurrentStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("authUser");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Error parsing stored user:", error);
    localStorage.removeItem("authUser");
    return null;
  }
};

/**
 * Check if user needs to change password (first login)
 * @param {Object} user - User object
 * @returns {boolean} True if password change is required
 */
export const shouldChangePassword = (user) => {
  return user?.isFirstLogin === true;
};

/**
 * Update stored user data after successful operations
 * @param {Object} updates - User data updates
 */
export const updateStoredUser = (updates) => {
  const currentUser = getCurrentStoredUser();
  if (currentUser) {
    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem("authUser", JSON.stringify(updatedUser));
    return updatedUser;
  }
  return null;
};
