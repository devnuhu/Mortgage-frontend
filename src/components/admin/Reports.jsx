import React, { useState, useEffect } from "react";
import {
  Download,
  Filter,
  Calendar,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "../ui/ConfirmModal";
import { getAllApplications } from "../../services/application-api";

const Reports = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startSubmittedDate, setStartSubmittedDate] = useState("");
  const [endSubmittedDate, setEndSubmittedDate] = useState("");
  const [startUpdatedDate, setStartUpdatedDate] = useState("");
  const [endUpdatedDate, setEndUpdatedDate] = useState("");
  const [selectedPMI, setSelectedPMI] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [pmiRepName, setPmiRepName] = useState("");
  const [pmiList, setPmiList] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  // Load all applications on component mount
  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllApplications();
      setApplications(data || []);
      setFilteredApplications(data || []);

      // Extract unique PMI companies
      const pmiCompanies = [
        ...new Set(
          data
            ?.filter((app) => app.pmiCompanyName)
            .map((app) => app.pmiCompanyName)
        ),
      ].sort();
      setPmiList(pmiCompanies);

      // Extract unique statuses
      const statuses = [
        ...new Set(data?.filter((app) => app.status).map((app) => app.status)),
      ].sort();
      setStatusList(statuses);
    } catch (err) {
      console.error("Error loading applications:", err);
      setError("Failed to load applications. Please try again.");
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  // Filter applications by all criteria
  useEffect(() => {
    let filtered = [...applications];

    // Created date range filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter((app) => {
        const appDate = new Date(app.createdAt);
        return appDate >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((app) => {
        const appDate = new Date(app.createdAt);
        return appDate <= end;
      });
    }

    // Submitted date range filter
    if (startSubmittedDate) {
      const start = new Date(startSubmittedDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter((app) => {
        if (!app.submittedAt) return false;
        const appDate = new Date(app.submittedAt);
        return appDate >= start;
      });
    }

    if (endSubmittedDate) {
      const end = new Date(endSubmittedDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((app) => {
        if (!app.submittedAt) return false;
        const appDate = new Date(app.submittedAt);
        return appDate <= end;
      });
    }

    // Updated date range filter
    if (startUpdatedDate) {
      const start = new Date(startUpdatedDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter((app) => {
        const appDate = new Date(app.updatedAt);
        return appDate >= start;
      });
    }

    if (endUpdatedDate) {
      const end = new Date(endUpdatedDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((app) => {
        const appDate = new Date(app.updatedAt);
        return appDate <= end;
      });
    }

    // PMI Company filter
    if (selectedPMI) {
      filtered = filtered.filter((app) => app.pmiCompanyName === selectedPMI);
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter((app) => app.status === selectedStatus);
    }

    // Applicant name filter (case-insensitive search)
    if (applicantName) {
      const searchName = applicantName.toLowerCase();
      filtered = filtered.filter((app) => {
        const fullName = `${app.firstName} ${app.middleName || ""} ${
          app.lastName
        }`.toLowerCase();
        return fullName.includes(searchName);
      });
    }

    // PMI Rep name filter (case-insensitive search)
    if (pmiRepName) {
      const searchRep = pmiRepName.toLowerCase();
      filtered = filtered.filter((app) => {
        const repName = (app.pmiRepName || "").toLowerCase();
        return repName.includes(searchRep);
      });
    }

    setFilteredApplications(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [
    startDate,
    endDate,
    startSubmittedDate,
    endSubmittedDate,
    startUpdatedDate,
    endUpdatedDate,
    selectedPMI,
    selectedStatus,
    applicantName,
    pmiRepName,
    applications,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApplications = filteredApplications.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Format currency
  const formatCurrency = (value) => {
    if (!value) return "₦0";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusMap = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      returned: "bg-orange-100 text-orange-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  // Show confirmation before exporting
  const confirmExport = () => {
    if (filteredApplications.length === 0) {
      toast.error("No data to export");
      return;
    }
    setShowExportConfirm(true);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (filteredApplications.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      // Prepare CSV content
      const headers = [
        "Application Number",
        "Status",
        "Full Name",
        "RSA PIN",
        "Equity Value",
        "Supplementary Value",
        "Loan Amount",
        "Property Value",
        "PMI Rep Name",
        "PMI Company",
        "User Name",
        "Created Date",
        "Submitted Date",
        "Updated Date",
        "Document Count",
      ];

      const csvContent = [
        headers.join(","),
        ...filteredApplications.map((app) =>
          [
            app.applicationNumber || "-",
            app.status || "-",
            `${app.firstName} ${app.middleName || ""} ${app.lastName}`.trim(),
            app.rsaPin || "-",
            app.equityValue || 0,
            app.supplementaryValue || 0,
            app.loanAmount || 0,
            app.propertyValue || 0,
            app.pmiRepName || "-",
            app.pmiCompanyName || "-",
            app.userName || "-",
            new Date(app.createdAt).toLocaleString("en-NG"),
            app.submittedAt
              ? new Date(app.submittedAt).toLocaleString("en-NG")
              : "-",
            new Date(app.updatedAt).toLocaleString("en-NG"),
            app.documentCount || 0,
          ].join(",")
        ),
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `applications_report_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Report exported successfully!");
    } catch (err) {
      console.error("Error exporting to Excel:", err);
      toast.error("Failed to export report");
    }
  };

  // Clear filters
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setStartSubmittedDate("");
    setEndSubmittedDate("");
    setStartUpdatedDate("");
    setEndUpdatedDate("");
    setSelectedPMI("");
    setSelectedStatus("");
    setApplicantName("");
    setPmiRepName("");
  };

  if (loading) {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Applications Report
          </h1>
          <p className="text-gray-600 mt-2">
            Total Applications:{" "}
            <span className="font-semibold">{filteredApplications.length}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Filters and Export */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center mb-3">
            <h2 className="text-base font-semibold text-gray-900 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </h2>
          </div>

          {/* Single Row: All Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2">
            {/* Created Start Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Created From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#A8C045] focus:border-transparent"
              />
            </div>

            {/* Created End Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Created To
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#A8C045] focus:border-transparent"
              />
            </div>

            {/* Submitted Start Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Submitted From
              </label>
              <input
                type="date"
                value={startSubmittedDate}
                onChange={(e) => setStartSubmittedDate(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#A8C045] focus:border-transparent"
              />
            </div>

            {/* Submitted End Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Submitted To
              </label>
              <input
                type="date"
                value={endSubmittedDate}
                onChange={(e) => setEndSubmittedDate(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#A8C045] focus:border-transparent"
              />
            </div>

            {/* Updated Start Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Updated From
              </label>
              <input
                type="date"
                value={startUpdatedDate}
                onChange={(e) => setStartUpdatedDate(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#A8C045] focus:border-transparent"
              />
            </div>

            {/* Updated End Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Updated To
              </label>
              <input
                type="date"
                value={endUpdatedDate}
                onChange={(e) => setEndUpdatedDate(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#A8C045] focus:border-transparent"
              />
            </div>

            {/* PMI Company */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                PMI
              </label>
              <select
                value={selectedPMI}
                onChange={(e) => setSelectedPMI(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#A8C045] focus:border-transparent bg-white"
              >
                <option value="">All</option>
                {pmiList.map((pmi) => (
                  <option key={pmi} value={pmi}>
                    {pmi.substring(0, 15)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#A8C045] focus:border-transparent bg-white"
              >
                <option value="">All</option>
                {statusList.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ").substring(0, 10)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Second Row: Search Filters + Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
            {/* Applicant Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Applicant
              </label>
              <input
                type="text"
                placeholder="Name..."
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#A8C045] focus:border-transparent"
              />
            </div>

            {/* PMI Rep Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                PMI Rep
              </label>
              <input
                type="text"
                placeholder="Rep name..."
                value={pmiRepName}
                onChange={(e) => setPmiRepName(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#A8C045] focus:border-transparent"
              />
            </div>

            {/* Clear Button */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                &nbsp;
              </label>
              <button
                onClick={clearFilters}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>

            {/* Export Button */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                &nbsp;
              </label>
              <button
                onClick={exportToExcel}
                className="w-full px-2 py-1 text-sm bg-[#A8C045] text-white rounded hover:bg-green-600 transition-colors flex items-center justify-center whitespace-nowrap"
              >
                <Download className="w-3 h-3 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No applications found for the selected filters.
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Application #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Applicant Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        RSA PIN
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        PMI Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        PMI Rep Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Property Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Loan Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Docs
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {app.applicationNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {`${app.firstName} ${app.lastName}`.trim()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {app.rsaPin || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {app.pmiCompanyName || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {app.pmiRepName || "-"}
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
                              app.status
                            )}`}
                          >
                            {(app.status || "unknown")
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(
                    startIndex + itemsPerPage,
                    filteredApplications.length
                  )}{" "}
                  of {filteredApplications.length} applications
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium ${
                            currentPage === page
                              ? "bg-[#A8C045] text-white"
                              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
