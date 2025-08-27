import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../../assets/Logo.png"; // Adjust the path as necessary
import PasswordChange from "./PasswordChange"; // Use your existing component

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showFirstLoginFlow, setShowFirstLoginFlow] = useState(false);

  const { login, isLoading, user, requiresPasswordChange } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const loginInputRef = useRef(null);

  // FIXED: Single useEffect for handling navigation and first login flow
  useEffect(() => {
    if (user) {
      // DEBUG: log what the component sees
      if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        console.log("🔍 Login useEffect sees:", { user, requiresPasswordChange, showFirstLoginFlow });
      }

      if (requiresPasswordChange && !showFirstLoginFlow) {
        console.log("User requires password change - showing first login flow");
        setShowFirstLoginFlow(true);
      } else if (!requiresPasswordChange) {
        const redirectTo = location.state?.from?.pathname || "/dashboard";
        navigate(redirectTo, { replace: true });
      }
    }
  }, [user, requiresPasswordChange, showFirstLoginFlow, navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // FIXED: Simplified handleSubmit - AuthContext handles password change detection
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await login(formData.email, formData.password);
      // AuthContext handles requiresPasswordChange detection automatically
      setErrors({});
    } catch (error) {
      let errorMessage = error.message;

      if (
        errorMessage.toLowerCase().includes("invalid credentials") ||
        errorMessage.toLowerCase().includes("invalid email or password")
      ) {
        errorMessage =
          "Invalid email or password. Please check your credentials.";
      } else if (
        errorMessage.toLowerCase().includes("account locked") ||
        errorMessage.toLowerCase().includes("account disabled")
      ) {
        errorMessage =
          "Your account has been locked or disabled. Please contact support.";
      } else if (errorMessage.toLowerCase().includes("network")) {
        errorMessage = "Network error. Please try again.";
      }

      setErrors({ submit: errorMessage });
    }
  };

  // Handle successful password change from first login
  const handleFirstLoginPasswordChangeSuccess = () => {
  console.log("First login password change completed");
  setShowFirstLoginFlow(false);
  // Show a nice toast then redirect to the login page
  toast.success("Password changed successfully!");
  setTimeout(() => navigate("/login", { replace: true }), 900);
  };

  // Handle going back to login (if user wants to login as different user)
  const handleBackToLogin = () => {
    setShowFirstLoginFlow(false);
    setFormData({ email: "", password: "" });
    setErrors({});
  };

  const handleForgotPassword = () => {
    alert("Forgot password functionality will be implemented soon.");
  };

  // Show first login password change flow
  if (showFirstLoginFlow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 px-4">
        <div className="w-full max-w-lg">
          {/* Header for first login */}
          <div className="text-center mb-6">
            <img src={logo} alt="Logo" className="mx-auto h-16 w-auto mb-4" />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-blue-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-blue-800">
                    First Login Detected
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Welcome {user?.FirstName || user?.firstName}! For security,
                    please change your temporary password.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Use your existing PasswordChange component with additional wrapper */}
          <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
            <FirstLoginPasswordChangeWrapper
              onPasswordChanged={handleFirstLoginPasswordChangeSuccess}
              onCancel={handleBackToLogin}
            />
          </div>
        </div>
      </div>
    );
  }

  // Normal login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 px-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl shadow-2xl rounded-2xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <img src={logo} alt="Logo" className="mx-auto h-20 w-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">
            Mortgage Management System
          </h2>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 ${
                errors.email
                  ? "border-red-400 focus:ring-red-400"
                  : "border-gray-300 focus:ring-[#A8C045]"
              }`}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                ref={loginInputRef}
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 pr-10 text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 ${
                  errors.password
                    ? "border-red-400 focus:ring-red-400"
                    : "border-gray-300 focus:ring-[#A8C045]"
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => {
                  setShowPassword(!showPassword);
                  const inputEl = loginInputRef.current;
                  if (inputEl) {
                    setTimeout(() => {
                      try {
                        inputEl.focus();
                        const len = inputEl.value.length;
                        inputEl.setSelectionRange(len, len);
                      } catch (err) {}
                    }, 0);
                  }
                }}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-[#A8C045] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center rounded-lg bg-[#A8C045] px-4 py-2 text-white font-medium shadow-md hover:bg-[#9BB83C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A8C045] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Demo Credentials (Dev Only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm">
            <p className="font-semibold text-gray-700 mb-2">
              Demo Credentials:
            </p>
            <ul className="space-y-1 text-gray-600 text-xs">
              <li>
                <strong>Super Admin:</strong> superadmin@mmgt.com / password123
              </li>
              <li>
                <strong>Admin:</strong> admin@mmgt.com / password123
              </li>
              <li>
                <strong>User:</strong> user@mmgt.com / password123
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Wrapper component to adapt your existing PasswordChange for first login flow
const FirstLoginPasswordChangeWrapper = ({ onPasswordChanged, onCancel }) => {
  const { changePassword, user } = useAuth();

  // Override the default PasswordChange behavior
  const handlePasswordChangeSuccess = async () => {
    // The changePassword function in AuthContext already handles the state updates
    onPasswordChanged();
  };

  return (
    <div className="relative">
      {/* Custom header for first login context */}
      <div className="bg-gradient-to-r from-[#A8C045] to-[#9BB83C] px-8 py-6 text-white">
        <div className="flex items-center">
          <svg
            className="w-8 h-8 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <div>
            <h3 className="text-xl font-bold">Set Your New Password</h3>
            <p className="text-sm opacity-90">
              Welcome {user?.FirstName || user?.firstName}! Please create a
              secure password.
            </p>
          </div>
        </div>
      </div>

      {/* Use your existing PasswordChange component but override its styling */}
      <div className="password-change-override">
        <PasswordChangeModified
          onSuccess={handlePasswordChangeSuccess}
          onCancel={onCancel}
        />
      </div>

      {/* Override styles for first login context */}
      <style jsx>{`
        .password-change-override .min-h-screen {
          min-height: auto !important;
        }
        .password-change-override > div > div:first-child {
          display: none !important; /* Hide the original header */
        }
      `}</style>
    </div>
  );
};

// Modified version of your PasswordChange component for first login
const PasswordChangeModified = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const { changePassword, isLoading } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "New password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await changePassword(formData.currentPassword, formData.newPassword);
      onSuccess(); // Notify parent component
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  const PasswordInput = ({
    name,
    label,
    placeholder,
    value,
    error,
    showPassword,
    onToggle,
  }) => (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={showPassword ? "text" : "password"}
          required
          value={value}
          onChange={handleChange}
          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-[#A8C045] transition-colors ${
            error ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          onClick={onToggle}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {showPassword ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            )}
          </svg>
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );

  return (
    <div className="p-8 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Current Password */}
        <PasswordInput
          name="currentPassword"
          label="Current Password"
          placeholder="Enter your current password"
          value={formData.currentPassword}
          error={errors.currentPassword}
          showPassword={showPasswords.current}
          onToggle={() => togglePasswordVisibility("current")}
        />

        {/* New Password */}
        <PasswordInput
          name="newPassword"
          label="New Password"
          placeholder="Enter your new password"
          value={formData.newPassword}
          error={errors.newPassword}
          showPassword={showPasswords.new}
          onToggle={() => togglePasswordVisibility("new")}
        />

        {/* Confirm Password */}
        <PasswordInput
          name="confirmPassword"
          label="Confirm New Password"
          placeholder="Confirm your new password"
          value={formData.confirmPassword}
          error={errors.confirmPassword}
          showPassword={showPasswords.confirm}
          onToggle={() => togglePasswordVisibility("confirm")}
        />

        {/* Password Requirements */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-800 font-medium mb-2">
            Password Requirements:
          </p>
          <ul className="text-xs text-gray-700 space-y-1">
            <li className="flex items-center">
              <span
                className={`mr-2 ${
                  formData.newPassword.length >= 8
                    ? "text-green-500"
                    : "text-gray-400"
                }`}
              >
                {formData.newPassword.length >= 8 ? "✓" : "○"}
              </span>
              At least 8 characters long
            </li>
            <li className="flex items-center">
              <span
                className={`mr-2 ${
                  /(?=.*[a-z])/.test(formData.newPassword)
                    ? "text-green-500"
                    : "text-gray-400"
                }`}
              >
                {/(?=.*[a-z])/.test(formData.newPassword) ? "✓" : "○"}
              </span>
              One lowercase letter
            </li>
            <li className="flex items-center">
              <span
                className={`mr-2 ${
                  /(?=.*[A-Z])/.test(formData.newPassword)
                    ? "text-green-500"
                    : "text-gray-400"
                }`}
              >
                {/(?=.*[A-Z])/.test(formData.newPassword) ? "✓" : "○"}
              </span>
              One uppercase letter
            </li>
            <li className="flex items-center">
              <span
                className={`mr-2 ${
                  /(?=.*\d)/.test(formData.newPassword)
                    ? "text-green-500"
                    : "text-gray-400"
                }`}
              >
                {/(?=.*\d)/.test(formData.newPassword) ? "✓" : "○"}
              </span>
              One number
            </li>
          </ul>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Back to Login
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-[#A8C045] text-white px-4 py-2 rounded-lg hover:bg-[#9BB83C] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 text-white mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Changing...
              </div>
            ) : (
              "Change Password"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
