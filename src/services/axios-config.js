// src/services/axios-config.js
import axios from "axios";

// Get environment variables with fallbacks
// Prefer Vite-style env (VITE_API_URL), fall back to REACT_APP_API_URL, then default
const isBrowser = typeof window !== "undefined";
let importMetaEnv = {};
try {
  // import.meta is available in ESM environments (Vite). Access safely.
  importMetaEnv = import.meta && import.meta.env ? import.meta.env : {};
} catch (e) {
  importMetaEnv = {};
}
const envVite =
  importMetaEnv && importMetaEnv.VITE_API_URL
    ? importMetaEnv.VITE_API_URL
    : null;
const envReactApp =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_URL) ||
  null;
const API_BASE_URL =
  envVite || envReactApp || "https://accessmortgageapi.accesspensions.ng/api";
const isDevelopment =
  (importMetaEnv?.MODE ||
    (typeof process !== "undefined" && process.env?.NODE_ENV) ||
    "development") === "development";

// Create axios instance with your .NET API base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 60 seconds timeout (increased from 30s to allow slower connections)
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // Enable sending cookies with cross-origin requests
});

// Track outstanding requests and emit global events so UI can show a spinner
let _outstandingRequestCount = 0;
const emitApiActivity = () => {
  try {
    window.dispatchEvent(
      new CustomEvent("api-activity", {
        detail: { count: _outstandingRequestCount },
      }),
    );
  } catch (e) {
    // running in non-browser env or event dispatch failed
  }
};

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
        }${config.url}`,
      );
      if (config.params) {
        console.log("📋 Query params:", config.params);
      }
      if (config.data) {
        console.log("📤 Request data:", config.data);
      }
    }

    // increment outstanding requests and notify UI
    _outstandingRequestCount = Math.max(0, _outstandingRequestCount + 1);
    emitApiActivity();

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor to handle common response patterns
api.interceptors.response.use(
  (response) => {
    // decrement outstanding requests and notify UI
    _outstandingRequestCount = Math.max(0, _outstandingRequestCount - 1);
    emitApiActivity();

    // Log successful responses in development
    if (isDevelopment) {
      console.log(
        `✅ ${response.config.method?.toUpperCase()} ${response.config.url}:`,
        response.status,
      );
      console.log("📥 Response data:", response.data);
    }

    return response;
  },
  (error) => {
    // decrement outstanding requests and notify UI
    _outstandingRequestCount = Math.max(0, _outstandingRequestCount - 1);
    emitApiActivity();
    // Enhanced error logging
    if (isDevelopment) {
      console.error(`❌ API Error:`, {
        url: error.config?.url || "Unknown URL",
        method: error.config?.method?.toUpperCase?.() || "Unknown Method",
        status: error.response?.status || "No Status",
        statusText: error.response?.statusText || "No Status Text",
        data: error.response?.data || "No Response Data",
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
      const requestUrl = String(error.config?.url || "");
      const isRsaRelatedRequest =
        /rsa|rsapin|check-rsapin|GetBiodata|ValidateMpsPin/i.test(requestUrl);

      error.message = isRsaRelatedRequest
        ? "Invalid rsapin"
        : "The requested resource was not found.";
    }

    // Handle network errors
    if (!error.response) {
      console.error("🌐 Network error or server is not responding");

      // Distinguish between timeout and connection errors
      if (error.code === "ECONNABORTED") {
        error.message =
          "Request timeout. The server is taking too long to respond. Please check if the server is running and try again.";
      } else if (error.code === "ECONNREFUSED") {
        error.message =
          "Cannot connect to the server. Please ensure the API server is running at " +
          API_BASE_URL;
      } else if (error.message && error.message.includes("CORS")) {
        error.message =
          "CORS policy error. The backend server is not configured to accept requests from this origin. Please contact your administrator.";
      } else {
        error.message =
          "Network error. Please check your connection and try again.";
      }
    }

    // Handle server errors (5xx)
    else if (error.response.status >= 500) {
      console.error("🔥 Server error occurred");
      error.message = "Server error occurred. Please try again later.";
    }

    return Promise.reject(error);
  },
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
