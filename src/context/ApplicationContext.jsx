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
  getApplicationById,
  getApplicationDocuments,
} from "../services/application-api";

// Application Status Constants
const APPLICATION_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  RETURNED: "returned",
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
      "useApplication must be used within an ApplicationProvider",
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
    phoneNumber: "",

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
  // Mandatory documents validation
  const [mandatoryDocumentsStatus, setMandatoryDocumentsStatus] = useState({
    uploadedCount: 0,
    totalMandatory: 0,
  });
  // Track client-side resubmitted application IDs for optimistic UI
  const [clientResubmittedIds, setClientResubmittedIds] = useState(() => {
    try {
      const raw = sessionStorage.getItem("mmgt_client_resubmitted_ids");
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  });

  const removeClientResubmittedIds = useCallback((ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    setClientResubmittedIds((prev) => {
      const next = (prev || []).filter((id) => !ids.includes(id));
      try {
        sessionStorage.setItem(
          "mmgt_client_resubmitted_ids",
          JSON.stringify(next),
        );
      } catch (err) {
        console.warn("Could not persist client resubmitted ids:", err);
      }
      return next;
    });
  }, []);

  // Form validation errors
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rsaPinAvailability, setRsaPinAvailability] = useState({
    exists: false,
    checked: false,
    message: "",
    details: null,
  });

  // Validation rules
  const validationRules = {
    firstName: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'’\-.]+$/u,
    },
    lastName: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'’\-.]+$/u,
    },
    middleName: {
      required: false,
      maxLength: 100,
      pattern: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'’\-.]*$/u,
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
  const validateField = useCallback((fieldName, value, appData = null) => {
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

    // Property value validation: must equal equity + loan + supplementary
    if (fieldName === "propertyValue" && appData) {
      const equityValue = parseFloat(appData.equityValue) || 0;
      const loanAmount = parseFloat(appData.loanAmount) || 0;
      const supplementaryValue = parseFloat(appData.supplementaryValue) || 0;
      const propertyValue = parseFloat(value) || 0;

      const expectedSum = equityValue + loanAmount + supplementaryValue;

      // Allow a tiny epsilon to account for floating point rounding
      const epsilon = 0.01;
      if (Math.abs(propertyValue - expectedSum) > epsilon) {
        return `Property Value must equal Equity Value (${equityValue}) + Loan Amount (${loanAmount}) + Supplementary Value (${supplementaryValue}) = ${expectedSum}`;
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
        const error = validateField(field, fieldValue, currentApplication);
        if (error) {
          newErrors[field] = error;
        }
      });

      // Optional middle name validation
      if (currentApplication.middleName) {
        const middleNameError = validateField(
          "middleName",
          currentApplication.middleName,
          currentApplication,
        );
        if (middleNameError) {
          newErrors.middleName = middleNameError;
        }
      }

      const isExistingDraft =
        Boolean(currentApplication.backendApplicationId) &&
        String(currentApplication.status || "").toLowerCase() === "draft";

      if (rsaPinAvailability.exists && !isExistingDraft) {
        newErrors.rsaPin =
          rsaPinAvailability.message ||
          "An active application already exists with this RSA PIN";
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
    [
      currentApplication,
      currentStep,
      backendDocumentCount,
      rsaPinAvailability,
      validateField,
    ],
  );

  // Update application field
  const updateApplicationField = useCallback(
    (field, value) => {
      console.log(`📝 Updating ${field}:`, value);

      setCurrentApplication((prev) => {
        const updated = {
          ...prev,
          [field]: value,
        };

        // If any of the financial fields change, validate property value formula
        if (
          [
            "equityValue",
            "loanAmount",
            "supplementaryValue",
            "propertyValue",
          ].includes(field)
        ) {
          // Validate property value if all financial fields have values
          if (
            updated.equityValue !== "" &&
            updated.loanAmount !== "" &&
            updated.supplementaryValue !== "" &&
            updated.propertyValue !== ""
          ) {
            const error = validateField(
              "propertyValue",
              updated.propertyValue,
              updated,
            );
            setErrors((prev) => {
              if (error) {
                return { ...prev, propertyValue: error };
              } else {
                const newErrors = { ...prev };
                delete newErrors.propertyValue;
                return newErrors;
              }
            });
          } else {
            // Clear error if not all fields are filled yet
            setErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors.propertyValue;
              return newErrors;
            });
          }
        } else if (errors[field]) {
          // Clear error for non-financial fields
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }

        return updated;
      });
    },
    [errors, validateField],
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

  // NEW: Mandatory documents validation handler
  const handleMandatoryDocumentsValidation = useCallback(
    (uploadedCount, totalMandatory) => {
      console.log("📋 Mandatory documents validation:", {
        uploadedCount,
        totalMandatory,
      });
      setMandatoryDocumentsStatus({
        uploadedCount,
        totalMandatory,
      });

      // Clear documents error when all mandatory docs are uploaded
      if (uploadedCount === totalMandatory && totalMandatory > 0) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.documents;
          return newErrors;
        });
      }
    },
    [],
  );

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
          phoneNumber: currentApplication.phoneNumber || null,
          equityValue: parseFloat(currentApplication.equityValue),
          supplementaryValue: parseFloat(
            currentApplication.supplementaryValue || 0,
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
        const apiData = error.response?.data;

        if (apiData) {
          if (typeof apiData === "string") {
            errorMessage = apiData;
          } else if (typeof apiData.message === "string") {
            errorMessage = apiData.message;
          } else {
            errorMessage = JSON.stringify(apiData);
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        if (/an active application already exists/i.test(errorMessage)) {
          setRsaPinAvailability({
            exists: true,
            checked: true,
            message:
              "An active application already exists with this RSA PIN. Please verify the RSA PIN and use a different one.",
            details: null,
          });
          setErrors({
            rsaPin:
              "An active application already exists with this RSA PIN. Please verify the RSA PIN and use a different one.",
          });
          return false;
        }

        const nextErrors = {};
        if (/rsa\s*pin|rsaPin|RSA PIN/i.test(errorMessage)) {
          nextErrors.rsaPin = errorMessage;
        } else {
          nextErrors.general = errorMessage;
        }

        setErrors(nextErrors);
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

    const preStatus = (currentApplication.status || "").toLowerCase();

    try {
      setIsSubmitting(true);

      // The submitApplicationById returns application data or a success message
      const result = await submitApplicationById(
        currentApplication.backendApplicationId,
        { phoneNumber: currentApplication.phoneNumber || null },
      );

      console.log("✅ Submit response:", result);

      setCurrentApplication((prev) => ({
        ...prev,
        status:
          result?.status?.toLowerCase() ||
          result?.applicationStatus?.toLowerCase() ||
          APPLICATION_STATUS.SUBMITTED,
      }));

      if (
        result &&
        (result.message || result.status || result.applicationStatus)
      ) {
        // If this was a resubmission of a rejected/returned app, mark it locally
        if (preStatus === "rejected" || preStatus === "returned") {
          setClientResubmittedIds((prev) => {
            const next = Array.from(
              new Set([
                ...(prev || []),
                currentApplication.backendApplicationId,
              ]),
            );
            try {
              sessionStorage.setItem(
                "mmgt_client_resubmitted_ids",
                JSON.stringify(next),
              );
            } catch (err) {
              console.warn("Could not persist client resubmitted ids:", err);
            }
            return next;
          });
        }

        // Refresh application from backend to pick up any status/history changes
        try {
          if (
            loadBackendApplication &&
            currentApplication?.backendApplicationId
          ) {
            await loadBackendApplication(
              currentApplication.backendApplicationId,
            );
          }
        } catch (err) {
          console.error("Failed to refresh application after submit:", err);
        }

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

      if (/an active application already exists/i.test(errorMessage)) {
        setRsaPinAvailability({
          exists: true,
          checked: true,
          message:
            "An active application already exists with this RSA PIN. Please verify the RSA PIN and use a different one.",
          details: null,
        });
        setErrors({
          rsaPin:
            "An active application already exists with this RSA PIN. Please verify the RSA PIN and use a different one.",
        });
      }

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [currentApplication, validateForm]);

  // Load an existing backend application into the form for editing
  const loadBackendApplication = useCallback(async (applicationId) => {
    if (!applicationId) return false;
    try {
      setIsSubmitting(true);

      const applicationDto = await getApplicationById(applicationId);
      // Fetch documents to determine backendDocumentCount
      let docs = [];
      try {
        docs = await getApplicationDocuments(applicationId);
      } catch (err) {
        console.warn("Could not fetch application documents:", err);
        docs = [];
      }

      // Map DTO fields into currentApplication shape
      setCurrentApplication((prev) => ({
        ...prev,
        backendApplicationId: applicationDto.id,
        applicationNumber: applicationDto.applicationNumber || "",
        status: applicationDto.status || APPLICATION_STATUS.DRAFT,
        firstName: applicationDto.firstName || prev.firstName,
        middleName: applicationDto.middleName || prev.middleName,
        lastName: applicationDto.lastName || prev.lastName,
        rsaPin: applicationDto.rsaPin || prev.rsaPin,
        equityValue:
          applicationDto.equityValue !== undefined
            ? String(applicationDto.equityValue)
            : prev.equityValue,
        supplementaryValue:
          applicationDto.supplementaryValue !== undefined
            ? String(applicationDto.supplementaryValue)
            : prev.supplementaryValue,
        loanAmount:
          applicationDto.loanAmount !== undefined
            ? String(applicationDto.loanAmount)
            : prev.loanAmount,
        propertyValue:
          applicationDto.propertyValue !== undefined
            ? String(applicationDto.propertyValue)
            : prev.propertyValue,
      }));

      setBackendDocumentCount(docs?.length || 0);

      // Move user to the client details step so they can edit
      setCurrentStep(FORM_STEPS.CLIENT_DETAILS);

      return true;
    } catch (error) {
      console.error("Failed to load backend application:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

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
      phoneNumber: "",
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
    setMandatoryDocumentsStatus({ uploadedCount: 0, totalMandatory: 0 }); // Reset mandatory docs status
    setRsaPinAvailability({
      exists: false,
      checked: false,
      message: "",
      details: null,
    });
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
        // Check if all mandatory documents are uploaded
        if (currentApplication.backendApplicationId) {
          // Backend: all mandatory docs must be uploaded
          const allMandatoryUploaded =
            mandatoryDocumentsStatus.totalMandatory > 0 &&
            mandatoryDocumentsStatus.uploadedCount ===
              mandatoryDocumentsStatus.totalMandatory;
          return allMandatoryUploaded;
        } else {
          // Local: check if any documents exist (pre-backend creation)
          return (
            currentApplication.documents &&
            currentApplication.documents.length > 0
          );
        }
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

        // Also check all mandatory documents for confirmation
        if (currentApplication.backendApplicationId) {
          // Backend: all mandatory docs must be uploaded
          const allMandatoryForConfirm =
            mandatoryDocumentsStatus.totalMandatory > 0 &&
            mandatoryDocumentsStatus.uploadedCount ===
              mandatoryDocumentsStatus.totalMandatory;
          if (!allMandatoryForConfirm) {
            return false;
          }
        } else {
          // Local: check if any documents exist
          const hasConfirmationDocs =
            currentApplication.documents &&
            currentApplication.documents.length > 0;
          if (!hasConfirmationDocs) {
            return false;
          }
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
      mandatoryDocumentsStatus,
    });

    return result;
  }, [
    currentStep,
    currentApplication,
    backendDocumentCount,
    errors,
    mandatoryDocumentsStatus,
  ]);

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

    // Client-side resubmission tracking
    clientResubmittedIds,
    isClientResubmitted: (id) => (clientResubmittedIds || []).includes(id),
    removeClientResubmittedIds,

    // Form actions
    updateApplicationField,
    addDocument,
    removeDocument,

    // NEW: Backend document count handler
    handleBackendDocumentCountChange,
    backendDocumentCount,

    // NEW: Mandatory documents validation handler
    handleMandatoryDocumentsValidation,
    mandatoryDocumentsStatus,

    // Step navigation
    nextStep,
    previousStep,

    // Form submission
    submitApplication,
    resetForm,
    // Load existing backend application for edit/resubmit
    loadBackendApplication,

    // Validation
    validateForm,
    validateField,

    // Computed properties
    progress,
    canProceedToNext,
    canGoBack,
    isLastStep,
    rsaPinAvailability,
    setRsaPinAvailability,

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
