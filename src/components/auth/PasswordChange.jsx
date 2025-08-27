import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

// Move PasswordInput outside the main component to prevent recreation on each render
const PasswordInput = ({
  name,
  label,
  placeholder,
  value,
  error,
  showPassword,
  onToggle,
  onChange,
  inputRefs,
}) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <div className="mt-1 relative">
      <input
        ref={(input) => {
          if (input) inputRefs.current[name] = input;
        }}
        id={name}
        name={name}
        type={showPassword ? "text" : "password"}
        required
        value={value}
        onChange={onChange}
        className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
          error ? "border-red-300" : "border-gray-300"
        } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none sm:text-sm`}
        placeholder={placeholder}
        onFocus={(e) => {
          e.target.style.borderColor = "#A8C045";
          e.target.style.boxShadow = "0 0 0 2px rgba(168, 192, 69, 0.2)";
        }}
        onBlur={(e) => {
          if (!error) {
            e.target.style.borderColor = "#d1d5db";
            e.target.style.boxShadow = "none";
          }
        }}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 pr-3 flex items-center"
        tabIndex={-1}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onPointerDown={(e) => {
          e.preventDefault();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
        }}
        onKeyDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          onToggle && onToggle(e);
          const inputEl = inputRefs.current[name];
          if (inputEl) {
            setTimeout(() => {
              try {
                inputEl.focus();
                const len = inputEl.value.length;
                inputEl.setSelectionRange(len, len);
              } catch (err) {
                // ignore
              }
            }, 0);
          }
        }}
      >
        <svg
          className="h-5 w-5 text-gray-400"
          style={{ pointerEvents: "none", userSelect: "none" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
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

const PasswordChange = ({ onSuccess, onCancel }) => {
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

  const { changePassword, isLoading, user } = useAuth();
  const inputRefs = useRef({});
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Validate form
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await changePassword(formData.currentPassword, formData.newPassword);
      if (typeof onSuccess === "function") {
        onSuccess();
      } else {
        toast.success("Password changed successfully!");
        setTimeout(() => navigate("/login", { replace: true }), 900);
      }
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div
            className="mx-auto h-12 w-12 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "#A8C045" }}
          >
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.414-6.414a6 6 0 016.414-6.414z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Change Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome {user?.FirstName || user?.firstName}! Please change your
            temporary password
          </p>
        </div>

        {/* Password Change Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Current Password */}
            <PasswordInput
              name="currentPassword"
              label="Current Password"
              placeholder="Enter your current password"
              value={formData.currentPassword}
              error={errors.currentPassword}
              showPassword={showPasswords.current}
              onToggle={() => togglePasswordVisibility("current")}
              onChange={handleChange}
              inputRefs={inputRefs}
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
              onChange={handleChange}
              inputRefs={inputRefs}
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
              onChange={handleChange}
              inputRefs={inputRefs}
            />
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
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
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isLoading ? "#9BB83C" : "#A8C045",
                focusRingColor: "rgba(168, 192, 69, 0.5)",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.target.style.backgroundColor = "#9BB83C";
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.target.style.backgroundColor = "#A8C045";
              }}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Updating Password...
                </div>
              ) : (
                "Change Password"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChange;
