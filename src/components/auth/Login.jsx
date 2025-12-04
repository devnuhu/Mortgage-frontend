import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../../assets/Logo.png";
import whiteLogo from "../../assets/WhiteLogo.png";
import mmgtBg from "../../assets/mmgtBg.jpg";
import PasswordChange from "./PasswordChange";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showFirstLoginFlow, setShowFirstLoginFlow] = useState(false);

  const { login, isLoading, user, requiresPasswordChange } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const loginInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      if (
        typeof window !== "undefined" &&
        window.location.hostname === "localhost"
      ) {
        console.log("🔍 Login useEffect sees:", {
          user,
          requiresPasswordChange,
          showFirstLoginFlow,
        });
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

  const handleFirstLoginPasswordChangeSuccess = () => {
    console.log("First login password change completed");
    setShowFirstLoginFlow(false);
    toast.success("Password changed successfully!");
    setTimeout(() => navigate("/login", { replace: true }), 900);
  };

  const handleBackToLogin = () => {
    setShowFirstLoginFlow(false);
    setFormData({ email: "", password: "" });
    setErrors({});
  };

  const handleForgotPassword = () => {
    toast.info("Forgot password functionality will be implemented soon.");
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image - Covers entire page */}
      <div className="absolute inset-0">
        <img src={mmgtBg} alt="" className="w-full h-full object-cover" />
        {/* Gradient overlay - Darker on mobile for better readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-black/30 lg:from-black/40 lg:to-black/20"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row px-4 py-8 lg:p-0">
        {/* Left Section - App Info */}
        <div className="lg:w-1/2 flex items-center justify-center lg:justify-start lg:px-16 py-8 lg:py-0 text-center lg:text-left">
          <div>
            <img
              src={whiteLogo}
              alt="MMGT Logo"
              className="w-32 lg:w-40 h-auto mx-auto lg:mx-0 mb-6 lg:mb-8"
            />
            <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 lg:mb-6">
              Mortgage Management System
            </h1>
            <p className="text-lg lg:text-xl text-white/90 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Streamline your mortgage processes with our comprehensive
              management platform
            </p>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md space-y-6 lg:space-y-8 bg-white/95 backdrop-blur-xl rounded-2xl p-6 lg:p-8 shadow-2xl">
            {showFirstLoginFlow ? (
              <FirstLoginPasswordChangeWrapper
                onPasswordChanged={handleFirstLoginPasswordChangeSuccess}
                onCancel={handleBackToLogin}
              />
            ) : (
              <div>
                {/* Welcome Text */}
                <div className="text-center lg:text-left">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    Welcome Back
                  </h2>
                  <p className="mt-2 text-sm lg:text-base text-gray-600">
                    Please sign in to continue
                  </p>
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
                      <p className="mt-1 text-xs text-red-500">
                        {errors.email}
                      </p>
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
                      <p className="mt-1 text-xs text-red-500">
                        {errors.password}
                      </p>
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
                {/* {process.env.NODE_ENV === "development" && (
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
        )}*/}
              </div>
            )}
          </div>
        </div>
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
        <PasswordChange
          onSuccess={handlePasswordChangeSuccess}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
};

export default Login;
