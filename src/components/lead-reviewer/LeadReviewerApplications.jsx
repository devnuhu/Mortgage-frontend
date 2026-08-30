import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Filter,
  Loader2,
  RefreshCcw,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { usePMI } from "../../context/PMIContext";
import { useReviewers } from "../../hooks/useReviewers";
import api from "../../services/axios-config";
import { APPLICATION_STATUS, getStatusText } from "../../services/api";
import ApplicationReviewModal from "../admin/ApplicationReviewModal";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const SORT_FIELDS = [
  {
    value: "applicationNumber",
    label: "Application #",
    backend: "applicationnumber",
  },
  { value: "borrowerName", label: "Borrower Name", backend: "applicantname" },
  { value: "status", label: "Status", backend: "status" },
  { value: "createdAt", label: "Created Date", backend: "createdat" },
  { value: "submittedAt", label: "Submitted Date", backend: "submittedat" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  {
    value: APPLICATION_STATUS.SUBMITTED,
    label: getStatusText(APPLICATION_STATUS.SUBMITTED),
  },
  {
    value: APPLICATION_STATUS.UNDER_REVIEW,
    label: getStatusText(APPLICATION_STATUS.UNDER_REVIEW),
  },
  {
    value: APPLICATION_STATUS.RETURNED,
    label: getStatusText(APPLICATION_STATUS.RETURNED),
  },
  { value: "resubmitted", label: "Resubmitted" },
  {
    value: APPLICATION_STATUS.APPROVED,
    label: getStatusText(APPLICATION_STATUS.APPROVED),
  },
  {
    value: APPLICATION_STATUS.REJECTED,
    label: getStatusText(APPLICATION_STATUS.REJECTED),
  },
  {
    value: APPLICATION_STATUS.COMPLETED,
    label: getStatusText(APPLICATION_STATUS.COMPLETED),
  },
];

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return `₦${number.toLocaleString("en-NG")}`;
};

const getStatusBadgeClasses = (status) => {
  const normalizedStatus = `${status || ""}`.toLowerCase();

  if ([APPLICATION_STATUS.SUBMITTED, "submitted"].includes(normalizedStatus)) {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }
  if (
    [APPLICATION_STATUS.UNDER_REVIEW, "under review", "under_review"].includes(
      normalizedStatus,
    )
  ) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  if ([APPLICATION_STATUS.RETURNED, "returned"].includes(normalizedStatus)) {
    return "bg-orange-50 text-orange-700 ring-orange-200";
  }
  if (["resubmitted"].includes(normalizedStatus)) {
    return "bg-purple-50 text-purple-700 ring-purple-200";
  }
  if ([APPLICATION_STATUS.APPROVED, "approved"].includes(normalizedStatus)) {
    return "bg-green-50 text-green-700 ring-green-200";
  }
  if ([APPLICATION_STATUS.REJECTED, "rejected"].includes(normalizedStatus)) {
    return "bg-red-50 text-red-700 ring-red-200";
  }
  if ([APPLICATION_STATUS.COMPLETED, "completed"].includes(normalizedStatus)) {
    return "bg-slate-50 text-slate-700 ring-slate-200";
  }

  return "bg-slate-50 text-slate-700 ring-slate-200";
};

const LeadReviewerApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [reviewers, setReviewers] = useState([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");
  const [selectedApplicationIds, setSelectedApplicationIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [rsaPinFilter, setRsaPinFilter] = useState("");
  const [borrowerNameFilter, setBorrowerNameFilter] = useState("");
  const [pmiCompanyId, setPmiCompanyId] = useState("");
  const [createdFromDate, setCreatedFromDate] = useState("");
  const [createdToDate, setCreatedToDate] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDescending, setSortDescending] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageInput, setPageInput] = useState("1");
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [selectedApplicationForDetails, setSelectedApplicationForDetails] =
    useState(null);

  const { getAvailableReviewers, loading: reviewersLoading } = useReviewers();
  const { pmis = [], loading: pmiLoading } = usePMI();

  const loadReviewers = async () => {
    try {
      const data = await getAvailableReviewers();
      const activeReviewers = (data || []).filter(
        (reviewer) => reviewer?.reviewerId && reviewer.isAvailable !== false,
      );
      setReviewers(activeReviewers);
    } catch (error) {
      toast.error(error.message || "Failed to load reviewers");
    }
  };

  const loadApplications = async (
    nextPage = pageNumber,
    nextPageSize = pageSize,
    override = {},
  ) => {
    try {
      setLoading(true);
      setFeedback({ type: "", message: "" });

      const params = {
        pageNumber: nextPage,
        pageSize: nextPageSize,
        sortBy: override.sortBy
          ? SORT_FIELDS.find((field) => field.value === override.sortBy)
              ?.backend || override.sortBy
          : SORT_FIELDS.find((field) => field.value === sortBy)?.backend ||
            sortBy,
        sortDescending:
          override.sortDescending !== undefined
            ? override.sortDescending
            : sortDescending,
        ...((override.statusFilter ?? statusFilter)
          ? { applicationStatus: override.statusFilter ?? statusFilter }
          : {}),
        ...((override.rsaPinFilter ?? rsaPinFilter)
          ? { rsaPin: override.rsaPinFilter ?? rsaPinFilter }
          : {}),
        ...((override.borrowerNameFilter ?? borrowerNameFilter)
          ? { borrowerName: override.borrowerNameFilter ?? borrowerNameFilter }
          : {}),
        ...((override.pmiCompanyId ?? pmiCompanyId)
          ? { pmiCompanyId: override.pmiCompanyId ?? pmiCompanyId }
          : {}),
        ...((override.createdFromDate ?? createdFromDate)
          ? {
              createdFromDate: new Date(
                override.createdFromDate ?? createdFromDate,
              ).toISOString(),
            }
          : {}),
        ...((override.createdToDate ?? createdToDate)
          ? {
              createdToDate: new Date(
                override.createdToDate ?? createdToDate,
              ).toISOString(),
            }
          : {}),
      };

      const response = await api.get("/Assignments/unassigned-for-bulk", {
        params,
      });
      const payload = response?.data || {};
      setApplications(payload.applications || []);
      setPageNumber(payload.pageNumber || nextPage);
      setPageSize(payload.pageSize || nextPageSize);
      setTotalPages(payload.totalPages || 1);
      setTotalCount(payload.totalCount || 0);
      setHasNextPage(Boolean(payload.hasNextPage));
      setHasPreviousPage(Boolean(payload.hasPreviousPage));
      setPageInput(String(payload.pageNumber || nextPage));
      setSelectedApplicationIds([]);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Failed to load unassigned applications.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewers();
    loadApplications(1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSortChange = (fieldValue) => {
    const nextDirection = sortBy === fieldValue ? !sortDescending : true;
    setSortBy(fieldValue);
    setSortDescending(nextDirection);
    loadApplications(1, pageSize, {
      sortBy: fieldValue,
      sortDescending: nextDirection,
    });
  };

  const handleApplyFilters = () => {
    loadApplications(1, pageSize);
  };

  const handleResetFilters = () => {
    setStatusFilter("");
    setRsaPinFilter("");
    setBorrowerNameFilter("");
    setPmiCompanyId("");
    setCreatedFromDate("");
    setCreatedToDate("");
    loadApplications(1, pageSize, {
      statusFilter: "",
      rsaPinFilter: "",
      borrowerNameFilter: "",
      pmiCompanyId: "",
      createdFromDate: "",
      createdToDate: "",
    });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || (totalPages > 0 && nextPage > totalPages)) return;
    loadApplications(nextPage, pageSize);
  };

  const handlePageInputSubmit = (event) => {
    event.preventDefault();
    const parsed = Number(pageInput);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      const nextPage = Math.min(parsed, totalPages || 1);
      handlePageChange(nextPage);
    } else {
      setPageInput(String(pageNumber));
    }
  };

  const toggleApplicationSelection = (applicationId) => {
    setSelectedApplicationIds((prev) =>
      prev.includes(applicationId)
        ? prev.filter((item) => item !== applicationId)
        : [...prev, applicationId],
    );
  };

  const toggleSelectAll = () => {
    const currentIds = applications.map(
      (application) => application.id || application.applicationId,
    );
    const allSelected = currentIds.every((id) =>
      selectedApplicationIds.includes(id),
    );

    setSelectedApplicationIds((prev) =>
      allSelected
        ? prev.filter((id) => !currentIds.includes(id))
        : [...new Set([...prev, ...currentIds])],
    );
  };

  const handleBulkAssign = async () => {
    if (selectedApplicationIds.length === 0) {
      const message = "Select at least one application before assigning.";
      setFeedback({ type: "error", message });
      toast.error(message);
      return;
    }

    if (!selectedReviewerId) {
      const message = "Choose a reviewer before assigning applications.";
      setFeedback({ type: "error", message });
      toast.error(message);
      return;
    }

    try {
      setAssigning(true);
      setFeedback({ type: "", message: "" });
      const response = await api.post("/Assignments/bulk-assign", {
        applicationIds: selectedApplicationIds,
        reviewerId: selectedReviewerId,
        reason: "Bulk assignment",
      });

      const payload = response?.data || {};
      const successCount = payload.successCount || 0;
      const failureCount = payload.failureCount || 0;
      const skippedCount = payload.skippedApplicationIds?.length || 0;
      const messages = payload.messages || [];

      if (successCount > 0) {
        const successMessage = [
          `Successfully assigned ${successCount} applications.`,
          skippedCount > 0
            ? `${skippedCount} applications were skipped because they were already assigned.`
            : null,
          messages.length > 0 ? messages.join(" ") : null,
        ]
          .filter(Boolean)
          .join(" ");

        setFeedback({ type: "success", message: successMessage });
        toast.success(successMessage);
      } else if (failureCount > 0 || messages.length > 0) {
        const failureMessage =
          messages.length > 0
            ? messages.join(" ")
            : "Unable to complete bulk assignment.";
        setFeedback({ type: "error", message: failureMessage });
        toast.error(failureMessage);
      } else {
        setFeedback({
          type: "success",
          message: "Bulk assignment completed successfully.",
        });
        toast.success("Bulk assignment completed successfully.");
      }

      setSelectedApplicationIds([]);
      await loadApplications(pageNumber, pageSize);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "Unable to complete bulk assignment.";
      setFeedback({ type: "error", message });
      toast.error(message);
    } finally {
      setAssigning(false);
    }
  };

  const selectedCount = selectedApplicationIds.length;
  const allVisibleSelected =
    applications.length > 0 &&
    applications.every((application) => {
      const id = application.id || application.applicationId;
      return selectedApplicationIds.includes(id);
    });

  const currentSortField = SORT_FIELDS.find((field) => field.value === sortBy);

  const statusSummary = useMemo(() => {
    if (!totalCount) return "No unassigned applications available.";
    return `Showing ${applications.length} of ${totalCount} unassigned applications`;
  }, [applications.length, totalCount]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-[#003883] via-[#00479a] to-[#0b5ec3] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h1 className="text-2xl font-semibold">Bulk Assignment</h1>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-slate-100">
              Review unassigned applications, refine the list with targeted
              filters, and assign selected applications to a reviewer in one
              action.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadApplications(pageNumber, pageSize)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {selectedApplicationForDetails && (
        <ApplicationReviewModal
          application={selectedApplicationForDetails}
          onClose={() => setSelectedApplicationForDetails(null)}
        />
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#003883]">
              Search & filters
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Narrow the queue before assignment.
            </p>
          </div>
          <div className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm">
            {totalCount} results
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#003883] focus:outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              RSA PIN
            </label>
            <input
              value={rsaPinFilter}
              onChange={(event) => setRsaPinFilter(event.target.value)}
              placeholder="Search RSA PIN"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#003883] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Borrower Name
            </label>
            <input
              value={borrowerNameFilter}
              onChange={(event) => setBorrowerNameFilter(event.target.value)}
              placeholder="Search borrower name"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#003883] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              PMI Company
            </label>
            <select
              value={pmiCompanyId}
              onChange={(event) => setPmiCompanyId(event.target.value)}
              disabled={pmiLoading}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#003883] focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">All PMI companies</option>
              {pmis.map((pmi) => (
                <option key={pmi.id} value={pmi.id}>
                  {pmi.pmiName || pmi.name || pmi.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Created From
            </label>
            <input
              type="date"
              value={createdFromDate}
              onChange={(event) => setCreatedFromDate(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#003883] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Created To
            </label>
            <input
              type="date"
              value={createdToDate}
              onChange={(event) => setCreatedToDate(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#003883] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleApplyFilters}
            className="rounded-lg bg-[#003883] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#002b66]"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Unassigned applications
            </h2>
            <p className="text-sm text-slate-600">{statusSummary}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              {selectedCount} selected
            </div>
            <select
              value={pageSize}
              onChange={(event) => {
                const nextSize = Number(event.target.value);
                setPageSize(nextSize);
                loadApplications(1, nextSize);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#003883] focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-[#003883] focus:ring-[#003883]"
                    />
                    Select
                  </label>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <button
                    type="button"
                    onClick={() => handleSortChange("applicationNumber")}
                    className="flex items-center gap-1 text-left text-slate-600 hover:text-slate-900"
                  >
                    Application #
                    {currentSortField?.value === "applicationNumber" &&
                      (sortDescending ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      ))}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <button
                    type="button"
                    onClick={() => handleSortChange("borrowerName")}
                    className="flex items-center gap-1 text-left text-slate-600 hover:text-slate-900"
                  >
                    Borrower Name
                    {currentSortField?.value === "borrowerName" &&
                      (sortDescending ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      ))}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  RSA PIN
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <button
                    type="button"
                    onClick={() => handleSortChange("status")}
                    className="flex items-center gap-1 text-left text-slate-600 hover:text-slate-900"
                  >
                    Status
                    {currentSortField?.value === "status" &&
                      (sortDescending ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      ))}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Loan Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <button
                    type="button"
                    onClick={() => handleSortChange("createdAt")}
                    className="flex items-center gap-1 text-left text-slate-600 hover:text-slate-900"
                  >
                    Created Date
                    {currentSortField?.value === "createdAt" &&
                      (sortDescending ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      ))}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <button
                    type="button"
                    onClick={() => handleSortChange("submittedAt")}
                    className="flex items-center gap-1 text-left text-slate-600 hover:text-slate-900"
                  >
                    Submitted Date
                    {currentSortField?.value === "submittedAt" &&
                      (sortDescending ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      ))}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Reviewer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading applications...
                    </div>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No unassigned applications available.
                  </td>
                </tr>
              ) : (
                applications.map((application) => {
                  const applicationId =
                    application.id || application.applicationId;
                  const isSelected =
                    selectedApplicationIds.includes(applicationId);
                  return (
                    <tr key={applicationId} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              toggleApplicationSelection(applicationId)
                            }
                            className="h-4 w-4 rounded border-slate-300 text-[#003883] focus:ring-[#003883]"
                          />
                          <span className="sr-only">Select application</span>
                        </label>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                        {application.applicationNumber || applicationId}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {`${application.borrowerFirstName || ""} ${application.borrowerLastName || ""}`.trim() ||
                          "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {application.rsaPin || "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClasses(application.applicationStatus || application.status)}`}
                        >
                          {getStatusText(
                            application.applicationStatus || application.status,
                          ) || "Unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatCurrency(application.loanAmount)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatDate(
                          application.applicationCreatedAt ||
                            application.createdAt,
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatDate(
                          application.applicationSubmittedAt ||
                            application.submittedAt,
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {application.reviewerName || "Unassigned"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            const normalizedApplication = {
                              ...application,
                              id: application.id || application.applicationId,
                              applicationId:
                                application.applicationId || application.id,
                            };
                            setSelectedApplicationForDetails(
                              normalizedApplication,
                            );
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-slate-600">
            Page {pageNumber} of {totalPages} • Showing {applications.length} of{" "}
            {totalCount} applications
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!hasPreviousPage && pageNumber === 1}
                onClick={() => handlePageChange(pageNumber - 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <form
                onSubmit={handlePageInputSubmit}
                className="flex items-center gap-2"
              >
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={pageInput}
                  onChange={(event) => setPageInput(event.target.value)}
                  className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#003883] focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Go
                </button>
              </form>
              <button
                type="button"
                disabled={!hasNextPage}
                onClick={() => handlePageChange(pageNumber + 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Assign selected applications
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Choose a reviewer and assign the selected applications in one
              action.
            </p>
          </div>
          <div className="rounded-lg border border-[#FF8200]/20 bg-[#FFF4E8] px-3 py-2 text-sm font-medium text-[#9A4E00]">
            {selectedCount} applications selected
          </div>
        </div>

        {feedback.message ? (
          <div
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
              feedback.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Assign to
            </label>
            <select
              value={selectedReviewerId}
              onChange={(event) => setSelectedReviewerId(event.target.value)}
              disabled={reviewersLoading}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#003883] focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">Select reviewer</option>
              {reviewers.map((reviewer) => (
                <option key={reviewer.reviewerId} value={reviewer.reviewerId}>
                  {reviewer.reviewerName ||
                    reviewer.firstName ||
                    reviewer.lastName ||
                    reviewer.reviewerId}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleBulkAssign}
              disabled={
                assigning ||
                selectedApplicationIds.length === 0 ||
                !selectedReviewerId
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#8DC63F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#76a731] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Assigning
                  applications...
                </>
              ) : (
                "Assign Selected Applications"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadReviewerApplications;
