// PMI Status constants
export const PMIStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
  PENDING: "PENDING",
};

// Default PMI object for forms
export const defaultPMI = {
  pmiName: "",
  emailAddress: "",
  resourcePersonName: "",
  resourcePersonEmail: "",
  phoneNumber: "",
  status: PMIStatus.ACTIVE,
};

// Validation function
export const validatePMI = (pmiData) => {
  const errors = {};

  // PMI Name validation
  if (!pmiData.pmiName?.trim()) {
    errors.pmiName = "PMI company name is required";
  } else if (pmiData.pmiName.trim().length < 2) {
    errors.pmiName = "PMI company name must be at least 2 characters";
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pmiData.emailAddress?.trim()) {
    errors.emailAddress = "Email address is required";
  } else if (!emailRegex.test(pmiData.emailAddress.trim())) {
    errors.emailAddress = "Please enter a valid email address";
  }

  // Resource person name validation
  if (!pmiData.resourcePersonName?.trim()) {
    errors.resourcePersonName = "Resource person name is required";
  } else if (pmiData.resourcePersonName.trim().length < 2) {
    errors.resourcePersonName =
      "Resource person name must be at least 2 characters";
  }

  // Resource person email validation
  if (!pmiData.resourcePersonEmail?.trim()) {
    errors.resourcePersonEmail = "Resource person email is required";
  } else if (!emailRegex.test(pmiData.resourcePersonEmail.trim())) {
    errors.resourcePersonEmail = "Please enter a valid email address";
  }

  // Phone number validation
  if (!pmiData.phoneNumber?.trim()) {
    errors.phoneNumber = "Phone number is required";
  } else if (pmiData.phoneNumber.trim().length < 10) {
    errors.phoneNumber = "Please enter a valid phone number";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Get status color classes for UI
export const getStatusColor = (status) => {
  const normalizedStatus = status?.toLowerCase();
  switch (normalizedStatus) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "inactive":
      return "bg-red-100 text-red-800 border-red-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "suspended":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid Date";
  }
};

// Format date for display (short version)
export const formatDateShort = (dateString) => {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid Date";
  }
};

// Helper to check if PMI can be edited/deleted
export const canModifyPMI = (pmi) => {
  // Add your business logic here
  // For example, you might not allow modification of PMIs with pending applications
  return (
    pmi.status !== PMIStatus.SUSPENDED || (pmi.pendingApplications || 0) === 0
  );
};

// Helper to get PMI display name
export const getPMIDisplayName = (pmi) => {
  return pmi?.pmiName || "Unknown PMI";
};

// Helper to get resource person display info
export const getResourcePersonInfo = (pmi) => {
  return {
    name: pmi?.resourcePersonName || "Not specified",
    email: pmi?.resourcePersonEmail || "Not specified",
  };
};
