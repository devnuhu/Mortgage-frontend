import React, { useEffect, useState, useMemo } from "react";
import { Search, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import { getApplicationReviewHistoryPaged } from "../../services/application-api";
import { searchApplications } from "../../services/applicationService";
import { getApplicationDetails } from "../../services/review-api";
import { CPAS_API_BASE_URL } from "../../services/cpas-config";

const formatCurrency = (value) => {
  if (value == null || value === "") return "-";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

const labelize = (value) =>
  value
    ? value.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
    : "-";

const getStatusBadgeClasses = (value) => {
  const normalized = String(value ?? "").toLowerCase();

  if (
    [
      "approved",
      "completed",
      "complete",
      "submitted",
      "accepted",
      "active",
    ].some((keyword) => normalized.includes(keyword))
  ) {
    return "border border-[#8DC63F]/30 bg-[#8DC63F]/12 text-[#4e7b0b]";
  }

  if (
    ["returned", "rejected", "pending", "review", "needs", "in progress"].some(
      (keyword) => normalized.includes(keyword),
    )
  ) {
    return "border border-[#FF8200]/30 bg-[#FF8200]/12 text-[#9a4f00]";
  }

  if (
    ["draft", "new", "created"].some((keyword) => normalized.includes(keyword))
  ) {
    return "border border-[#003883]/20 bg-[#003883]/10 text-[#003883]";
  }

  return "border border-slate-200 bg-slate-100 text-slate-700";
};

const ServiceManagerAllApplications = () => {
  const [searchText, setSearchText] = useState("");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [cpasStatus, setCpasStatus] = useState(null);
  const [cpasLoading, setCpasLoading] = useState(false);
  const [cpasError, setCpasError] = useState(null);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [reviewHistoryLoading, setReviewHistoryLoading] = useState(false);
  const [reviewHistoryError, setReviewHistoryError] = useState(null);
  const [reviewHistoryPage, setReviewHistoryPage] = useState(1);
  const [reviewHistoryPageSize] = useState(10);
  const [reviewHistoryMeta, setReviewHistoryMeta] = useState({
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const loadApplications = async (page = 1) => {
    const query = searchText.trim();
    if (!query) {
      setApplications([]);
      setTotalCount(0);
      setTotalPages(1);
      setPageNumber(1);
      return;
    }

    setLoading(true);
    try {
      const data = await searchApplications(query, page, pageSize);
      const items = data?.data || [];
      setApplications(items);
      setTotalCount(data?.totalCount ?? items.length);
      setPageNumber(data?.pageNumber ?? page);
      setTotalPages(data?.totalPages ?? 1);
    } catch (error) {
      console.error("Failed to load applications:", error);
      toast.error(error.message || "Failed to load applications");
      setApplications([]);
      setTotalCount(0);
      setPageNumber(1);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const query = searchText.trim();
    if (!query) {
      setApplications([]);
      setTotalCount(0);
      setTotalPages(1);
      setPageNumber(1);
      toast.error("Enter RSA PIN or borrower name to search.");
      return;
    }

    setPageNumber(1);
    await loadApplications(1);
  };

  const handleClear = () => {
    setSearchText("");
    setApplications([]);
    setTotalCount(0);
    setPageNumber(1);
    setTotalPages(1);
  };

  const resetReviewHistoryState = () => {
    setReviewHistory([]);
    setReviewHistoryLoading(false);
    setReviewHistoryError(null);
    setReviewHistoryPage(1);
    setReviewHistoryMeta({
      totalPages: 1,
      totalCount: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  };

  const loadReviewHistory = async (applicationId, page = 1) => {
    if (!applicationId) {
      resetReviewHistoryState();
      return;
    }

    setReviewHistoryLoading(true);
    setReviewHistoryError(null);

    try {
      const response = await getApplicationReviewHistoryPaged(
        applicationId,
        page,
        reviewHistoryPageSize,
      );

      const payload =
        response && typeof response === "object" && !Array.isArray(response)
          ? response
          : { data: Array.isArray(response) ? response : [] };

      const items = Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload.items)
          ? payload.items
          : [];

      setReviewHistory(items);
      setReviewHistoryMeta({
        totalPages: payload.totalPages ?? 1,
        totalCount: payload.totalCount ?? items.length,
        hasNextPage: Boolean(payload.hasNextPage),
        hasPreviousPage: Boolean(payload.hasPreviousPage),
      });
      setReviewHistoryPage(payload.pageNumber ?? page);
    } catch (error) {
      console.error("Failed to load review history:", error);
      setReviewHistory([]);
      setReviewHistoryError(
        error?.message || "Unable to load review history for this application.",
      );
    } finally {
      setReviewHistoryLoading(false);
    }
  };

  const loadDetails = async (application) => {
    try {
      setDetailsLoading(true);
      resetReviewHistoryState();
      const id = application?.id || application?.applicationNumber;
      const details = await getApplicationDetails(id);
      setSelectedDetails(details);

      if (details?.rsaPin) {
        void fetchCPASStatus(details.rsaPin);
      } else {
        setCpasStatus(null);
      }

      if (id) {
        void loadReviewHistory(id, 1);
      }
    } catch (error) {
      console.error("Failed to load application details:", error);
      toast.error(error.message || "Unable to load application details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchCPASStatus = async (rsaPin) => {
    if (!rsaPin) return;
    setCpasLoading(true);
    setCpasError(null);
    try {
      const url = `${CPAS_API_BASE_URL}/Website/CaseTracker/${encodeURIComponent(
        rsaPin,
      )}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`CPAS fetch failed (${res.status})`);
      }
      const text = await res.text();
      if (!text.trim()) {
        setCpasStatus(null);
        return;
      }
      const json = JSON.parse(text);
      setCpasStatus(json?.currentStatus || null);
    } catch (err) {
      console.error("Failed to fetch CPAS status:", err);
      setCpasError(err.message || "Failed to fetch CPAS status");
      setCpasStatus(null);
    } finally {
      setCpasLoading(false);
    }
  };

  const closeDetails = () => {
    resetReviewHistoryState();
    setSelectedDetails(null);
    setCpasStatus(null);
    setCpasLoading(false);
    setCpasError(null);
  };

  const paginationControls = useMemo(() => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          Page {pageNumber} of {totalPages} • {totalCount} results
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pageNumber <= 1 || loading}
            onClick={() => loadApplications(Math.max(1, pageNumber - 1))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={pageNumber >= totalPages || loading}
            onClick={() =>
              loadApplications(Math.min(totalPages, pageNumber + 1))
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  }, [loading, pageNumber, totalPages, totalCount]);

  const currentAssignment = selectedDetails?.currentAssignment;
  const assignmentHistory = selectedDetails?.assignmentHistory || [];
  const hasAssignmentData =
    Boolean(currentAssignment) || assignmentHistory.length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              All Applications
            </h1>
            <p className="text-gray-600 mt-1">
              Search system-wide applications by borrower name or RSA PIN.
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">{totalCount}</p>
            <p className="text-gray-500">Search results</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search borrower name or RSA PIN"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Application #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Borrower
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  RSA PIN
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Loan Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  PMI Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Updated
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    {searchText
                      ? "No applications match that search."
                      : "Enter a borrower name or RSA PIN to search all applications."}
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id || app.applicationNumber}>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      <div className="text-sm font-medium text-gray-900">
                        {app.applicationNumber || app.id}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {`${app.firstName || ""} ${app.middleName || ""} ${app.lastName || ""}`.trim() ||
                        "Unknown"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {app.rsaPin || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {(app.status || "-")
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {formatCurrency(app.loanAmount)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {app.pmiCompanyName || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {app.createdAt
                        ? new Date(app.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {app.updatedAt
                        ? new Date(app.updatedAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => loadDetails(app)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {paginationControls && <div className="mt-6">{paginationControls}</div>}
      </div>

      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 px-3 py-3 backdrop-blur-sm sm:px-6 sm:py-6">
          <div className="mx-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_30px_90px_-30px_rgba(0,56,131,0.35)] sm:max-h-[calc(100dvh-3rem)]">
            <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-5 backdrop-blur sm:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#003883]">
                    Application Details
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                      {selectedDetails.applicationNumber ||
                        selectedDetails.id ||
                        "Details"}
                    </h2>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${getStatusBadgeClasses(selectedDetails.status)}`}
                    >
                      {selectedDetails.status || "-".replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Application ID: {selectedDetails.id}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDetails}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF8200]/30"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
              <div className="space-y-5">
                <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-[#003883]/6 via-white to-[#FF8200]/8 p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#003883]">
                        Overview
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">
                        {selectedDetails.applicationNumber ||
                          selectedDetails.id ||
                          "Details"}
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        Borrower:{" "}
                        {`${selectedDetails.firstName || ""} ${selectedDetails.middleName || ""} ${selectedDetails.lastName || ""}`.trim() ||
                          "Unknown"}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-white/80 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          Documents
                        </p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {selectedDetails.documentCount ?? 0}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white/80 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          Loan Amount
                        </p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {formatCurrency(selectedDetails.loanAmount)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white/80 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          Priority
                        </p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">
                          {selectedDetails.priority || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Application Info
                    </h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-700">
                      <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <span className="font-medium text-slate-900">
                          Application #
                        </span>
                        <span className="text-right text-slate-600">
                          {selectedDetails.applicationNumber ||
                            selectedDetails.id ||
                            "-"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <span className="font-medium text-slate-900">
                          Status
                        </span>
                        <span className="text-right text-slate-600">
                          {(selectedDetails.status || "-").replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <span className="font-medium text-slate-900">
                          Priority
                        </span>
                        <span className="text-right text-slate-600">
                          {selectedDetails.priority || "-"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <span className="font-medium text-slate-900">
                          Documents
                        </span>
                        <span className="text-right text-slate-600">
                          {selectedDetails.documentCount ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Borrower
                    </h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-700">
                      <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <div className="font-medium text-slate-900">Name</div>
                        <div className="mt-1 text-slate-600">
                          {`${selectedDetails.firstName || ""} ${selectedDetails.middleName || ""} ${selectedDetails.lastName || ""}`.trim() ||
                            "Unknown"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <div className="font-medium text-slate-900">
                          RSA PIN
                        </div>
                        <div className="mt-1 break-all text-slate-600">
                          {selectedDetails.rsaPin || "-"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <div className="font-medium text-slate-900">Phone</div>
                        <div className="mt-1 text-slate-600">
                          {selectedDetails.phoneNumber || "-"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <div className="font-medium text-slate-900">
                          CPAS Status
                        </div>
                        <div className="mt-1 text-slate-600">
                          {cpasLoading
                            ? "Checking..."
                            : cpasError
                              ? `Error: ${cpasError}`
                              : cpasStatus || "Unavailable"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Application
                    </h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-700">
                      <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <div className="font-medium text-slate-900">Status</div>
                        <div className="mt-1 text-slate-600">
                          {(selectedDetails.status || "-").replace(/_/g, " ")}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <div className="font-medium text-slate-900">
                          Loan Amount
                        </div>
                        <div className="mt-1 text-slate-600">
                          {formatCurrency(selectedDetails.loanAmount)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <div className="font-medium text-slate-900">
                          Property Value
                        </div>
                        <div className="mt-1 text-slate-600">
                          {formatCurrency(selectedDetails.propertyValue)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
                      PMI
                    </h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-700">
                      <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <span className="font-medium text-slate-900">
                          Company
                        </span>
                        <span className="text-right text-slate-600">
                          {selectedDetails.pmiCompanyName || "-"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <span className="font-medium text-slate-900">
                          Rep Name
                        </span>
                        <span className="text-right text-slate-600">
                          {selectedDetails.pmiRepName || "-"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <span className="font-medium text-slate-900">
                          Rep Email
                        </span>
                        <span className="text-right text-slate-600">
                          {selectedDetails.pmiRepEmail || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Client
                    </h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-700">
                      <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <span className="font-medium text-slate-900">
                          Client Name
                        </span>
                        <span className="text-right text-slate-600">
                          {selectedDetails.userName || "-"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <span className="font-medium text-slate-900">
                          Client Email
                        </span>
                        <span className="text-right text-slate-600">
                          {selectedDetails.userEmail || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
                      Timing
                    </h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-700">
                      <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <span className="font-medium text-slate-900">
                          Created At
                        </span>
                        <span className="text-right text-slate-600">
                          {formatDate(selectedDetails.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <span className="font-medium text-slate-900">
                          Submitted At
                        </span>
                        <span className="text-right text-slate-600">
                          {formatDate(selectedDetails.submittedAt)}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <span className="font-medium text-slate-900">
                          Updated At
                        </span>
                        <span className="text-right text-slate-600">
                          {formatDate(selectedDetails.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
                        Review History
                      </h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        Latest entries
                      </span>
                    </div>
                    {reviewHistoryLoading ? (
                      <div className="mt-4 flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                        Loading review history...
                      </div>
                    ) : reviewHistoryError ? (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                        <p>{reviewHistoryError}</p>
                        <button
                          type="button"
                          onClick={() =>
                            loadReviewHistory(
                              selectedDetails?.id ||
                                selectedDetails?.applicationNumber,
                              reviewHistoryPage,
                            )
                          }
                          className="mt-3 inline-flex items-center rounded-lg border border-amber-300 bg-white px-3 py-2 font-medium text-amber-700 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-200"
                        >
                          Retry
                        </button>
                      </div>
                    ) : reviewHistory.length > 0 ? (
                      <>
                        <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                          {[...reviewHistory]
                            .sort((a, b) => {
                              const dateA = new Date(
                                a.createdAt || a.date || a.reviewedAt || 0,
                              ).getTime();
                              const dateB = new Date(
                                b.createdAt || b.date || b.reviewedAt || 0,
                              ).getTime();
                              return dateB - dateA;
                            })
                            .map((item, index) => {
                              const reviewerName =
                                item.reviewedByName ||
                                item.reviewerName ||
                                "Reviewer";
                              const commentText =
                                item.comments ||
                                item.comment ||
                                item.notes ||
                                item.status ||
                                "No comment";
                              const historyDate =
                                item.createdAt || item.date || item.reviewedAt;

                              return (
                                <div
                                  key={`${item.id || reviewerName || "review"}-${index}`}
                                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#FF8200]" />
                                        <p className="font-semibold text-slate-900">
                                          {reviewerName}
                                        </p>
                                      </div>
                                      <p className="mt-2 text-sm leading-6 text-slate-600">
                                        {commentText}
                                      </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                      <span
                                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getStatusBadgeClasses(item.status)}`}
                                      >
                                        {(item.status || "Review").replace(
                                          /_/g,
                                          " ",
                                        )}
                                      </span>
                                      <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                        {formatDate(historyDate)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                        {(reviewHistoryMeta.totalPages > 1 ||
                          reviewHistoryMeta.hasNextPage ||
                          reviewHistoryMeta.hasPreviousPage) && (
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600">
                            <p>
                              Page {reviewHistoryPage} of{" "}
                              {reviewHistoryMeta.totalPages || 1}
                              {reviewHistoryMeta.totalCount
                                ? ` • ${reviewHistoryMeta.totalCount} items`
                                : ""}
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  loadReviewHistory(
                                    selectedDetails?.id ||
                                      selectedDetails?.applicationNumber,
                                    Math.max(1, reviewHistoryPage - 1),
                                  )
                                }
                                disabled={
                                  !reviewHistoryMeta.hasPreviousPage ||
                                  reviewHistoryLoading
                                }
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Previous
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  loadReviewHistory(
                                    selectedDetails?.id ||
                                      selectedDetails?.applicationNumber,
                                    reviewHistoryPage + 1,
                                  )
                                }
                                disabled={
                                  !reviewHistoryMeta.hasNextPage ||
                                  reviewHistoryLoading
                                }
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">
                        No review history available for this application.
                      </p>
                    )}
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
                        Assignment History
                      </h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        Latest entries
                      </span>
                    </div>
                    {hasAssignmentData ? (
                      <div className="mt-4 space-y-3">
                        {currentAssignment && (
                          <div className="rounded-2xl border border-[#8DC63F]/30 bg-[#8DC63F]/10 p-4 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  Current Assignee
                                </p>
                                <p className="mt-1 font-semibold text-slate-900">
                                  {currentAssignment.reviewerName ||
                                    currentAssignment.reviewerEmail ||
                                    "Assignee"}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  {currentAssignment.reassignmentReason ||
                                    "Current active assignment"}
                                </p>
                              </div>
                              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                {formatDate(currentAssignment.assignedAt)}
                              </span>
                            </div>
                          </div>
                        )}

                        {assignmentHistory.length > 0 && (
                          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                            {assignmentHistory.map((item, index) => (
                              <div
                                key={index}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-slate-900">
                                      {item.assignedTo || "Assignee"}
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                      {item.note || "No note"}
                                    </p>
                                  </div>
                                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                    {formatDate(item.date)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">
                        No assignment history available.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagerAllApplications;
