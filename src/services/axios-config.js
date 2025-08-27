// src/services/axios-config.js
import axios from "axios";

// Get environment variables with fallbacks
const getEnvVar = (name, defaultValue) => {
  // Try different ways to access environment variables
  if (typeof process !== "undefined" && process.env) {
    return process.env[name] || defaultValue;
  }
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env[name] || defaultValue;
  }
  return defaultValue;
};

const isDevelopment = getEnvVar("NODE_ENV", "development") === "development";
const API_BASE_URL = getEnvVar(
  "REACT_APP_API_URL",
  "http://localhost:5062/api"
);

// Create axios instance with your .NET API base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log requests in development
    if (isDevelopment) {
      console.log(
        `🚀 Making ${config.method?.toUpperCase()} request to: ${
          config.baseURL
        }${config.url}`
      );
      if (config.data) {
        console.log("📤 Request data:", config.data);
      }
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common response patterns
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (isDevelopment) {
      console.log(
        `✅ ${response.config.method?.toUpperCase()} ${response.config.url}:`,
        response.status
      );
      console.log("📥 Response data:", response.data);
    }

    return response;
  },
  (error) => {
    // Enhanced error logging
    if (isDevelopment) {
      console.error(`❌ API Error:`, {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
    }

    // Handle specific error scenarios
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.warn("🔐 Authentication token expired or invalid");

      // Clear stored auth data
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      localStorage.removeItem("tokenExpiry");
      localStorage.removeItem("refreshToken");

      // Remove token from future requests
      delete api.defaults.headers.common["Authorization"];

      // Dispatch custom event for auth failure (your AuthContext can listen to this)
      window.dispatchEvent(new CustomEvent("auth-expired"));

      // Redirect to login page if not already there
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    // Handle 403 Forbidden (insufficient permissions)
    if (error.response?.status === 403) {
      console.warn("🚫 Access denied - insufficient permissions");
      error.message = "You don't have permission to perform this action.";
    }

    // Handle validation errors (400)
    if (error.response?.status === 400) {
      const serverMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        "Invalid request data.";
      error.message = serverMessage;
    }

    // Handle not found (404)
    if (error.response?.status === 404) {
      error.message = "The requested resource was not found.";
    }

    // Handle network errors
    if (!error.response) {
      console.error("🌐 Network error or server is not responding");
      error.message =
        "Network error. Please check your connection and try again.";
    }

    // Handle server errors (5xx)
    else if (error.response.status >= 500) {
      console.error("🔥 Server error occurred");
      error.message = "Server error occurred. Please try again later.";
    }

    return Promise.reject(error);
  }
);

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem("authToken");
  return !!token;
};

// Helper function to get current auth token
export const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Helper function to set auth token
export const setAuthToken = (token) => {
  localStorage.setItem("authToken", token);
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

// Helper function to clear auth token
export const clearAuthToken = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  localStorage.removeItem("tokenExpiry");
  localStorage.removeItem("refreshToken");
  delete api.defaults.headers.common["Authorization"];
};

// Export configuration info for debugging
export const getConfig = () => ({
  baseURL: API_BASE_URL,
  isDevelopment,
  hasToken: !!getAuthToken(),
});

export default api;
