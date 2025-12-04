// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole, createUser } from "../types/auth";
import {
  loginUser,
  changeUserPassword,
  handleLoginSuccess,
  handleLogout,
  getCurrentStoredUser,
  updateStoredUser,
  shouldChangePassword,
} from "../services/auth-api";
import { isAuthenticated, getAuthToken } from "../services/axios-config";

// Create the context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = getAuthToken();
        const storedUser = getCurrentStoredUser();

        if (storedToken && storedUser && isAuthenticated()) {
          setToken(storedToken);
          setUser(storedUser);

          // FIXED: Only set password change requirement if user still needs it
          // Don't override if already handled in current session
          if (storedUser.isFirstLogin) {
            setRequiresPasswordChange(true);
          }

          if (
            typeof window !== "undefined" &&
            window.location.hostname === "localhost"
          ) {
            console.log("Auth restored from storage:", {
              email: storedUser.email,
              role: storedUser.role,
              requiresPasswordChange: storedUser.isFirstLogin,
            });
          }
        } else {
          // Clear any partial/invalid data
          handleLogout();
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth expiration events from axios interceptors
    const handleAuthExpired = () => {
      console.warn("Auth token expired - logging out");
      logout();
    };

    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, []);

  // FIXED: Login function with proper first login flow handling
  const login = async (email, password) => {
    setIsLoading(true);

    try {
      // Call API
      const loginResponse = await loginUser({ email, password });

      // DEBUG: dump raw login response to console to diagnose first-login flow
      if (
        typeof window !== "undefined" &&
        window.location.hostname === "localhost"
      ) {
        console.log("🔎 raw loginResponse:", loginResponse);
      }

      // Detect if backend requires password change. API responses vary in shape
      // so check multiple possible locations and fall back to the normalized
      // value returned by handleLoginSuccess if detection above misses it.
      const detectPasswordChangeFlag = (resp) => {
        if (!resp) return false;
        // Top-level fields
        if (
          resp.RequiresPasswordChange === true ||
          resp.requiresPasswordChange === true
        )
          return true;
        // Common wrappers
        const payload = resp.data || resp.result || resp.payload || resp;
        if (!payload) return false;
        if (
          payload.RequiresPasswordChange === true ||
          payload.requiresPasswordChange === true
        )
          return true;
        // Some backends indicate via user object flag
        const userObj =
          payload.userData || payload.UserData || payload.user || payload.User;
        if (
          userObj &&
          (userObj.isFirstLogin === true || userObj.IsFirstLogin === true)
        )
          return true;
        return false;
      };

      let needsPasswordChange = detectPasswordChangeFlag(loginResponse);

      // If we didn't detect it yet, call handleLoginSuccess to normalize payload
      // and use its returned flag as authoritative. This also persists token/user.
      const {
        token: newToken,
        user: newUser,
        requiresPasswordChange: normalizedFlag,
      } = handleLoginSuccess(loginResponse);

      if (
        typeof window !== "undefined" &&
        window.location.hostname === "localhost"
      ) {
        console.log("🔎 normalized login result:", {
          newToken,
          newUser,
          normalizedFlag,
        });
      }

      // Prefer normalizedFlag if present
      if (normalizedFlag) {
        needsPasswordChange = true;
      }

      if (needsPasswordChange) {
        console.log("First login detected - password change required");

        setToken(newToken);
        setUser(newUser);
        setRequiresPasswordChange(true);

        return {
          user: newUser,
          token: newToken,
          requiresPasswordChange: true,
        };
      }

      // Normal login flow (no password change required)
      // token/newUser already obtained from handleLoginSuccess above

      setToken(newToken);
      setUser(newUser);
      setRequiresPasswordChange(false);

      if (
        typeof window !== "undefined" &&
        window.location.hostname === "localhost"
      ) {
        console.log("Login successful:", {
          email: newUser.email,
          role: newUser.role,
          isFirstLogin: newUser.isFirstLogin,
        });
      }

      return { user: newUser, token: newToken };
    } catch (error) {
      // Clear any partial state on error
      setUser(null);
      setToken(null);
      setRequiresPasswordChange(false);
      handleLogout();

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    setRequiresPasswordChange(false);
    handleLogout();

    // Redirect to login if not already there
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  };

  // FIXED: Change password function
  const changePassword = async (
    currentPassword,
    newPassword,
    confirmPassword = newPassword
  ) => {
    if (!user) {
      throw new Error("No user logged in");
    }

    setIsLoading(true);

    try {
      // Call API
      await changeUserPassword({
        currentPassword,
        newPassword,
        confirmPassword: confirmPassword || newPassword,
      });

      // Update user's first login status
      const updatedUser = updateStoredUser({ isFirstLogin: false });
      if (updatedUser) {
        setUser(updatedUser);
      }

      // Clear the password change requirement after successful change
      setRequiresPasswordChange(false);

      if (
        typeof window !== "undefined" &&
        window.location.hostname === "localhost"
      ) {
        console.log("Password changed successfully for:", user.email);
        console.log("First login flow completed");
      }

      return true;
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user function
  const updateUser = (updatedUserData) => {
    const updatedUser = updateStoredUser(updatedUserData);
    if (updatedUser) {
      setUser(updatedUser);
      // Update password change requirement if isFirstLogin changes
      if (updatedUserData.hasOwnProperty("isFirstLogin")) {
        setRequiresPasswordChange(updatedUserData.isFirstLogin);
      }
    }
    return updatedUser;
  };

  // FIXED: Simplified password change check
  const requiresPasswordChangeCheck = () => {
    return requiresPasswordChange;
  };

  // Get user role helper
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  };

  // Check if user is super admin
  const isSuperAdmin = () => {
    return user?.role === UserRole.SUPER_ADMIN;
  };

  // Check if user is client
  const isClient = () => {
    return user?.role === UserRole.CLIENT;
  };

  const value = {
    // State
    user,
    token,
    isLoading,
    requiresPasswordChange,

    // Actions
    login,
    logout,
    changePassword,
    updateUser,

    // Helpers
    hasRole,
    isAdmin,
    isSuperAdmin,
    isClient,
    shouldChangePassword: requiresPasswordChangeCheck,

    // Auth status
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = (Component, requiredRoles = []) => {
  return function AuthenticatedComponent(props) {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      window.location.href = "/login";
      return null;
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};
