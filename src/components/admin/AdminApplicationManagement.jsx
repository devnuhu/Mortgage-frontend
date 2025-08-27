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

// Import API functions
import {
  getAllApplications,
  updateApplicationStatus,
  getFilesByApplication,
  downloadFile,
  formatCurrency,
  formatDate,
  getApplicationById,
} from "../../services/applicationService"; // Adjust path as needed

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

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

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
    pending: {
      label: "Pending",
      color: "text-yellow-700",
      bg: "bg-yellow-100",
      icon: Clock,
      badge: "bg-yellow-500",
    },
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
      status: backendApp.status.toLowerCase(),
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
  const loadApplications = useCallback(async (showToast = false) => {
    try {
      setIsRefreshing(showToast);
      if (!showToast) setLoading(true);
      setError(null);

      const response = await getAllApplications();
      const mappedApplications = response.map(mapApplicationData);

      setApplications(mappedApplications);
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
  }, []);

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

  // Initial load
  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadApplications(false); // Silent refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loadApplications]);

  // Debounced search implementation
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Get unique PMI companies for filter
  const pmiCompanies = useMemo(
    () => [...new Set(applications.map((app) => app.pmiCompany))],
    [applications]
  );

  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (searchDebounce.trim()) count++;
    if (statusFilter.length > 0) count++;
    if (pmiFilter.length > 0) count++;
    if (dateRange.start || dateRange.end) count++;
    if (loanAmountRange.min || loanAmountRange.max) count++;
    if (propertyValueRange.min || propertyValueRange.max) count++;
    setActiveFiltersCount(count);
  }, [
    searchDebounce,
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

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setSearchDebounce("");
    setStatusFilter([]);
    setPmiFilter([]);
    setDateRange({ start: "", end: "" });
    setLoanAmountRange({ min: "", max: "" });
    setPropertyValueRange({ min: "", max: "" });
    setSortBy("newest");
    toast.success("All filters cleared");
  }, []);

  // Refresh data with loading state
  const refreshData = useCallback(async () => {
    await loadApplications(true);
  }, [loadApplications]);

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
        statusUpdate
      );

      // Update local state with optimistic update
      const mappedUpdatedApp = mapApplicationData(updatedApp);

      setApplications((prev) =>
        prev.map((app) =>
          app.applicationId === selectedApplication.applicationId
            ? mappedUpdatedApp
            : app
        )
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
        : [...prev, status]
    );
  };

  // Handle multiple PMI selection
  const handlePMIFilterChange = (pmi) => {
    setPmiFilter((prev) =>
      prev.includes(pmi) ? prev.filter((p) => p !== pmi) : [...prev, pmi]
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
      await loadApplicationDocuments(application.applicationId);
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
        draft: 0,
      };
    }

    const total = filteredApplications.length;
    const pending = filteredApplications.filter(
      (app) => app.status === "pending"
    ).length;
    const underReview = filteredApplications.filter(
      (app) => app.status === "under_review"
    ).length;
    const approved = filteredApplications.filter(
      (app) => app.status === "approved"
    ).length;
    const rejected = filteredApplications.filter(
      (app) => app.status === "rejected"
    ).length;
    const submitted = filteredApplications.filter(
      (app) => app.status === "submitted"
    ).length;
    const draft = filteredApplications.filter(
      (app) => app.status === "draft"
    ).length;

    return {
      total,
      pending,
      underReview,
      approved,
      rejected,
      submitted,
      draft,
    };
  }, [filteredApplications, loading]);

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
    <div className="space-y-6">
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
              border: "1px solid #A8C045",
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Application Management
            </h1>
            <p className="text-gray-600 mt-1">
              Review and manage mortgage applications from all PMI companies
            </p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              Last updated: {lastRefresh.toLocaleTimeString()}
              {autoRefresh && (
                <span className="ml-2 text-green-600">
                  • Auto-refresh enabled
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-2 rounded border-gray-300 text-[#A8C045] focus:ring-[#A8C045]"
                />
                Auto-refresh
              </label>
            </div>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
            <div className="text-right">
              <p className="text-sm text-gray-500">Showing Results</p>
              <p className="text-2xl font-bold" style={{ color: "#A8C045" }}>
                {filteredApplications.length} / {applications.length}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-gray-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">
                  {summaryStats.total}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Draft</p>
                <p className="text-xl font-bold text-gray-700">
                  {summaryStats.draft}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-600">Submitted</p>
                <p className="text-xl font-bold text-blue-700">
                  {summaryStats.submitted}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm text-yellow-600">Pending</p>
                <p className="text-xl font-bold text-yellow-700">
                  {summaryStats.pending}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm text-yellow-600">Under Review</p>
                <p className="text-xl font-bold text-yellow-700">
                  {summaryStats.underReview}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-green-600">Approved</p>
                <p className="text-xl font-bold text-green-700">
                  {summaryStats.approved}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm text-red-600">Rejected</p>
                <p className="text-xl font-bold text-red-700">
                  {summaryStats.rejected}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Controls */}
        <div className="space-y-4">
          {/* Primary Search and Controls Row */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, ID, RSA PIN, PMI company, or representative..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle and Sort */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-3 rounded-lg border transition-colors relative ${
                  showFilters
                    ? "bg-[#A8C045] text-white border-[#A8C045]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent appearance-none bg-white pr-10 min-w-[160px]"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount_high">Loan Amount ↓</option>
                  <option value="amount_low">Loan Amount ↑</option>
                  <option value="property_high">Property Value ↓</option>
                  <option value="property_low">Property Value ↑</option>
                  <option value="borrower_name">Borrower Name</option>
                  <option value="status">Status</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Advanced Filters
                </h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Application Status
                  </label>
                  <div className="space-y-2">
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <label key={status} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={statusFilter.includes(status)}
                          onChange={() => handleStatusFilterChange(status)}
                          className="rounded border-gray-300 text-[#A8C045] focus:ring-[#A8C045] mr-2"
                        />
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${config.badge} mr-1`}
                          ></span>
                          {config.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* PMI Company Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    PMI Companies
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {pmiCompanies.map((pmi) => (
                      <label key={pmi} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={pmiFilter.includes(pmi)}
                          onChange={() => handlePMIFilterChange(pmi)}
                          className="rounded border-gray-300 text-[#A8C045] focus:ring-[#A8C045] mr-2"
                        />
                        <span
                          className="text-sm text-gray-700 truncate"
                          title={pmi}
                        >
                          {pmi}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Submission Date Range
                  </label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          start: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent"
                      placeholder="Start date"
                    />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          end: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent"
                      placeholder="End date"
                    />
                  </div>
                </div>

                {/* Loan Amount Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Loan Amount Range (₦)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      value={loanAmountRange.min}
                      onChange={(e) =>
                        setLoanAmountRange((prev) => ({
                          ...prev,
                          min: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent"
                      placeholder="Minimum amount"
                    />
                    <input
                      type="number"
                      value={loanAmountRange.max}
                      onChange={(e) =>
                        setLoanAmountRange((prev) => ({
                          ...prev,
                          max: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent"
                      placeholder="Maximum amount"
                    />
                  </div>
                </div>

                {/* Property Value Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Property Value Range (₦)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      value={propertyValueRange.min}
                      onChange={(e) =>
                        setPropertyValueRange((prev) => ({
                          ...prev,
                          min: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent"
                      placeholder="Minimum value"
                    />
                    <input
                      type="number"
                      value={propertyValueRange.max}
                      onChange={(e) =>
                        setPropertyValueRange((prev) => ({
                          ...prev,
                          max: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A8C045] focus:border-transparent"
                      placeholder="Maximum value"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Active Filters:
              </span>

              {searchDebounce && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: "{searchDebounce}"
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {statusFilter.length > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Status: {statusFilter.length} selected
                  <button
                    onClick={() => setStatusFilter([])}
                    className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {pmiFilter.length > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  PMI: {pmiFilter.length} selected
                  <button
                    onClick={() => setPmiFilter([])}
                    className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {(dateRange.start || dateRange.end) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Date Range
                  <button
                    onClick={() => setDateRange({ start: "", end: "" })}
                    className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {(loanAmountRange.min || loanAmountRange.max) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Loan Range
                  <button
                    onClick={() => setLoanAmountRange({ min: "", max: "" })}
                    className="ml-1 hover:bg-indigo-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {(propertyValueRange.min || propertyValueRange.max) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                  Property Range
                  <button
                    onClick={() => setPropertyValueRange({ min: "", max: "" })}
                    className="ml-1 hover:bg-pink-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Applications List with Enhanced Display */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center">
            {searchDebounce || activeFiltersCount > 0 ? (
              <>
                <Search className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Applications Match Your Filters
                </h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your search criteria or clearing some filters.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-[#A8C045] text-white rounded-lg hover:bg-[#8fa838] transition-colors"
                >
                  Clear All Filters
                </button>
              </>
            ) : (
              <>
                <FileText className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Applications Found
                </h3>
                <p className="text-gray-500">
                  No mortgage applications have been submitted yet.
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredApplications.map((application) => (
            <div
              key={application.applicationId}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-gray-300"
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
                            statusConfig[application.status]?.bg ||
                            statusConfig.pending.bg
                          } ${
                            statusConfig[application.status]?.color ||
                            statusConfig.pending.color
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              statusConfig[application.status]?.badge ||
                              statusConfig.pending.badge
                            } mr-1`}
                          ></span>
                          {statusConfig[application.status]?.label || "Unknown"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm text-gray-600">
                        <p>
                          Application ID:{" "}
                          <span className="font-medium">{application.id}</span>
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
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center mb-1">
                        <p className="text-xs text-gray-500">Loan Amount</p>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {formatCurrency(application.loanAmount)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center mb-1">
                        <MapPin className="w-4 h-4 text-gray-500 mr-1" />
                        <p className="text-xs text-gray-500">Property Value</p>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {formatCurrency(application.propertyValue)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center mb-1">
                        <Calendar className="w-4 h-4 text-gray-500 mr-1" />
                        <p className="text-xs text-gray-500">Submitted</p>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {formatDate(application.submissionDate)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center mb-1">
                        <FileText className="w-4 h-4 text-gray-500 mr-1" />
                        <p className="text-xs text-gray-500">Documents</p>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {application.documentCount} files
                      </p>
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
                          (application.loanAmount / application.propertyValue) *
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
                            100
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

                <div className="flex flex-col space-y-2 ml-6">
                  <button
                    onClick={() => handleViewDetails(application)}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
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
                    className="flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors whitespace-nowrap"
                    style={{ backgroundColor: "#A8C045" }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Application Details
                  </h2>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      statusConfig[selectedApplication.status]?.bg ||
                      statusConfig.pending.bg
                    } ${
                      statusConfig[selectedApplication.status]?.color ||
                      statusConfig.pending.color
                    }`}
                  >
                    {React.createElement(
                      statusConfig[selectedApplication.status]?.icon || Clock,
                      { className: "w-4 h-4 mr-2" }
                    )}
                    {statusConfig[selectedApplication.status]?.label ||
                      "Unknown"}
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
                  <p className="text-sm text-gray-500">Days Since Submission</p>
                  <p className="text-lg font-bold text-gray-900">
                    {Math.floor(
                      (new Date() -
                        new Date(selectedApplication.submissionDate)) /
                        (1000 * 60 * 60 * 24)
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
                        <p className="text-sm text-gray-500">Application ID</p>
                        <p className="font-medium">{selectedApplication.id}</p>
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
                        <p className="text-sm text-gray-500">Property Value</p>
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
                            selectedApplication.supplementaryValue
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
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Equity Ratio</p>
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
                        <p className="text-sm text-gray-500">Processing Time</p>
                        <p className="font-medium">
                          {Math.floor(
                            (new Date() -
                              new Date(selectedApplication.submissionDate)) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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

              {/* Action Buttons */}
              <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
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
                    statusConfig[selectedApplication.status]?.bg ||
                    statusConfig.pending.bg
                  } ${
                    statusConfig[selectedApplication.status]?.color ||
                    statusConfig.pending.color
                  }`}
                >
                  {React.createElement(
                    statusConfig[selectedApplication.status]?.icon || Clock,
                    { className: "w-3 h-3 mr-1" }
                  )}
                  {statusConfig[selectedApplication.status]?.label || "Unknown"}
                </span>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  New Status
                </label>
                <div className="space-y-2">
                  {Object.entries(statusConfig)
                    .filter(([status]) => status !== "draft") // Hide draft status for admin updates
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
                  onClick={handleStatusUpdate}
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
    </div>
  );
};

export default AdminApplicationManagement;
