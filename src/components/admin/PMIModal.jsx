import React, { useState, useEffect } from "react";
import { usePMI } from "../../context/PMIContext";
import { defaultPMI, validatePMI } from "../../types/pmi";

const PMIModal = ({ isOpen, onClose, editPMI = null }) => {
  const { createPMI, updatePMI, loading } = usePMI();
  const [formData, setFormData] = useState(defaultPMI);
  const [errors, setErrors] = useState({});
  const [tempPassword, setTempPassword] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const isEditing = editPMI !== null;

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setFormData(editPMI);
        setTempPassword("");
      } else {
        setFormData(defaultPMI);
        setTempPassword("");
      }
      setErrors({});
      setShowSuccess(false);
      setSuccessMessage("");
    }
  }, [isOpen, editPMI, isEditing]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    const validation = validatePMI(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    let result;
    if (isEditing) {
      result = await updatePMI(editPMI.id, formData);
    } else {
      result = await createPMI(formData);
    }

    if (result.success) {
      if (!isEditing) {
        // Handle new PMI creation
        const password =
          result.pmi?.tempPassword || "Please contact admin for password";
        setTempPassword(password);
        setSuccessMessage("PMI Company created successfully!");
        setShowSuccess(true);
      } else {
        // Handle PMI update
        setSuccessMessage("PMI Company updated successfully!");
        setShowSuccess(true);
        // Auto close after 2 seconds for updates
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } else {
      setErrors({ submit: result.error });
    }
  };

  // Handle close
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      onClick={handleBackdropClick}
    >
      <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? "Edit PMI Company" : "Add New PMI Company"}
          </h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-green-800">
                  {successMessage}
                </h3>
                {tempPassword && !isEditing && (
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Temporary Password:{" "}
                      <span className="font-mono font-bold bg-green-100 px-2 py-1 rounded">
                        {tempPassword}
                      </span>
                    </p>
                    <p className="mt-1">
                      Please share this password with the PMI company. They will
                      be required to change it on first login.
                    </p>
                  </div>
                )}
                {!isEditing && (
                  <div className="mt-3">
                    <button
                      onClick={handleClose}
                      className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form - Hide when showing success for new PMI */}
        {!(showSuccess && !isEditing) && (
          <>
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* PMI Name */}
              <div>
                <label
                  htmlFor="pmiName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  PMI Company Name *
                </label>
                <input
                  type="text"
                  id="pmiName"
                  name="pmiName"
                  value={formData.pmiName}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-opacity-50 disabled:bg-gray-50 disabled:opacity-50 ${
                    errors.pmiName ? "border-red-300" : "border-gray-300"
                  }`}
                  style={
                    !errors.pmiName
                      ? {
                          focusRingColor: "#A8C045",
                          focusBorderColor: "#A8C045",
                        }
                      : {}
                  }
                  placeholder="Enter PMI company name"
                />
                {errors.pmiName && (
                  <p className="mt-1 text-sm text-red-600">{errors.pmiName}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="emailAddress"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  id="emailAddress"
                  name="emailAddress"
                  value={formData.emailAddress}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-opacity-50 disabled:bg-gray-50 disabled:opacity-50 ${
                    errors.emailAddress ? "border-red-300" : "border-gray-300"
                  }`}
                  style={
                    !errors.emailAddress
                      ? {
                          focusRingColor: "#A8C045",
                          focusBorderColor: "#A8C045",
                        }
                      : {}
                  }
                  placeholder="Enter email address"
                />
                {errors.emailAddress && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.emailAddress}
                  </p>
                )}
              </div>

              {/* Resource Person Name */}
              <div>
                <label
                  htmlFor="resourcePersonName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Resource Person's Full Name *
                </label>
                <input
                  type="text"
                  id="resourcePersonName"
                  name="resourcePersonName"
                  value={formData.resourcePersonName}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-opacity-50 disabled:bg-gray-50 disabled:opacity-50 ${
                    errors.resourcePersonName
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  style={
                    !errors.resourcePersonName
                      ? {
                          focusRingColor: "#A8C045",
                          focusBorderColor: "#A8C045",
                        }
                      : {}
                  }
                  placeholder="Enter resource person's name"
                />
                {errors.resourcePersonName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.resourcePersonName}
                  </p>
                )}
              </div>

              {/* Resource Person Email */}
              <div>
                <label
                  htmlFor="resourcePersonEmail"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Resource Person's Email *
                </label>
                <input
                  type="email"
                  id="resourcePersonEmail"
                  name="resourcePersonEmail"
                  value={formData.resourcePersonEmail}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-opacity-50 disabled:bg-gray-50 disabled:opacity-50 ${
                    errors.resourcePersonEmail
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  style={
                    !errors.resourcePersonEmail
                      ? {
                          focusRingColor: "#A8C045",
                          focusBorderColor: "#A8C045",
                        }
                      : {}
                  }
                  placeholder="Enter resource person's email"
                />
                {errors.resourcePersonEmail && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.resourcePersonEmail}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  PMI Phone Number *
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-opacity-50 disabled:bg-gray-50 disabled:opacity-50 ${
                    errors.phoneNumber ? "border-red-300" : "border-gray-300"
                  }`}
                  style={
                    !errors.phoneNumber
                      ? {
                          focusRingColor: "#A8C045",
                          focusBorderColor: "#A8C045",
                        }
                      : {}
                  }
                  placeholder="Enter phone number"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{errors.submit}</p>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#A8C045" }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEditing ? "Updating..." : "Creating..."}
                    </span>
                  ) : isEditing ? (
                    "Update PMI"
                  ) : (
                    "Create PMI"
                  )}
                </button>
              </div>
            </form>

            {/* Instructions */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    {isEditing
                      ? "Update the PMI company information. Changes will be saved immediately."
                      : "A temporary password will be generated automatically. The PMI company will need to change it on their first login."}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PMIModal;
