import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useApplication } from "../../context/ApplicationContext";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Mail,
  CreditCard,
  DollarSign,
  Home,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  X,
  Eye,
  EyeOff,
  Loader,
} from "lucide-react";
import ApplicationDocuments from "./ApplicationDocuments";
import ConfirmModal from "../ui/ConfirmModal";

// Step 1: Client Details Component
const ClientDetailsStep = () => {
  const { currentApplication, updateApplicationField, errors } =
    useApplication();
  const { user } = useAuth(); // Get logged-in user data
  const [showRSAPin, setShowRSAPin] = useState(false);

  // Auto-populate PMI data from user when component mounts
  useEffect(() => {
    if (user?.pmiCompanyId) {
      // Update application fields with user PMI data
      updateApplicationField("pmiCompanyId", user.pmiCompanyId);
      if (user.pmiCompanyName) {
        updateApplicationField("pmiCompanyName", user.pmiCompanyName);
      }
      if (user.pmiEmail) {
        updateApplicationField("pmiCompanyEmail", user.pmiEmail);
      }
    } else {
      console.warn("User has no PMI Company ID");
    }
  }, [
    user?.pmiCompanyId,
    user?.pmiCompanyName,
    user?.pmiEmail,
    updateApplicationField,
  ]);

  // Local state to allow free-form typing (commas and decimal point) while
  // storing a cleaned numeric string in context for validation/submission.
  const [rawInputs, setRawInputs] = React.useState({});
  const [focused, setFocused] = React.useState({});

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const cleaned = String(value).replace(/,/g, "");
    const num = Number(cleaned);
    if (isNaN(num)) return String(value);

    const hasDecimal = String(value).includes(".");
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: hasDecimal ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const cleanForStorage = (val) => {
    if (val === null || val === undefined) return "";
    let s = String(val).trim();
    // remove commas and spaces
    s = s.replace(/[,\s]/g, "");
    // remove any non-digit except dot
    s = s.replace(/[^0-9.]/g, "");
    if (s === "") return "";
    // Ensure only one dot and up to 2 decimals
    const parts = s.split(".");
    const integer = parts.shift();
    const decimal = parts.join("");
    const dec2 = decimal ? decimal.slice(0, 2) : null;
    return dec2 ? `${integer}.${dec2}` : integer;
  };

  const handleCurrencyInputChange = (field, value) => {
    // Allow digits, comma, dot while typing
    const allowed = value.replace(/[^0-9.,]/g, "");
    setRawInputs((p) => ({ ...p, [field]: allowed }));

    // store cleaned numeric string (no commas) for validation/submission
    const cleaned = cleanForStorage(allowed);
    updateApplicationField(field, cleaned);
  };

  const handleCurrencyFocus = (field) => {
    setFocused((p) => ({ ...p, [field]: true }));
    // prefill raw input with current raw value (no commas)
    setRawInputs((p) => ({ ...p, [field]: currentApplication[field] ?? "" }));
  };

  const handleCurrencyBlur = (field) => {
    setFocused((p) => ({ ...p, [field]: false }));
    setRawInputs((p) => {
      const next = { ...p };
      delete next[field];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <User className="h-6 w-6 text-[#A8C045]" />
          <h3 className="text-lg font-semibold text-gray-900">
            PMI Information
          </h3>
        </div>

        {/* Auto-populated PMI Company Fields (Read-only) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PMI Company Name
            </label>
            <input
              type="text"
              value={user?.pmiCompanyName || ""}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              {user?.pmiCompanyName
                ? "Auto-populated from your account"
                : "Not available"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PMI Company Email
            </label>
            <input
              type="email"
              value={user?.pmiEmail || ""}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              {user?.pmiEmail
                ? "Auto-populated from your account"
                : "No email available"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <CreditCard className="h-6 w-6 text-[#A8C045]" />
          <h3 className="text-lg font-semibold text-gray-900">
            Borrower Information
          </h3>
        </div>

        {/* RSA Pin */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            RSA Pin *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 font-medium">PEN</span>
            </div>
            <input
              type="text"
              value={currentApplication.rsaPin?.replace(/^PEN/, "") || ""} // Remove PEN for display
              onChange={(e) => {
                const value = e.target.value.replace(/[^A-Z0-9]/g, ""); // Only allow alphanumeric
                updateApplicationField("rsaPin", "PEN" + value); // Add PEN prefix before saving
              }}
              placeholder="123456780000"
              maxLength={12}
              className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent ${
                errors.rsaPin ? "border-red-300 bg-red-50" : "border-gray-300"
              }`}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter 12 characters after PEN (letters and numbers only)
          </p>
          {errors.rsaPin && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.rsaPin}
            </p>
          )}
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              value={currentApplication.firstName || ""}
              onChange={(e) =>
                updateApplicationField("firstName", e.target.value)
              }
              placeholder="Enter first name"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent ${
                errors.firstName
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
            />
            {errors.firstName && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Middle Name
            </label>
            <input
              type="text"
              value={currentApplication.middleName || ""}
              onChange={(e) =>
                updateApplicationField("middleName", e.target.value)
              }
              placeholder="Enter middle name (optional)"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent ${
                errors.middleName
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
            />
            {errors.middleName && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.middleName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              value={currentApplication.lastName || ""}
              onChange={(e) =>
                updateApplicationField("lastName", e.target.value)
              }
              placeholder="Enter last name"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent ${
                errors.lastName ? "border-red-300 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.lastName && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.lastName}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Financial Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equity Value *
            </label>
            <input
              type="text"
              value={
                focused.equityValue
                  ? rawInputs.equityValue ??
                    currentApplication.equityValue ??
                    ""
                  : currentApplication.equityValue
                  ? formatCurrency(currentApplication.equityValue)
                  : ""
              }
              onFocus={() => handleCurrencyFocus("equityValue")}
              onBlur={() => handleCurrencyBlur("equityValue")}
              onChange={(e) =>
                handleCurrencyInputChange("equityValue", e.target.value)
              }
              placeholder="₦0"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent ${
                errors.equityValue
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
            />
            {errors.equityValue && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.equityValue}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplementary Value *
            </label>
            <input
              type="text"
              value={
                focused.supplementaryValue
                  ? rawInputs.supplementaryValue ??
                    currentApplication.supplementaryValue ??
                    ""
                  : currentApplication.supplementaryValue
                  ? formatCurrency(currentApplication.supplementaryValue)
                  : ""
              }
              onFocus={() => handleCurrencyFocus("supplementaryValue")}
              onBlur={() => handleCurrencyBlur("supplementaryValue")}
              onChange={(e) =>
                handleCurrencyInputChange("supplementaryValue", e.target.value)
              }
              placeholder="₦0"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent ${
                errors.supplementaryValue
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter 0 if no supplementary value applies
            </p>
            {errors.supplementaryValue && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.supplementaryValue}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loan Amount *
            </label>
            <input
              type="text"
              value={
                focused.loanAmount
                  ? rawInputs.loanAmount ?? currentApplication.loanAmount ?? ""
                  : currentApplication.loanAmount
                  ? formatCurrency(currentApplication.loanAmount)
                  : ""
              }
              onFocus={() => handleCurrencyFocus("loanAmount")}
              onBlur={() => handleCurrencyBlur("loanAmount")}
              onChange={(e) =>
                handleCurrencyInputChange("loanAmount", e.target.value)
              }
              placeholder="₦0"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent ${
                errors.loanAmount
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
            />
            {errors.loanAmount && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.loanAmount}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Value *
            </label>
            <input
              type="text"
              value={
                focused.propertyValue
                  ? rawInputs.propertyValue ??
                    currentApplication.propertyValue ??
                    ""
                  : currentApplication.propertyValue
                  ? formatCurrency(currentApplication.propertyValue)
                  : ""
              }
              onFocus={() => handleCurrencyFocus("propertyValue")}
              onBlur={() => handleCurrencyBlur("propertyValue")}
              onChange={(e) =>
                handleCurrencyInputChange("propertyValue", e.target.value)
              }
              placeholder="₦0"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent ${
                errors.propertyValue
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
            />
            {errors.propertyValue && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.propertyValue}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 2: Upload Documents Component
const UploadDocumentsStep = () => {
  const {
    currentApplication,
    addDocument,
    removeDocument,
    errors,
    updateApplicationField,
    handleBackendDocumentCountChange, // NEW: Get the callback from context
  } = useApplication();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (files) => {
    Array.from(files).forEach((file) => {
      addDocument(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Upload className="h-6 w-6 text-[#A8C045]" />
          <h3 className="text-lg font-semibold text-gray-900">
            Upload Required Documents
          </h3>
        </div>

        {/* Link to Backend Application (paste the GUID once created) */}
        {currentApplication.backendApplicationId ? (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            <div className="font-medium">Server application ready</div>
            <div className="mt-1 break-all">
              Id: {currentApplication.backendApplicationId}
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            Application will be created on the server when you click Next.
          </div>
        )}

        {/* Backend-backed uploader (preferred) */}
        {currentApplication.backendApplicationId ? (
          <ApplicationDocuments
            applicationId={currentApplication.backendApplicationId}
            applicationStatus={currentApplication.status}
            defaultDocumentType="identity_document"
            onDocumentCountChange={handleBackendDocumentCountChange} // NEW: Pass the callback
          />
        ) : (
          <>
            {/* File Upload Area (local staging) */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? "border-[#A8C045] bg-green-50"
                  : errors.documents
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 hover:border-[#A8C045] hover:bg-green-50"
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
            >
              <div className="flex flex-col items-center space-y-4">
                <Upload
                  className={`h-12 w-12 ${
                    isDragOver ? "text-[#A8C045]" : "text-gray-400"
                  }`}
                />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop your documents here, or{" "}
                    <label className="text-[#A8C045] hover:text-green-600 cursor-pointer underline">
                      browse files
                      <input
                        type="file"
                        multiple
                        accept=".pdf"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-gray-500 mt-2">
                    Supported formats: PDF (Max 10MB each)
                  </p>
                </div>
              </div>
            </div>

            {errors.documents && (
              <p className="text-red-600 text-sm mt-3 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.documents}
              </p>
            )}

            {/* Uploaded Documents List (local staging) */}
            {currentApplication.documents &&
              currentApplication.documents.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-4">
                    Uploaded Documents ({currentApplication.documents.length})
                  </h4>
                  <div className="space-y-3">
                    {currentApplication.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {doc.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(doc.size)} • Uploaded{" "}
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeDocument(doc.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
};

// Step 3: Confirmation Component
const ConfirmationStep = () => {
  const { currentApplication, errors } = useApplication();
  const { user } = useAuth(); // Get logged-in user data for PMI review

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "Not specified";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Review Header */}
      <div className="bg-gradient-to-r from-[#A8C045] to-green-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-8 w-8" />
          <div>
            <h3 className="text-2xl font-bold">Review Your Application</h3>
            <p className="opacity-90">
              Please review all information before submitting
            </p>
          </div>
        </div>
      </div>

      {/* PMI Information Review */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-[#A8C045]" />
          PMI Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Company Name:</span>
            <p className="font-medium">
              {user?.pmiCompanyName || "Not specified"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Company Email:</span>
            <p className="font-medium">{user?.pmiEmail || "Not specified"}</p>
          </div>
        </div>
      </div>

      {/* Borrower Information Review */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-[#A8C045]" />
          Borrower Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">RSA Pin:</span>
            <p className="font-medium">
              {currentApplication.rsaPin
                ? "••••••" + currentApplication.rsaPin.slice(-4)
                : "Not specified"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Full Name:</span>
            <p className="font-medium">
              {[
                currentApplication.firstName,
                currentApplication.middleName,
                currentApplication.lastName,
              ]
                .filter(Boolean)
                .join(" ") || "Not specified"}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Information Review */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          Financial Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Equity Value:</span>
            <p className="font-medium text-lg">
              {formatCurrency(currentApplication.equityValue)}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Supplementary Value:</span>
            <p className="font-medium text-lg">
              {formatCurrency(currentApplication.supplementaryValue)}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Loan Amount:</span>
            <p className="font-medium text-lg text-[#A8C045]">
              {formatCurrency(currentApplication.loanAmount)}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Property Value:</span>
            <p className="font-medium text-lg">
              {formatCurrency(currentApplication.propertyValue)}
            </p>
          </div>
        </div>

        {/* Loan-to-Value Ratio */}
        {currentApplication.loanAmount && currentApplication.propertyValue && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500 text-sm">Loan-to-Value Ratio:</span>
            <p className="font-medium">
              {(
                (parseFloat(currentApplication.loanAmount) /
                  parseFloat(currentApplication.propertyValue)) *
                100
              ).toFixed(1)}
              %
            </p>
          </div>
        )}
      </div>

      {/* Documents Review */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-[#A8C045]" />
          Uploaded Documents ({currentApplication.documents?.length || 0})
        </h4>
        {currentApplication.documents &&
        currentApplication.documents.length > 0 ? (
          <div className="space-y-2">
            {currentApplication.documents.map((doc, index) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(doc.size)}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Ready to submit
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No documents uploaded
          </p>
        )}
      </div>

      {/* Submission Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Important Notice</p>
            <p className="text-blue-700 mt-1">
              By submitting this application, you confirm that all information
              provided is accurate and complete. Any false information may
              result in application rejection or legal consequences.
            </p>
          </div>
        </div>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{errors.general}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Multi-step Form Component
const SubmitApplicationForm = () => {
  const {
    currentStep,
    nextStep,
    previousStep,
    currentApplication,
    submitApplication,
    resetForm,
    progress,
    isSubmitting,
    canProceedToNext,
    canGoBack,
    isLastStep,
    FORM_STEPS,
    TOTAL_STEPS,
    loadBackendApplication,
  } = useApplication();

  const location = useLocation();
  const navigate = useNavigate();
  const [displayStatus, setDisplayStatus] = useState(null);

  // If opened with an applicationId (for edit/resubmit), load it into context
  useEffect(() => {
    (async () => {
      const appId =
        location?.state?.appId ||
        new URLSearchParams(location.search).get("appId");
      if (appId && loadBackendApplication) {
        const toastId = toast.loading("Loading application...");
        try {
          const ok = await loadBackendApplication(appId);
          toast.dismiss(toastId);
          if (!ok) {
            toast.error("Failed to load application");
            // If loading failed, redirect away
            navigate("/client/pending-applications");
          } else {
            // Clear any previous client-side display status when loading an app
            setDisplayStatus(null);
            toast.success("Application loaded", { duration: 1500 });
          }
        } catch (err) {
          console.error("Error loading backend application:", err);
          toast.dismiss(toastId);
          toast.error("Failed to load application");
          navigate("/client/pending-applications");
        }
      } else {
        // No appId provided -> ensure this is a fresh form
        try {
          resetForm();
        } catch (err) {
          console.warn("Could not reset form on new Submit tab open:", err);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.state, location?.search, loadBackendApplication, resetForm]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [showResubmittedModal, setShowResubmittedModal] = useState(false);

  const stepTitles = {
    [FORM_STEPS.CLIENT_DETAILS]: "Client Details",
    [FORM_STEPS.UPLOAD_DOCUMENTS]: "Upload Documents",
    [FORM_STEPS.CONFIRMATION]: "Review & Submit",
  };

  const handleNext = async () => {
    const success = await nextStep();
    if (!success) {
      console.log("Cannot proceed to next step - validation failed");
    }
  };

  const handlePrevious = () => {
    previousStep();
  };

  const handleSubmit = async () => {
    // Capture pre-submit status to determine if this is a resubmission
    const preStatus = (currentApplication?.status || "").toLowerCase();
    const result = await submitApplication();
    setSubmissionResult(result);
    if (result.success) {
      // If this was a resubmission of a rejected/returned application,
      // show a confirmation modal and navigate back to pending list when closed.
      if (preStatus === "rejected" || preStatus === "returned") {
        setDisplayStatus("resubmitted");
        setShowResubmittedModal(true);
        return;
      }

      // Regular new submission flow
      setIsSubmitted(true);
    }
  };

  const handleResubmittedOk = () => {
    setShowResubmittedModal(false);
    // Keep application state as-is (do not reset) and navigate back to pending list
    navigate("/client/pending-applications");
  };

  const handleStartNew = () => {
    setIsSubmitted(false);
    setSubmissionResult(null);
    resetForm();
    setDisplayStatus(null);
  };

  // Success Screen
  if (isSubmitted && submissionResult?.success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Application Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Your mortgage application has been submitted and is now under
            review.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="font-medium text-gray-900">Application Reference</p>
            <p className="text-2xl font-bold text-[#A8C045] mt-2">
              {submissionResult.applicationId}
            </p>
          </div>
          <div className="space-y-3 text-sm text-gray-600 mb-8">
            <p>• You will receive a confirmation email shortly</p>
            <p>• Processing typically takes 5-10 business days</p>
            <p>• You can track your application status in your dashboard</p>
          </div>
          <button
            onClick={handleStartNew}
            className="bg-[#A8C045] hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Resubmitted confirmation modal */}
      <ConfirmModal
        isOpen={showResubmittedModal}
        title="Application Resubmitted"
        message="Your application was successfully resubmitted. You will find it in your Pending Applications list."
        onConfirm={handleResubmittedOk}
        onCancel={() => {
          setShowResubmittedModal(false);
          navigate("/client/pending-applications");
        }}
        confirmLabel="OK"
        cancelLabel="Close"
      />
      {/* Progress Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900">
              Submit Application
            </h2>
            {displayStatus && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                {displayStatus === "resubmitted" ? "Resubmitted" : "Submitted"}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#A8C045] h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {Array.from({ length: TOTAL_STEPS }, (_, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === currentStep;
              const isCompleted = stepNumber < currentStep;

              return (
                <div key={stepNumber} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isCompleted
                        ? "bg-[#A8C045] text-white"
                        : isActive
                        ? "bg-[#A8C045] text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      isActive ? "text-[#A8C045]" : "text-gray-500"
                    }`}
                  >
                    {stepTitles[stepNumber]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-6">
        {currentStep === FORM_STEPS.CLIENT_DETAILS && <ClientDetailsStep />}
        {currentStep === FORM_STEPS.UPLOAD_DOCUMENTS && <UploadDocumentsStep />}
        {currentStep === FORM_STEPS.CONFIRMATION && <ConfirmationStep />}
      </div>

      {/* Navigation Buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            {canGoBack && (
              <button
                onClick={handlePrevious}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {!isLastStep && (
              <button
                onClick={handleNext}
                disabled={!canProceedToNext || isSubmitting}
                className="flex items-center space-x-2 font-medium py-3 px-6 rounded-lg transition-colors bg-[#A8C045] hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}

            {isLastStep && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceedToNext}
                className="flex items-center space-x-2 font-medium py-3 px-8 rounded-lg transition-colors bg-[#A8C045] hover:bg-green-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            {currentStep === FORM_STEPS.CLIENT_DETAILS &&
              "Please fill in all required fields marked with *"}
            {currentStep === FORM_STEPS.UPLOAD_DOCUMENTS &&
              "Upload at least one supporting document for your application"}
            {currentStep === FORM_STEPS.CONFIRMATION &&
              "Review all information carefully before submitting"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubmitApplicationForm;
