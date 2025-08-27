import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext";
import {
  createApplication as apiCreateApplication,
  submitApplicationById,
} from "../services/application-api";

// Application Status Constants
const APPLICATION_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// Form Steps
const FORM_STEPS = {
  CLIENT_DETAILS: 1,
  UPLOAD_DOCUMENTS: 2,
  CONFIRMATION: 3,
};

const TOTAL_STEPS = 3;

const ApplicationContext = createContext();

export const useApplication = () => {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error(
      "useApplication must be used within an ApplicationProvider"
    );
  }
  return context;
};

export const ApplicationProvider = ({ children }) => {
  const { user } = useAuth();

  // Form state
  const [currentStep, setCurrentStep] = useState(FORM_STEPS.CLIENT_DETAILS);
  const [currentApplication, setCurrentApplication] = useState({
    // PMI Information (auto-populated from user data)
    pmiCompanyId: user?.pmiCompanyId || "",
    pmiCompanyName: user?.pmiCompanyName || "",
    pmiCompanyEmail: user?.pmiEmail || "",

    // Borrower Information
    firstName: "",
    middleName: "",
    lastName: "",
    rsaPin: "",

    // Financial Information
    equityValue: "",
    supplementaryValue: "",
    loanAmount: "",
    propertyValue: "",

    // Documents (local staging only)
    documents: [],

    // Backend integration
    backendApplicationId: null,
    applicationNumber: "",
    status: APPLICATION_STATUS.DRAFT,
  });

  // Backend document count tracking
  const [backendDocumentCount, setBackendDocumentCount] = useState(0);

  // Form validation errors
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation rules
  const validationRules = {
    firstName: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s]+$/,
    },
    lastName: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s]+$/,
    },
    middleName: {
      required: false,
      maxLength: 100,
      pattern: /^[a-zA-Z\s]*$/,
    },
    rsaPin: {
      required: true,
      pattern: /^PEN[A-Z0-9]{12}$/,
      message: "RSA PIN must be in format PEN followed by 12 characters",
    },
    equityValue: {
      required: true,
      min: 1,
      type: "number",
    },
    supplementaryValue: {
      required: true,
      min: 0,
      type: "number",
    },
    loanAmount: {
      required: true,
      min: 1,
      type: "number",
    },
    propertyValue: {
      required: true,
      min: 1,
      type: "number",
    },
  };

  // Validation function
  const validateField = useCallback((fieldName, value) => {
    const rule = validationRules[fieldName];
    if (!rule) return null;

    // Required field validation
    if (rule.required && (!value || value.toString().trim() === "")) {
      return `${
        fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
      } is required`;
    }

    // Skip other validations if field is empty and not required
    if ((!value || value.toString().trim() === "") && !rule.required) {
      return null;
    }

    const stringValue = value.toString().trim();

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return rule.message || `Invalid ${fieldName} format`;
    }

    // Length validation
    if (rule.minLength && stringValue.length < rule.minLength) {
      return `${fieldName} must be at least ${rule.minLength} characters`;
    }
    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return `${fieldName} must not exceed ${rule.maxLength} characters`;
    }

    // Number validation
    if (rule.type === "number") {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return `${fieldName} must be a valid number`;
      }

      if (rule.min !== undefined && numValue < rule.min) {
        // Special handling for supplementaryValue which can be 0
        if (fieldName === "supplementaryValue" && numValue === 0) {
          return null;
        }
        return `${fieldName} must be at least ${rule.min}`;
      }

      if (rule.max && numValue > rule.max) {
        return `${fieldName} must not exceed ${rule.max}`;
      }
    }

    return null;
  }, []);

  // Validate form and UPDATE errors state
  const validateForm = useCallback(
    (step = currentStep, updateErrors = false) => {
      const newErrors = {};
      let fieldsToValidate = [];

      switch (step) {
        case FORM_STEPS.CLIENT_DETAILS:
          fieldsToValidate = [
            "firstName",
            "lastName",
            "rsaPin",
            "equityValue",
            "supplementaryValue",
            "loanAmount",
            "propertyValue",
          ];
          break;

        case FORM_STEPS.UPLOAD_DOCUMENTS:
          // FIXED: Check the appropriate document source
          const hasDocuments = currentApplication.backendApplicationId
            ? backendDocumentCount > 0 // Check backend documents
            : currentApplication.documents &&
              currentApplication.documents.length > 0; // Check local documents

          if (!hasDocuments) {
            newErrors.documents = "At least one document is required";
          }
          break;

        case FORM_STEPS.CONFIRMATION:
          fieldsToValidate = [
            "firstName",
            "lastName",
            "rsaPin",
            "equityValue",
            "supplementaryValue",
            "loanAmount",
            "propertyValue",
          ];

          // FIXED: Check the appropriate document source for confirmation step
          const hasConfirmationDocuments =
            currentApplication.backendApplicationId
              ? backendDocumentCount > 0 // Check backend documents
              : currentApplication.documents &&
                currentApplication.documents.length > 0; // Check local documents

          if (!hasConfirmationDocuments) {
            newErrors.documents = "At least one document is required";
          }
          break;
      }

      // Validate each field
      fieldsToValidate.forEach((field) => {
        const fieldValue = currentApplication[field];
        const error = validateField(field, fieldValue);
        if (error) {
          newErrors[field] = error;
        }
      });

      // Optional middle name validation
      if (currentApplication.middleName) {
        const middleNameError = validateField(
          "middleName",
          currentApplication.middleName
        );
        if (middleNameError) {
          newErrors.middleName = middleNameError;
        }
      }

      const isValid = Object.keys(newErrors).length === 0;

      // Update errors state if requested
      if (updateErrors) {
        setErrors(newErrors);
      }

      console.log("📊 VALIDATION RESULT:", {
        step,
        isValid,
        errorCount: Object.keys(newErrors).length,
        errors: newErrors,
        updateErrors,
        hasBackendApp: !!currentApplication.backendApplicationId,
        backendDocCount: backendDocumentCount,
        localDocCount: currentApplication.documents?.length || 0,
      });

      return isValid;
    },
    [currentApplication, currentStep, backendDocumentCount, validateField]
  );

  // Update application field
  const updateApplicationField = useCallback(
    (field, value) => {
      console.log(`📝 Updating ${field}:`, value);

      setCurrentApplication((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error for this field
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Document management (local staging only)
  const addDocument = useCallback((file) => {
    const document = {
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      file: file,
      uploadedAt: new Date().toISOString(),
    };

    setCurrentApplication((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), document],
    }));

    // Clear documents error
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.documents;
      return newErrors;
    });
  }, []);

  const removeDocument = useCallback((documentId) => {
    setCurrentApplication((prev) => ({
      ...prev,
      documents: prev.documents?.filter((doc) => doc.id !== documentId) || [],
    }));
  }, []);

  // NEW: Backend document count handler
  const handleBackendDocumentCountChange = useCallback((count) => {
    console.log("📄 Backend document count updated:", count);
    setBackendDocumentCount(count);

    // Clear documents error when documents are added
    if (count > 0) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.documents;
        return newErrors;
      });
    }
  }, []);

  // FIXED: Step navigation with proper API integration
  const nextStep = useCallback(async () => {
    console.log(`🚀 NEXT STEP: ${currentStep} -> ${currentStep + 1}`);

    // Validate current step and UPDATE errors state
    const isValid = validateForm(currentStep, true);

    if (!isValid) {
      console.log("🛑 Validation failed - cannot proceed");
      return false;
    }

    // Special handling for step 1 -> step 2: create application on backend
    if (
      currentStep === FORM_STEPS.CLIENT_DETAILS &&
      !currentApplication.backendApplicationId
    ) {
      console.log("🔄 Creating application on backend...");
      try {
        setIsSubmitting(true);

        // Prepare the data in the format expected by the API
        const applicationData = {
          firstName: currentApplication.firstName,
          middleName: currentApplication.middleName || null,
          lastName: currentApplication.lastName,
          rsaPin: currentApplication.rsaPin,
          equityValue: parseFloat(currentApplication.equityValue),
          supplementaryValue: parseFloat(
            currentApplication.supplementaryValue || 0
          ),
          loanAmount: parseFloat(currentApplication.loanAmount),
          propertyValue: parseFloat(currentApplication.propertyValue),
        };

        console.log("📤 Sending application data:", applicationData);

        // Call the API function (it returns the ApplicationDto directly)
        const applicationDto = await apiCreateApplication(applicationData);

        console.log("✅ Backend application created:", applicationDto);

        // Update the current application with the backend data
        setCurrentApplication((prev) => ({
          ...prev,
          backendApplicationId: applicationDto.id,
          status: applicationDto.status || APPLICATION_STATUS.DRAFT,
          applicationNumber: applicationDto.applicationNumber,
        }));

        // Reset backend document count since this is a new application
        setBackendDocumentCount(0);
      } catch (error) {
        console.error("❌ Error creating application:", error);

        let errorMessage = "Failed to create application. Please try again.";

        // Handle different types of API errors
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        setErrors({
          general: errorMessage,
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    }

    // Move to next step
    if (currentStep < TOTAL_STEPS) {
      console.log(`✅ Moving to step ${currentStep + 1}`);
      setCurrentStep(currentStep + 1);
      return true;
    }

    return false;
  }, [currentStep, currentApplication, validateForm]);

  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  }, [currentStep]);

  // FIXED: Form submission with proper API integration
  const submitApplication = useCallback(async () => {
    console.log("🚀 Submitting application...");

    if (!validateForm(FORM_STEPS.CONFIRMATION, true)) {
      console.log("❌ Submission failed - validation errors");
      return { success: false, error: "Please fix validation errors" };
    }

    if (!currentApplication.backendApplicationId) {
      console.log("❌ Submission failed - no backend application ID");
      return { success: false, error: "Application not properly created" };
    }

    try {
      setIsSubmitting(true);

      // The submitApplicationById returns { message: "Application submitted successfully" }
      const result = await submitApplicationById(
        currentApplication.backendApplicationId
      );

      console.log("✅ Submit response:", result);

      if (result && result.message) {
        setCurrentApplication((prev) => ({
          ...prev,
          status: APPLICATION_STATUS.SUBMITTED,
        }));

        return {
          success: true,
          applicationId: currentApplication.backendApplicationId,
          message: "Application submitted successfully",
        };
      } else {
        return {
          success: false,
          error: "Failed to submit application",
        };
      }
    } catch (error) {
      console.error("❌ Submit application error:", error);

      let errorMessage = "Failed to submit application. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [currentApplication, validateForm]);

  // Reset form
  const resetForm = useCallback(() => {
    setCurrentStep(FORM_STEPS.CLIENT_DETAILS);
    setCurrentApplication({
      pmiCompanyId: user?.pmiCompanyId || "",
      pmiCompanyName: user?.pmiCompanyName || "",
      pmiCompanyEmail: user?.pmiEmail || "",
      firstName: "",
      middleName: "",
      lastName: "",
      rsaPin: "",
      equityValue: "",
      supplementaryValue: "",
      loanAmount: "",
      propertyValue: "",
      documents: [],
      backendApplicationId: null,
      applicationNumber: "",
      status: APPLICATION_STATUS.DRAFT,
    });
    setBackendDocumentCount(0); // Reset backend document count
    setErrors({});
    setIsSubmitting(false);
  }, [user]);

  // Computed properties
  const progress = useMemo(() => {
    return ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;
  }, [currentStep]);

  // FIXED: Updated canProceedToNext to check appropriate document source
  const canProceedToNext = useMemo(() => {
    // Just check if there are any validation errors for current step fields
    let requiredFields = [];

    switch (currentStep) {
      case FORM_STEPS.CLIENT_DETAILS:
        requiredFields = [
          "firstName",
          "lastName",
          "rsaPin",
          "equityValue",
          "supplementaryValue",
          "loanAmount",
          "propertyValue",
        ];
        break;
      case FORM_STEPS.UPLOAD_DOCUMENTS:
        // Check appropriate document source
        const hasDocuments = currentApplication.backendApplicationId
          ? backendDocumentCount > 0 // Backend documents
          : currentApplication.documents &&
            currentApplication.documents.length > 0; // Local documents

        return hasDocuments;
      case FORM_STEPS.CONFIRMATION:
        requiredFields = [
          "firstName",
          "lastName",
          "rsaPin",
          "equityValue",
          "supplementaryValue",
          "loanAmount",
          "propertyValue",
        ];

        // Also check documents for confirmation
        const hasConfirmationDocs = currentApplication.backendApplicationId
          ? backendDocumentCount > 0 // Backend documents
          : currentApplication.documents &&
            currentApplication.documents.length > 0; // Local documents

        if (!hasConfirmationDocs) {
          return false;
        }
        break;
    }

    // Quick validation without updating errors
    const hasAllRequiredFields = requiredFields.every((field) => {
      const value = currentApplication[field];
      return value !== "" && value !== null && value !== undefined;
    });

    const hasNoCurrentErrors = requiredFields.every((field) => !errors[field]);

    const result = hasAllRequiredFields && hasNoCurrentErrors;
    console.log(`🔍 Can proceed: ${result}`, {
      step: currentStep,
      hasAllRequiredFields,
      hasNoCurrentErrors,
      requiredFields,
      hasBackendApp: !!currentApplication.backendApplicationId,
      backendDocCount: backendDocumentCount,
      localDocCount: currentApplication.documents?.length || 0,
    });

    return result;
  }, [currentStep, currentApplication, backendDocumentCount, errors]);

  const canGoBack = useMemo(() => {
    return currentStep > 1;
  }, [currentStep]);

  const isLastStep = useMemo(() => {
    return currentStep === TOTAL_STEPS;
  }, [currentStep]);

  // Update PMI info when user changes
  useEffect(() => {
    if (user) {
      setCurrentApplication((prev) => ({
        ...prev,
        pmiCompanyId: user.pmiCompanyId || "",
        pmiCompanyName: user.pmiCompanyName || "",
        pmiCompanyEmail: user.pmiEmail || "",
      }));
    }
  }, [user]);

  const value = {
    // Form state
    currentApplication,
    currentStep,
    errors,
    isSubmitting,

    // Form actions
    updateApplicationField,
    addDocument,
    removeDocument,

    // NEW: Backend document count handler
    handleBackendDocumentCountChange,
    backendDocumentCount,

    // Step navigation
    nextStep,
    previousStep,

    // Form submission
    submitApplication,
    resetForm,

    // Validation
    validateForm,
    validateField,

    // Computed properties
    progress,
    canProceedToNext,
    canGoBack,
    isLastStep,

    // Constants
    FORM_STEPS,
    TOTAL_STEPS,
    APPLICATION_STATUS,
  };

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
};

export default ApplicationProvider;
