import React, { useState, useEffect } from "react";
import {
  Download,
  Filter,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "../ui/ConfirmModal";
import {
  generateApplicationReport,
  getReportSummary,
  exportApplicationReportExcel,
  formatCurrency,
  formatDate,
} from "../../services/applicationService";
import { triggerFileDownload } from "../../services/api";

const LeadReviewerReports = () => {
  const [applications, setApplications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateField, setDateField] = useState("CreatedAt");
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [pmiCompanyId, setPmiCompanyId] = useState("");
  const [userId, setUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [sortDescending, setSortDescending] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "submitted", label: "Submitted" },
    { value: "under_review", label: "Under Review" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "returned", label: "Returned" },
    { value: "pending", label: "Pending" },
  ];

  const getStatusLabel = (statusValue) => {
    return (
      statusOptions.find((option) => option.value === statusValue)?.label ||
      statusValue
    );
  };

  const dateFieldOptions = [
    { value: "CreatedAt", label: "Created Date" },
    { value: "SubmittedAt", label: "Submitted Date" },
    { value: "UpdatedAt", label: "Updated Date" },
  ];

  const sortOptions = [
    { value: "CreatedAt", label: "Created Date" },
    { value: "SubmittedAt", label: "Submitted Date" },
    { value: "UpdatedAt", label: "Updated Date" },
    { value: "ApplicationNumber", label: "Application Number" },
    { value: "FirstName", label: "First Name" },
    { value: "LastName", label: "Last Name" },
  ];

  const loadApplications = async (page = pageNumber) => {
    try {
      setLoading(true);
      setError(null);

      const filters = {
        pageNumber: page,
        pageSize,
        dateFrom,
        dateTo,
        dateField,
        statuses: statuses.length > 0 ? statuses : undefined,
        priorities: priorities.length > 0 ? priorities : undefined,
        pmiCompanyId: pmiCompanyId || undefined,
        userId: userId || undefined,
        searchTerm: searchTerm || undefined,
        sortBy,
        sortDescending,
      };

      const response = await generateApplicationReport(filters);
      setApplications(response.data || []);
      setTotalCount(response.totalCount || 0);
      setTotalPages(response.totalPages || 1);
      setHasNextPage(response.hasNextPage || false);
      setHasPreviousPage(response.hasPreviousPage || false);
      setSummary(response.summary || null);
      setPageNumber(page);
    } catch (err) {
      console.error("Error loading applications:", err);
      setError("Failed to load applications. Please try again.");
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const filters = {
        dateFrom,
        dateTo,
        dateField,
        statuses: statuses.length > 0 ? statuses : undefined,
        priorities: priorities.length > 0 ? priorities : undefined,
        pmiCompanyId: pmiCompanyId || undefined,
        userId: userId || undefined,
        searchTerm: searchTerm || undefined,
      };

      const summaryData = await getReportSummary(filters);
      setSummary(summaryData);
    } catch (err) {
      console.error("Error loading summary:", err);
    }
  };

  useEffect(() => {
    loadApplications(pageNumber);
  }, [pageNumber]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pageNumber !== 1) {
        setPageNumber(1);
      } else {
        loadApplications(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    dateFrom,
    dateTo,
    dateField,
    statuses,
    priorities,
    pmiCompanyId,
    userId,
    searchTerm,
    sortBy,
    sortDescending,
    pageSize,
  ]);

  useEffect(() => {
    loadSummary();
  }, [
    dateFrom,
    dateTo,
    dateField,
    statuses,
    priorities,
    pmiCompanyId,
    userId,
    searchTerm,
  ]);

  const handlePriorityChange = (priority) => {
    setPriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority],
    );
  };

  const handleStatusSelect = (event) => {
    const selected = Array.from(
      event.target.selectedOptions,
      (option) => option.value,
    );
    setStatuses(selected);
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setDateField("CreatedAt");
    setStatuses([]);
    setPriorities([]);
    setPmiCompanyId("");
    setUserId("");
    setSearchTerm("");
    setSortBy("CreatedAt");
    setSortDescending(true);
    setPageNumber(1);
    toast.success("All filters cleared");
  };

  const getStatusColor = (status) => {
    const statusMap = {
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      returned: "bg-orange-100 text-orange-800",
      completed: "bg-purple-100 text-purple-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  const getDownloadFilename = (contentDisposition) => {
    if (!contentDisposition) return null;
    const filenameMatch = contentDisposition.match(/filename\*?=([^;\n]+)/i);
    if (!filenameMatch) return null;

    let filename = filenameMatch[1].trim();
    filename = filename.replace(/^(UTF-8''|utf-8''|"|')/, "");
    filename = filename.replace(/("|')$/, "");
    return filename;
  };

  const confirmExport = () => {
    if (applications.length === 0) {
      toast.error("No data to export");
      return;
    }
    setShowExportConfirm(true);
  };

  const exportToExcel = async (toastId = null) => {
    if (applications.length === 0) {
      toast.error("No data to export");
      setShowExportConfirm(false);
      return;
    }

    setIsExporting(true);

    try {
      const filters = {
        dateFrom,
        dateTo,
        dateField,
        statuses: statuses.length > 0 ? statuses : undefined,
        priorities: priorities.length > 0 ? priorities : undefined,
        pmiCompanyId: pmiCompanyId || undefined,
        userId: userId || undefined,
        searchTerm: searchTerm || undefined,
        sortBy,
        sortDescending,
      };

      const response = await exportApplicationReportExcel(filters);
      const contentDisposition =
        response.headers["content-disposition"] ||
        response.headers["Content-Disposition"];
      const filename =
        getDownloadFilename(contentDisposition) ||
        `Applications_Export_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`;

      triggerFileDownload(response.data, filename);
      if (toastId) {
        toast.success("Excel report downloaded successfully", { id: toastId });
      } else {
        toast.success("Excel report downloaded successfully");
      }
    } catch (err) {
      console.error("Export failed:", err);
      if (toastId) {
        toast.error(err?.message || "Failed to download Excel report", {
          id: toastId,
        });
      } else {
        toast.error(err?.message || "Failed to download Excel report");
      }
    } finally {
      setIsExporting(false);
      setShowExportConfirm(false);
    }
  };

  const handleExportConfirm = async () => {
    setShowExportConfirm(false);
    const exportToastId = toast.loading("Processing report export...");
    await exportToExcel(exportToastId);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#A8C045] mx-auto mb-4" />
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full mx-auto px-3 sm:px-4 lg:px-6 py-8">
        <div className="mb-8 bg-white border border-slate-200 shadow-sm rounded-sm p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                Applications Report
              </h1>
              <p className="text-slate-600 mt-2 max-w-2xl">
                Enterprise-grade export and reporting for application workflows.
              </p>
            </div>
            <div className="rounded-sm border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Use the filters below to refine the report, then export to Excel.
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 text-center">
              <div className="text-2xl font-semibold text-slate-900">
                {summary.totalRecords ?? summary.totalCount ?? 0}
              </div>
              <div className="text-sm text-slate-600 mt-2">
                Total Applications
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 text-center">
              <div className="text-2xl font-semibold text-[#003883]">
                {summary.submittedCount ?? summary.submitted ?? 0}
              </div>
              <div className="text-sm text-slate-600 mt-2">Submitted</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 text-center">
              <div className="text-2xl font-semibold text-[#FF8200]">
                {summary.underReviewCount ?? summary.underReview ?? 0}
              </div>
              <div className="text-sm text-slate-600 mt-2">Under Review</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 text-center">
              <div className="text-2xl font-semibold text-[#8DC63F]">
                {summary.approvedCount ?? summary.approved ?? 0}
              </div>
              <div className="text-sm text-slate-600 mt-2">Approved</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 text-center">
              <div className="text-2xl font-semibold text-red-600">
                {summary.rejectedCount ?? summary.rejected ?? 0}
              </div>
              <div className="text-sm text-slate-600 mt-2">Rejected</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 text-center">
              <div className="text-2xl font-semibold text-[#FF8200]">
                {summary.returnedCount ?? summary.returned ?? 0}
              </div>
              <div className="text-sm text-slate-600 mt-2">Returned</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 text-center">
              <div className="text-2xl font-semibold text-slate-700">
                {summary.completedCount ?? summary.completed ?? 0}
              </div>
              <div className="text-sm text-slate-600 mt-2">Completed</div>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 mb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#003883]" />
              Advanced Filters
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-sm border border-slate-200 hover:bg-slate-200"
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm bg-[#FF8200] text-white rounded-sm hover:bg-[#e96f00]"
              >
                Clear All
              </button>
              <button
                onClick={confirmExport}
                disabled={isExporting}
                className="px-4 py-2 text-sm bg-[#003883] text-white rounded-sm hover:bg-[#002d70] flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "Exporting..." : "Export Excel"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date Field
              </label>
              <select
                value={dateField}
                onChange={(e) => setDateField(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-sm focus:ring-2 focus:ring-[#8DC63F] focus:border-transparent"
              >
                {dateFieldOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-sm focus:ring-2 focus:ring-[#8DC63F] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-sm focus:ring-2 focus:ring-[#8DC63F] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                multiple
                value={statuses}
                onChange={handleStatusSelect}
                className="w-full h-28 px-3 py-2 border border-slate-300 bg-slate-50 rounded-sm focus:ring-2 focus:ring-[#8DC63F] focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {statuses.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {statuses.map((status) => (
                    <span
                      key={status}
                      className="inline-flex items-center rounded-full bg-[#A8C045] bg-opacity-15 px-2.5 py-1 text-xs font-medium text-emerald-900"
                    >
                      {getStatusLabel(status)}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Search Applications
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Name, ID, RSA PIN, company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 bg-slate-50 rounded-sm focus:ring-2 focus:ring-[#8DC63F] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Priority Level
                  </label>
                  <div className="space-y-2">
                    {priorityOptions.map((priority) => (
                      <label key={priority.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={priorities.includes(priority.value)}
                          onChange={() => handlePriorityChange(priority.value)}
                          className="rounded border-gray-300 text-[#A8C045] focus:ring-[#A8C045] mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          {priority.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-sm focus:ring-2 focus:ring-[#8DC63F] focus:border-transparent"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={!sortDescending}
                        onChange={(e) => setSortDescending(!e.target.checked)}
                        className="rounded border-gray-300 text-[#A8C045] focus:ring-[#A8C045] mr-2"
                      />
                      <span className="text-sm text-gray-700">Ascending</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Items Per Page
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-sm focus:ring-2 focus:ring-[#8DC63F] focus:border-transparent"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No applications found for the selected filters.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Application #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Applicant Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        RSA PIN
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        PMI Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Property Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Loan Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Assigned Reviewer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Reviewer Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Assigned At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Docs
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                          {app.applicationNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {app.applicantName ||
                            `${app.firstName || ""} ${app.middleName || ""} ${app.lastName || ""}`.trim() ||
                            "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {app.rsaPin || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {app.pmiCompany ||
                            app.pmiCompanyName ||
                            app.companyName ||
                            "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(app.propertyValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(app.loanAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              app.status,
                            )}`}
                          >
                            {(app.status || "unknown")
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {app.assignedReviewerName || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {app.assignedReviewerEmail || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                          {app.assignedAt ? formatDate(app.assignedAt) : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                          {formatDate(app.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                          {app.submittedAt ? formatDate(app.submittedAt) : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {app.documentCount || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mt-6">
                <p className="text-sm text-slate-600">
                  Showing {(pageNumber - 1) * pageSize + 1} to{" "}
                  {Math.min(pageNumber * pageSize, totalCount)} of {totalCount}{" "}
                  applications
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                    disabled={!hasPreviousPage}
                    className="flex items-center gap-1 px-3 py-2 border border-slate-300 rounded-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page =
                        Math.max(1, Math.min(totalPages - 4, pageNumber - 2)) +
                        i;
                      return (
                        <button
                          key={page}
                          onClick={() => setPageNumber(page)}
                          className={`px-3 py-2 rounded-sm text-sm font-medium ${
                            pageNumber === page
                              ? "bg-[#003883] text-white"
                              : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() =>
                      setPageNumber(Math.min(totalPages, pageNumber + 1))
                    }
                    disabled={!hasNextPage}
                    className="flex items-center gap-1 px-3 py-2 border border-slate-300 rounded-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {showExportConfirm && (
          <ConfirmModal
            isOpen={showExportConfirm}
            title="Export Applications Report"
            message={`Export ${totalCount} applications to Excel? This may take a moment for large datasets.`}
            confirmText="Download Excel"
            cancelText="Cancel"
            onConfirm={handleExportConfirm}
            onCancel={() => setShowExportConfirm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default LeadReviewerReports;
