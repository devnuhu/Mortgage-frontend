import React, {
  useState,
  useContext,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  FileText,
  User,
  MapPin,
  DollarSign,
  Calendar,
  Building,
  RefreshCw,
  SlidersHorizontal,
  X,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Download,
  Settings,
  Loader2,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import ConfirmModal from "../ui/ConfirmModal";

// Import API functions
import {
  getAllApplications,
  updateApplicationStatus,
  getFilesByApplication,
  downloadFile,
  formatCurrency,
  formatDate,
  getApplicationById,
  searchApplications,
  getReportSummary,
} from "../../services/applicationService"; // Adjust path as needed
import { getApplicationReviewHistory } from "../../services/application-api";

const AdminApplicationManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [pmiFilter, setPmiFilter] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Enhanced search and filter states
  const [searchDebounce, setSearchDebounce] = useState("");
  const [apiSearchTerm, setApiSearchTerm] = useState("");
  const [debouncedApiSearchTerm, setDebouncedApiSearchTerm] = useState("");
  const [apiSearchResults, setApiSearchResults] = useState([]);
  const [apiSearchLoading, setApiSearchLoading] = useState(false);
  const [apiSearchError, setApiSearchError] = useState(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [loanAmountRange, setLoanAmountRange] = useState({ min: "", max: "" });
  const [propertyValueRange, setPropertyValueRange] = useState({
    min: "",
    max: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Documents for selected application
  const [applicationDocuments, setApplicationDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  // Review history for selected applications (cached by applicationId)
  const [reviewHistoryMap, setReviewHistoryMap] = useState({});
  const [reviewHistoryLoading, setReviewHistoryLoading] = useState({});

  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [reportSummary, setReportSummary] = useState(null);
  const [reportSummaryLoading, setReportSummaryLoading] = useState(false);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  // Status configuration - updated to match backend statuses
  const statusConfig = {
    draft: {
      label: "Draft",
      color: "text-gray-700",
      bg: "bg-gray-100",
      icon: Clock,
      badge: "bg-gray-500",
    },
    submitted: {
      label: "Submitted",
      color: "text-blue-700",
      bg: "bg-blue-100",
      icon: AlertTriangle,
      badge: "bg-blue-500",
    },
    under_review: {
      label: "Under Review",
      color: "text-yellow-700",
      bg: "bg-yellow-100",
      icon: AlertTriangle,
      badge: "bg-yellow-500",
    },
    approved: {
      label: "Approved",
      color: "text-green-700",
      bg: "bg-green-100",
      icon: CheckCircle,
      badge: "bg-green-500",
    },
    rejected: {
      label: "Rejected",
      color: "text-red-700",
      bg: "bg-red-100",
      icon: XCircle,
      badge: "bg-red-500",
    },
    returned: {
      label: "Returned",
      color: "text-orange-700",
      bg: "bg-orange-100",
      icon: XCircle,
      badge: "bg-orange-500",
    },
    pending: {
      label: "Pending",
      color: "text-yellow-700",
      bg: "bg-yellow-100",
      icon: Clock,
      badge: "bg-yellow-500",
    },
  };

  // Normalize status keys to avoid case/whitespace mismatches
  const normalizeStatus = (s) => (s || "").toLowerCase().trim();

  const extractApplicationsFromPayload = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (!payload) return [];
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    return [];
  };

  // Map backend data to frontend format
  const mapApplicationData = (backendApp) => {
    return {
      id: backendApp.applicationNumber || backendApp.id,
      applicationId: backendApp.id, // Keep the actual ID for API calls
      borrowerName: `${backendApp.firstName} ${
        backendApp.middleName ? backendApp.middleName + " " : ""
      }${backendApp.lastName}`.trim(),
      pmiCompany: backendApp.companyName || backendApp.pmiCompanyName,
      pmiRepName: backendApp.pmiRepName,
      pmiRepEmail: backendApp.pmiRepEmail,
      rsaPin: backendApp.rsaPin,
      firstName: backendApp.firstName,
      middleName: backendApp.middleName,
      lastName: backendApp.lastName,
      equityValue: backendApp.equityValue,
      supplementaryValue: backendApp.supplementaryValue,
      loanAmount: backendApp.loanAmount,
      propertyValue: backendApp.propertyValue,
      submissionDate: backendApp.submittedAt || backendApp.createdAt,
      lastUpdated: backendApp.updatedAt,
      status: (function (s) {
        if (!s) return s;
        const v = String(s).toLowerCase().trim();
        if (v === "resubmitted") return "returned";
        return v;
      })(backendApp.status),
      documents: [], // Will be populated when needed
      documentCount: backendApp.documentCount || 0,
      rejectionReason: null, // Will be handled through comments
      priority: backendApp.priority,
      createdAt: backendApp.createdAt,
      submittedAt: backendApp.submittedAt,
      userName: backendApp.userName,
      userId: backendApp.userId,
      pmiCompanyId: backendApp.pmiCompanyId,
    };
  };

  // Load applications from API
  const loadApplications = useCallback(
    async (page = pageNumber, showToast = false) => {
      try {
        setIsRefreshing(showToast);
        if (!showToast) setLoading(true);
        setError(null);

        const response = await getAllApplications(page, pageSize);
        const pagePayload = response?.data || response;
        const currentPageApplications = Array.isArray(pagePayload)
          ? pagePayload
          : pagePayload.data || [];

        const mappedApplications =
          currentPageApplications.map(mapApplicationData);

        const calculatedTotalCount =
          pagePayload.totalCount ?? mappedApplications.length;
        const calculatedTotalPages =
          pagePayload.totalPages ??
          Math.max(1, Math.ceil(calculatedTotalCount / pageSize));
        const calculatedHasPreviousPage =
          pagePayload.hasPreviousPage ?? page > 1;
        const calculatedHasNextPage =
          pagePayload.hasNextPage ?? page < calculatedTotalPages;

        setApplications(mappedApplications);
        setTotalCount(calculatedTotalCount);
        setTotalPages(calculatedTotalPages);
        setHasNextPage(calculatedHasNextPage);
        setHasPreviousPage(calculatedHasPreviousPage);
        setLastRefresh(new Date());

        if (showToast) {
          toast.success("Applications refreshed successfully");
        }
      } catch (err) {
        console.error("Failed to load applications:", err);
        setError(err.message || "Failed to load applications");
        toast.error("Failed to load applications");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [pageNumber, pageSize],
  );

  // Load application documents
  const loadApplicationDocuments = useCallback(async (applicationId) => {
    try {
      setDocumentsLoading(true);
      const documents = await getFilesByApplication(applicationId);

      // Map documents to expected format
      const mappedDocs = documents.map((doc) => ({
        name: doc.fileName || doc.originalFileName,
        type: doc.documentType || "Document",
        size: doc.fileSize
          ? `${(doc.fileSize / 1024).toFixed(1)} KB`
          : "Unknown",
        id: doc.id,
        uploadedAt: doc.uploadedAt,
      }));

      setApplicationDocuments(mappedDocs);
    } catch (err) {
      console.error("Failed to load documents:", err);
      toast.error("Failed to load documents");
      setApplicationDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  }, []);

  // Load review history for a specific application (cached)
  const loadReviewHistory = useCallback(
    async (applicationId) => {
      if (!applicationId) return;
      if (reviewHistoryMap[applicationId]) return; // already loaded

      try {
        setReviewHistoryLoading((prev) => ({ ...prev, [applicationId]: true }));
        const history = await getApplicationReviewHistory(applicationId);
        setReviewHistoryMap((prev) => ({
          ...prev,
          [applicationId]: history || [],
        }));
      } catch (err) {
        console.warn("No review history available for app", applicationId, err);
        setReviewHistoryMap((prev) => ({ ...prev, [applicationId]: [] }));
      } finally {
        setReviewHistoryLoading((prev) => ({
          ...prev,
          [applicationId]: false,
        }));
      }
    },
    [reviewHistoryMap],
  );

  // Initial load and page changes
  useEffect(() => {
    loadApplications(pageNumber);
  }, [loadApplications, pageNumber]);

  // Debounced search implementation for local paginated filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Debounced server-side search execution
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedApiSearchTerm(apiSearchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [apiSearchTerm]);

  useEffect(() => {
    if (!debouncedApiSearchTerm.trim()) {
      setApiSearchResults([]);
      setApiSearchError(null);
      setApiSearchLoading(false);
      return;
    }

    let cancelled = false;
    const runSearch = async () => {
      try {
        setApiSearchLoading(true);
        setApiSearchError(null);

        const response = await searchApplications(debouncedApiSearchTerm);
        const payload = response?.data ?? response;
        const searchItems = extractApplicationsFromPayload(payload);
        const results = searchItems.map(mapApplicationData);

        if (!cancelled) {
          setApiSearchResults(results);
        }
      } catch (err) {
        if (!cancelled) {
          setApiSearchError(err.message || "Search failed");
          setApiSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setApiSearchLoading(false);
        }
      }
    };

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [debouncedApiSearchTerm]);

  // Get unique PMI companies for filter
  const pmiCompanies = useMemo(
    () => [...new Set(applications.map((app) => app.pmiCompany))],
    [applications],
  );

  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (searchDebounce.trim()) count++;
    if (apiSearchTerm.trim()) count++;
    if (statusFilter.length > 0) count++;
    if (pmiFilter.length > 0) count++;
    if (dateRange.start || dateRange.end) count++;
    if (loanAmountRange.min || loanAmountRange.max) count++;
    if (propertyValueRange.min || propertyValueRange.max) count++;
    setActiveFiltersCount(count);
  }, [
    searchDebounce,
    apiSearchTerm,
    statusFilter,
    pmiFilter,
    dateRange,
    loanAmountRange,
    propertyValueRange,
  ]);

  // Enhanced filtering logic with memoization
  const filteredApplications = useMemo(() => {
    if (loading) return [];

    return applications
      .filter((app) => {
        // Search filter
        const matchesSearch =
          !searchDebounce.trim() ||
          app.borrowerName
            .toLowerCase()
            .includes(searchDebounce.toLowerCase()) ||
          app.id.toLowerCase().includes(searchDebounce.toLowerCase()) ||
          app.rsaPin.includes(searchDebounce) ||
          app.pmiCompany.toLowerCase().includes(searchDebounce.toLowerCase()) ||
          app.pmiRepName.toLowerCase().includes(searchDebounce.toLowerCase()) ||
          app.pmiRepEmail.toLowerCase().includes(searchDebounce.toLowerCase());

        // Status filter (multiple selection)
        const matchesStatus =
          statusFilter.length === 0 || statusFilter.includes(app.status);

        // PMI filter (multiple selection)
        const matchesPMI =
          pmiFilter.length === 0 || pmiFilter.includes(app.pmiCompany);

        // Date range filter
        const matchesDateRange = (() => {
          if (!dateRange.start && !dateRange.end) return true;
          const submissionDate = new Date(app.submissionDate);
          if (dateRange.start && submissionDate < new Date(dateRange.start))
            return false;
          if (dateRange.end && submissionDate > new Date(dateRange.end))
            return false;
          return true;
        })();

        // Loan amount range filter
        const matchesLoanAmount = (() => {
          if (!loanAmountRange.min && !loanAmountRange.max) return true;
          const loanAmount = app.loanAmount;
          if (loanAmountRange.min && loanAmount < parseInt(loanAmountRange.min))
            return false;
          if (loanAmountRange.max && loanAmount > parseInt(loanAmountRange.max))
            return false;
          return true;
        })();

        // Property value range filter
        const matchesPropertyValue = (() => {
          if (!propertyValueRange.min && !propertyValueRange.max) return true;
          const propertyValue = app.propertyValue;
          if (
            propertyValueRange.min &&
            propertyValue < parseInt(propertyValueRange.min)
          )
            return false;
          if (
            propertyValueRange.max &&
            propertyValue > parseInt(propertyValueRange.max)
          )
            return false;
          return true;
        })();

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPMI &&
          matchesDateRange &&
          matchesLoanAmount &&
          matchesPropertyValue
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.submissionDate) - new Date(a.submissionDate);
          case "oldest":
            return new Date(a.submissionDate) - new Date(b.submissionDate);
          case "amount_high":
            return b.loanAmount - a.loanAmount;
          case "amount_low":
            return a.loanAmount - b.loanAmount;
          case "borrower_name":
            return a.borrowerName.localeCompare(b.borrowerName);
          case "property_high":
            return b.propertyValue - a.propertyValue;
          case "property_low":
            return a.propertyValue - b.propertyValue;
          case "status":
            return a.status.localeCompare(b.status);
          default:
            return 0;
        }
      });
  }, [
    applications,
    loading,
    searchDebounce,
    statusFilter,
    pmiFilter,
    sortBy,
    dateRange,
    loanAmountRange,
    propertyValueRange,
  ]);

  const displayedApplications = apiSearchTerm.trim()
    ? apiSearchResults
    : filteredApplications;

  const summarySearchTerm = apiSearchTerm.trim()
    ? apiSearchTerm.trim()
    : searchDebounce.trim();

  const loadReportSummary = useCallback(async () => {
    try {
      setReportSummaryLoading(true);

      const summaryFilters = {
        dateFrom: dateRange.start || undefined,
        dateTo: dateRange.end || undefined,
        dateField: dateRange.start || dateRange.end ? "SubmittedAt" : undefined,
        statuses: statusFilter.length > 0 ? statusFilter : undefined,
        priorities: undefined,
        pmiCompanyId: undefined,
        userId: undefined,
        searchTerm: summarySearchTerm || undefined,
      };

      const summaryData = await getReportSummary(summaryFilters);
      setReportSummary(summaryData);
    } catch (err) {
      console.error("Error loading application report summary:", err);
      setReportSummary(null);
    } finally {
      setReportSummaryLoading(false);
    }
  }, [dateRange, statusFilter, summarySearchTerm]);

  useEffect(() => {
    loadReportSummary();
  }, [loadReportSummary]);

  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setSearchDebounce("");
    setApiSearchTerm("");
    setDebouncedApiSearchTerm("");
    setApiSearchResults([]);
    setApiSearchError(null);
    setApiSearchLoading(false);
    setStatusFilter([]);
    setPmiFilter([]);
    setDateRange({ start: "", end: "" });
    setLoanAmountRange({ min: "", max: "" });
    setPropertyValueRange({ min: "", max: "" });
    setSortBy("newest");
    toast.success("All filters cleared");
  }, []);

  const clearServerSearch = useCallback(() => {
    setApiSearchTerm("");
    setDebouncedApiSearchTerm("");
    setApiSearchResults([]);
    setApiSearchError(null);
    setApiSearchLoading(false);
  }, []);

  // Refresh data with loading state
  const refreshData = useCallback(async () => {
    await loadApplications(true);
  }, [loadApplications]);

  // Show confirmation before status update
  const confirmStatusUpdate = () => {
    if (!selectedApplication || !newStatus) return;

    const statusLabel = (
      statusConfig[normalizeStatus(newStatus)]?.label || newStatus
    )
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const message =
      newStatus === "rejected"
        ? `Are you sure you want to reject this application?${
            rejectionReason ? ` Reason: ${rejectionReason}` : ""
          }`
        : `Are you sure you want to change the status to "${statusLabel}"?`;

    setConfirmData({
      appNumber: selectedApplication.applicationNumber,
      newStatus,
      rejectionReason,
    });
    setConfirmAction("updateStatus");
    setShowConfirmModal(true);
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedApplication || !newStatus) return;

    const toastId = toast.loading("Updating application status...");
    setIsLoading(true);

    try {
      const statusUpdate = {
        status: newStatus,
        comments: newStatus === "rejected" ? rejectionReason : undefined,
      };

      const updatedApp = await updateApplicationStatus(
        selectedApplication.applicationId,
        statusUpdate,
      );

      // Update local state with optimistic update
      const mappedUpdatedApp = mapApplicationData(updatedApp);

      setApplications((prev) =>
        prev.map((app) =>
          app.applicationId === selectedApplication.applicationId
            ? mappedUpdatedApp
            : app,
        ),
      );

      // Update selected application if details modal is open
      if (showDetailsModal) {
        setSelectedApplication(mappedUpdatedApp);
      }

      setShowStatusModal(false);
      setNewStatus("");
      setRejectionReason("");

      toast.success("Application status updated successfully", { id: toastId });
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error(err.message || "Failed to update application status", {
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle multiple status selection
  const handleStatusFilterChange = (status) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  // Handle multiple PMI selection
  const handlePMIFilterChange = (pmi) => {
    setPmiFilter((prev) =>
      prev.includes(pmi) ? prev.filter((p) => p !== pmi) : [...prev, pmi],
    );
  };

  // Handle document download
  const handleDocumentDownload = async (documentId, fileName) => {
    const toastId = toast.loading(`Downloading ${fileName}...`);

    try {
      await downloadFile(documentId, fileName);
      toast.success(`${fileName} downloaded successfully`, { id: toastId });
    } catch (err) {
      console.error("Download failed:", err);
      toast.error(`Failed to download ${fileName}`, { id: toastId });
    }
  };

  // Handle view application details
  const handleViewDetails = async (application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);

    // Load documents for this application
    if (application.applicationId) {
      // load documents and review history in parallel
      await Promise.all([
        loadApplicationDocuments(application.applicationId),
        loadReviewHistory(application.applicationId),
      ]);
    }
  };

  // Get summary statistics
  const summaryStats = useMemo(() => {
    if (loading) {
      return {
        total: 0,
        pending: 0,
        underReview: 0,
        approved: 0,
        rejected: 0,
        submitted: 0,
      };
    }

    const total = filteredApplications.length;
    const pending = filteredApplications.filter(
      (app) => app.status === "pending",
    ).length;
    const underReview = filteredApplications.filter(
      (app) => app.status === "under_review",
    ).length;
    const approved = filteredApplications.filter(
      (app) => app.status === "approved",
    ).length;
    const rejected = filteredApplications.filter(
      (app) => app.status === "rejected",
    ).length;
    const submitted = filteredApplications.filter(
      (app) => app.status === "submitted",
    ).length;

    return {
      total,
      pending,
      underReview,
      approved,
      rejected,
      submitted,
    };
  }, [filteredApplications, loading]);

  const adminSummaryStats = useMemo(() => {
    const report = reportSummary;
    const fallback = summaryStats;

    return {
      total:
        report?.totalRecords ??
        report?.totalCount ??
        report?.total ??
        fallback.total,
      submitted:
        report?.submittedCount ?? report?.submitted ?? fallback.submitted,
      pending: report?.pendingCount ?? report?.pending ?? fallback.pending,
      underReview:
        report?.underReviewCount ?? report?.underReview ?? fallback.underReview,
      approved: report?.approvedCount ?? report?.approved ?? fallback.approved,
      rejected: report?.rejectedCount ?? report?.rejected ?? fallback.rejected,
    };
  }, [reportSummary, summaryStats]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#A8C045] mx-auto mb-4" />
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !applications.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to Load Applications
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadApplications()}
            className="px-4 py-2 bg-[#A8C045] text-white rounded-lg hover:bg-[#8fa838] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-3 sm:px-4 lg:px-6 py-8 space-y-6">
      {/* Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#333",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
          },
          success: {
            style: {
              border: "1px solid #8DC63F",
            },
          },
          error: {
            style: {
              border: "1px solid #ef4444",
            },
          },
        }}
      />

      {/* Enhanced Header with Statistics */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Application Management
            </h1>
            <p className="text-slate-600 mt-1 max-w-2xl">
              Review and manage mortgage applications with enterprise-grade
              filters and reporting.
            </p>
            <div className="flex items-center mt-3 text-sm text-slate-500 gap-2">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center px-4 py-2 text-slate-700 bg-slate-100 rounded-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
            <div className="text-right">
              <p className="text-sm text-slate-500">Showing Results</p>
              <p className="text-3xl font-semibold text-[#8DC63F]">
                {filteredApplications.length} / {applications.length}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-sm p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-xl font-semibold text-slate-900">
                  {adminSummaryStats.total}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-sm p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#003883]" />
              <div>
                <p className="text-sm text-slate-500">Submitted</p>
                <p className="text-xl font-semibold text-[#003883]">
                  {adminSummaryStats.submitted}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-sm p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#FF8200]" />
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-xl font-semibold text-[#FF8200]">
                  {adminSummaryStats.pending}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-sm p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#FF8200]" />
              <div>
                <p className="text-sm text-slate-500">Under Review</p>
                <p className="text-xl font-semibold text-[#FF8200]">
                  {adminSummaryStats.underReview}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-sm p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[#8DC63F]" />
              <div>
                <p className="text-sm text-slate-500">Approved</p>
                <p className="text-xl font-semibold text-[#8DC63F]">
                  {adminSummaryStats.approved}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-sm p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-slate-500">Rejected</p>
                <p className="text-xl font-semibold text-red-600">
                  {adminSummaryStats.rejected}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Server-side search input */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search server-side by name, ID, RSA PIN, PMI company, or representative..."
              value={apiSearchTerm}
              onChange={(e) => setApiSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-slate-300 bg-slate-50 rounded-sm focus:ring-2 focus:ring-[#8DC63F] focus:border-transparent"
            />
            {apiSearchTerm && (
              <button
                type="button"
                onClick={clearServerSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-slate-600">
            {apiSearchLoading ? (
              <span>Searching server...</span>
            ) : apiSearchError ? (
              <span className="text-red-600">{apiSearchError}</span>
            ) : apiSearchTerm.trim() ? (
              <span>
                {apiSearchResults.length} result
                {apiSearchResults.length === 1 ? "" : "s"}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <label htmlFor="sortBy" className="text-slate-500">
                  Sort:
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8DC63F]"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            )}
            {apiSearchTerm.trim() && (
              <button
                type="button"
                onClick={clearServerSearch}
                className="text-[#003883] hover:text-[#002d70]"
              >
                Clear server search
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Applications List with Enhanced Display */}
      {displayedApplications.length === 0 ? (
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-12 text-center">
          <div className="flex flex-col items-center">
            {apiSearchTerm.trim() || activeFiltersCount > 0 ? (
              <>
                <Search className="mx-auto w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {apiSearchTerm.trim()
                    ? `No server-side results found for "${apiSearchTerm}"`
                    : "No Applications Match Your Filters"}
                </h3>
                <p className="text-slate-500 mb-4">
                  {apiSearchTerm.trim()
                    ? "Try a different query or clear the server search."
                    : "Try adjusting your search criteria or clearing some filters."}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  {apiSearchTerm.trim() ? (
                    <button
                      onClick={clearServerSearch}
                      className="px-4 py-2 bg-[#8DC63F] text-white rounded-sm hover:bg-[#79b334] transition-colors"
                    >
                      Clear Server Search
                    </button>
                  ) : (
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 bg-[#8DC63F] text-white rounded-sm hover:bg-[#79b334] transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <FileText className="mx-auto w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No Applications Found
                </h3>
                <p className="text-slate-500">
                  No mortgage applications have been submitted yet.
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {displayedApplications.map((application) => (
              <div
                key={application.applicationId}
                className="bg-white rounded-sm shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200 hover:border-slate-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.borrowerName}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              statusConfig[normalizeStatus(application.status)]
                                ?.bg || statusConfig.pending.bg
                            } ${
                              statusConfig[normalizeStatus(application.status)]
                                ?.color || statusConfig.pending.color
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                statusConfig[
                                  normalizeStatus(application.status)
                                ]?.badge || statusConfig.pending.badge
                              } mr-1`}
                            ></span>
                            {statusConfig[normalizeStatus(application.status)]
                              ?.label || "Unknown"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm text-gray-600">
                          <p>
                            Application ID:{" "}
                            <span className="font-medium">
                              {application.id}
                            </span>
                          </p>
                          <p>
                            RSA PIN:{" "}
                            <span className="font-medium">
                              {application.rsaPin}
                            </span>
                          </p>
                          <p>
                            PMI Company:{" "}
                            <span className="font-medium">
                              {application.pmiCompany}
                            </span>
                          </p>
                          <p>
                            Representative:{" "}
                            <span className="font-medium">
                              {application.pmiRepName}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-slate-50 rounded-sm p-3">
                        <div className="flex items-center mb-1">
                          <p className="text-xs text-slate-500">Loan Amount</p>
                        </div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {formatCurrency(application.loanAmount)}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-sm p-3">
                        <div className="flex items-center mb-1">
                          <MapPin className="w-4 h-4 text-slate-500 mr-1" />
                          <p className="text-xs text-slate-500">
                            Property Value
                          </p>
                        </div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {formatCurrency(application.propertyValue)}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-sm p-3">
                        <div className="flex items-center mb-1">
                          <Calendar className="w-4 h-4 text-slate-500 mr-1" />
                          <p className="text-xs text-slate-500">Submitted</p>
                        </div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {formatDate(application.submissionDate)}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-sm p-3">
                        <div className="flex items-center mb-1">
                          <FileText className="w-4 h-4 text-slate-500 mr-1" />
                          <p className="text-xs text-slate-500">Documents</p>
                        </div>
                        <p className="font-semibold text-slate-900 text-sm"></p>
                      </div>
                    </div>

                    {/* Enhanced Progress Bar for LTV Ratio */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">
                          Loan-to-Value Ratio
                        </span>
                        <span className="text-xs font-medium text-gray-700">
                          {(
                            (application.loanAmount /
                              application.propertyValue) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#A8C045] h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              (application.loanAmount /
                                application.propertyValue) *
                                100,
                              100,
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {application.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start">
                          <XCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-800 mb-1">
                              Application Rejected
                            </p>
                            <p className="text-sm text-red-700">
                              {application.rejectionReason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {application.status !== "draft" && (
                    <div className="flex flex-col space-y-2 ml-6">
                      <button
                        onClick={() => handleViewDetails(application)}
                        className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-sm hover:bg-slate-200 transition-colors whitespace-nowrap"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          setSelectedApplication(application);
                          setNewStatus(application.status);
                          setShowStatusModal(true);
                        }}
                        className="flex items-center px-4 py-2 bg-[#003883] text-white rounded-sm hover:bg-[#002d70] transition-colors whitespace-nowrap"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Update Status
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {!apiSearchTerm.trim() && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-sm px-4 py-3">
              <p className="text-sm text-slate-600">
                Page {pageNumber} of {totalPages} — {totalCount} total
                applications
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  disabled={!hasPreviousPage}
                  className="px-3 py-2 rounded-sm border text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border-slate-300 hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPageNumber(Math.min(totalPages, pageNumber + 1))
                  }
                  disabled={!hasNextPage}
                  className="px-3 py-2 rounded-sm border text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border-slate-300 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Enhanced Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Application Details
                  </h2>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      statusConfig[normalizeStatus(selectedApplication.status)]
                        ?.bg || statusConfig.pending.bg
                    } ${
                      statusConfig[normalizeStatus(selectedApplication.status)]
                        ?.color || statusConfig.pending.color
                    }`}
                  >
                    {React.createElement(
                      statusConfig[normalizeStatus(selectedApplication.status)]
                        ?.icon || Clock,
                      { className: "w-4 h-4 mr-2" },
                    )}
                    {statusConfig[normalizeStatus(selectedApplication.status)]
                      ?.label || "Unknown"}
                  </span>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 min-h-0">
              <div className="p-6">
                {/* Quick Stats Bar */}
                <div className="grid grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Loan Amount</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(selectedApplication.loanAmount)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Property Value</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(selectedApplication.propertyValue)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">LTV Ratio</p>
                    <p className="text-lg font-bold text-gray-900">
                      {(
                        (selectedApplication.loanAmount /
                          selectedApplication.propertyValue) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Days Since Submission
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {Math.floor(
                        (new Date() -
                          new Date(selectedApplication.submissionDate)) /
                          (1000 * 60 * 60 * 24),
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Borrower Information */}
                  <div className="space-y-6">
                    <div className="flex items-center mb-4">
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Borrower Information
                      </h3>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Application ID
                          </p>
                          <p className="font-medium">
                            {selectedApplication.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">RSA PIN</p>
                          <p className="font-medium font-mono">
                            {selectedApplication.rsaPin}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">First Name</p>
                          <p className="font-medium">
                            {selectedApplication.firstName}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Middle Name</p>
                          <p className="font-medium">
                            {selectedApplication.middleName || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Last Name</p>
                          <p className="font-medium">
                            {selectedApplication.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="font-medium">
                            {selectedApplication.borrowerName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PMI Information */}
                  <div className="space-y-6">
                    <div className="flex items-center mb-4">
                      <Building className="w-5 h-5 text-gray-400 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        PMI Company Information
                      </h3>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">PMI Company</p>
                          <p className="font-medium">
                            {selectedApplication.pmiCompany}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Representative Name
                          </p>
                          <p className="font-medium">
                            {selectedApplication.pmiRepName}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Representative Email
                          </p>
                          <p className="font-medium text-blue-600">
                            {selectedApplication.pmiRepEmail}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="space-y-6">
                    <div className="flex items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Financial Details
                      </h3>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Loan Amount</p>
                          <p className="font-medium text-lg text-green-600">
                            {formatCurrency(selectedApplication.loanAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Property Value
                          </p>
                          <p className="font-medium text-lg text-blue-600">
                            {formatCurrency(selectedApplication.propertyValue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Equity Value</p>
                          <p className="font-medium">
                            {formatCurrency(selectedApplication.equityValue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Supplementary Value
                          </p>
                          <p className="font-medium">
                            {formatCurrency(
                              selectedApplication.supplementaryValue,
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Financial Ratios */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              Loan-to-Value Ratio
                            </p>
                            <p className="font-bold text-lg">
                              {(
                                (selectedApplication.loanAmount /
                                  selectedApplication.propertyValue) *
                                100
                              ).toFixed(1)}
                              %
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-[#A8C045] h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    (selectedApplication.loanAmount /
                                      selectedApplication.propertyValue) *
                                      100,
                                    100,
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Equity Ratio
                            </p>
                            <p className="font-bold text-lg">
                              {(
                                (selectedApplication.equityValue /
                                  selectedApplication.loanAmount) *
                                100
                              ).toFixed(1)}
                              %
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Information */}
                  <div className="space-y-6">
                    <div className="flex items-center mb-4">
                      <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Timeline & Status
                      </h3>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Created Date</p>
                          <p className="font-medium">
                            {formatDate(selectedApplication.createdAt)}
                          </p>
                        </div>
                        {selectedApplication.submittedAt && (
                          <div>
                            <p className="text-sm text-gray-500">
                              Submission Date
                            </p>
                            <p className="font-medium">
                              {formatDate(selectedApplication.submittedAt)}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-500">Last Updated</p>
                          <p className="font-medium">
                            {formatDate(selectedApplication.lastUpdated)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Processing Time
                          </p>
                          <p className="font-medium">
                            {Math.floor(
                              (new Date() -
                                new Date(selectedApplication.submissionDate)) /
                                (1000 * 60 * 60 * 24),
                            )}{" "}
                            days
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review History Section */}
                <div className="mt-8">
                  <div className="flex items-center mb-6">
                    <Clock className="w-5 h-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Review History
                    </h3>
                  </div>

                  {reviewHistoryLoading[selectedApplication.applicationId] ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-[#A8C045] mr-2" />
                      <span className="text-gray-600">
                        Loading review history...
                      </span>
                    </div>
                  ) : (
                      reviewHistoryMap[selectedApplication.applicationId] || []
                    ).length > 0 ? (
                    <div className="space-y-4">
                      {(
                        reviewHistoryMap[selectedApplication.applicationId] ||
                        []
                      ).map((review) => (
                        <div
                          key={review.id || review.createdAt}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  statusConfig[normalizeStatus(review.status)]
                                    ?.bg || statusConfig.pending.bg
                                } ${
                                  statusConfig[normalizeStatus(review.status)]
                                    ?.color || statusConfig.pending.color
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    statusConfig[normalizeStatus(review.status)]
                                      ?.badge || statusConfig.pending.badge
                                  } mr-1`}
                                ></span>
                                {statusConfig[normalizeStatus(review.status)]
                                  ?.label || review.status}
                              </span>
                              <span className="text-sm text-gray-500">
                                by{" "}
                                {review.reviewedByName ||
                                  review.performedByName ||
                                  "-"}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          {review.comments && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                                {review.comments}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>No review history available</p>
                    </div>
                  )}
                </div>

                {/* Documents Section */}
                <div className="mt-8">
                  <div className="flex items-center mb-6">
                    <FileText className="w-5 h-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Uploaded Documents
                    </h3>
                    <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      {documentsLoading
                        ? "Loading..."
                        : `${applicationDocuments.length} files`}
                    </span>
                  </div>

                  {documentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-[#A8C045]" />
                      <span className="ml-2 text-gray-600">
                        Loading documents...
                      </span>
                    </div>
                  ) : applicationDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {applicationDocuments.map((doc, index) => (
                        <div
                          key={doc.id || index}
                          className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <FileText className="w-8 h-8 text-red-500" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {doc.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {doc.type}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {doc.size}
                                </p>
                                {doc.uploadedAt && (
                                  <p className="text-xs text-gray-400">
                                    Uploaded: {formatDate(doc.uploadedAt)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  handleDocumentDownload(doc.id, doc.name)
                                }
                                className="text-[#A8C045] hover:text-[#8fa838] font-medium text-sm transition-colors p-1"
                                title="Download document"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No documents uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setNewStatus(selectedApplication.status);
                      setShowStatusModal(true);
                    }}
                    className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                    style={{ backgroundColor: "#A8C045" }}
                  >
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Status Update Modal */}
      {showStatusModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">
                Update Application Status
              </h2>
            </div>

            <div className="p-6">
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Application ID:</p>
                <p className="font-medium text-gray-900">
                  {selectedApplication.id}
                </p>
                <p className="text-sm text-gray-600 mt-2 mb-1">Borrower:</p>
                <p className="font-medium text-gray-900">
                  {selectedApplication.borrowerName}
                </p>
                <p className="text-sm text-gray-600 mt-2 mb-1">
                  Current Status:
                </p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    statusConfig[normalizeStatus(selectedApplication.status)]
                      ?.bg || statusConfig.pending.bg
                  } ${
                    statusConfig[normalizeStatus(selectedApplication.status)]
                      ?.color || statusConfig.pending.color
                  }`}
                >
                  {React.createElement(
                    statusConfig[normalizeStatus(selectedApplication.status)]
                      ?.icon || Clock,
                    { className: "w-3 h-3 mr-1" },
                  )}
                  {statusConfig[normalizeStatus(selectedApplication.status)]
                    ?.label || "Unknown"}
                </span>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  New Status
                </label>
                <div className="space-y-2">
                  {Object.entries(statusConfig)
                    .filter(
                      ([status]) => status !== "draft" && status !== "returned",
                    ) // Hide draft and returned status for admin updates
                    .map(([status, config]) => (
                      <label key={status} className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value={status}
                          checked={newStatus === status}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="mr-3 text-[#A8C045] focus:ring-[#A8C045]"
                        />
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
                        >
                          {React.createElement(config.icon, {
                            className: "w-3 h-3 mr-1",
                          })}
                          {config.label}
                        </span>
                      </label>
                    ))}
                </div>
              </div>

              {newStatus === "rejected" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments/Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent"
                    placeholder="Please provide a detailed reason for rejection. This will be shared with the PMI company."
                  />
                  {rejectionReason.trim() && (
                    <p className="mt-1 text-sm text-gray-500">
                      Character count: {rejectionReason.length}
                    </p>
                  )}
                </div>
              )}

              {newStatus &&
                newStatus !== "rejected" &&
                newStatus !== selectedApplication.status && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments (Optional)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent"
                      placeholder="Add any comments about this status change..."
                    />
                  </div>
                )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setNewStatus("");
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusUpdate}
                  disabled={
                    isLoading ||
                    !newStatus ||
                    newStatus === selectedApplication.status ||
                    (newStatus === "rejected" && !rejectionReason.trim())
                  }
                  className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  style={{ backgroundColor: "#A8C045" }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Update Status
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Status Update */}
      <ConfirmModal
        isOpen={showConfirmModal && confirmAction === "updateStatus"}
        title="Confirm Status Update"
        message={
          confirmData?.newStatus === "rejected"
            ? `Are you sure you want to reject this application (${confirmData?.appNumber})? This action cannot be undone.`
            : `Are you sure you want to update the status to "${(
                statusConfig[normalizeStatus(confirmData?.newStatus)]?.label ||
                confirmData?.newStatus ||
                ""
              )
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}" for application ${
                confirmData?.appNumber || "-"
              }?`
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        loading={isLoading}
        onConfirm={() => {
          setShowConfirmModal(false);
          handleStatusUpdate();
        }}
        onCancel={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
          setConfirmData(null);
        }}
      />
    </div>
  );
};

export default AdminApplicationManagement;
