import React, { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import { useReviewers } from "../../hooks/useReviewers";
import { getBalanceByRsaPin } from "../../services/balanceService";
import { APPLICATION_STATUS, getStatusText } from "../../services/api";
import { getBulkReassignmentApplications } from "../../services/analyticsService";
import ApplicationReviewModal from "../admin/ApplicationReviewModal";
import BulkReassignmentModal from "./BulkReassignmentModal";

const statusOptions = [
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

const sortOptions = [
  { label: "Application #", value: "applicationNumber" },
  { label: "Assigned Hours", value: "assignedForHours" },
  { label: "Reviewer Name", value: "reviewerName" },
  { label: "Borrower Name", value: "borrowerLastName" },
  { label: "Priority", value: "applicationPriority" },
];

const formatDisplayDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDateValue = (item, keys) => {
  for (const key of keys) {
    const value = item?.[key];
    if (value) return value;
  }
  return null;
};

const LeadReviewerReassignments = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({});
  const [reviewerWorkloads, setReviewerWorkloads] = useState([]);
  const [sourceReviewers, setSourceReviewers] = useState([]);
  const [reviewerFilter, setReviewerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rsaPinFilter, setRsaPinFilter] = useState("");
  const [createdFromDate, setCreatedFromDate] = useState("");
  const [createdToDate, setCreatedToDate] = useState("");
  const [submittedFromDate, setSubmittedFromDate] = useState("");
  const [submittedToDate, setSubmittedToDate] = useState("");
  const [sortBy, setSortBy] = useState("applicationNumber");
  const [sortDescending, setSortDescending] = useState(false);
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedApplicationForDetails, setSelectedApplicationForDetails] =
    useState(null);
  const [hniMap, setHniMap] = useState({});

  // Allow configuring HNI threshold via env: VITE_HNI_THRESHOLD or REACT_APP_HNI_THRESHOLD
  let importMetaEnv = {};
  try {
    importMetaEnv = import.meta && import.meta.env ? import.meta.env : {};
  } catch (e) {
    importMetaEnv = {};
  }

  const envHniThreshold =
    (importMetaEnv && importMetaEnv.VITE_HNI_THRESHOLD) ||
    (typeof process !== "undefined" && process.env?.REACT_APP_HNI_THRESHOLD) ||
    null;

  const HNI_THRESHOLD =
    envHniThreshold != null && !Number.isNaN(Number(envHniThreshold))
      ? Number(envHniThreshold)
      : 50000000; // default 50,000,000

  const { getAllReviewers } = useReviewers();

  const loadReviewerOptions = async () => {
    try {
      const reviewers = await getAllReviewers();
      setSourceReviewers(reviewers);
    } catch (error) {
      toast.error(error.message || "Failed to load reviewers.");
    }
  };

  const loadApplications = async (
    page = 1,
    pageSizeOverride = pageSize,
    overrides = {},
  ) => {
    setLoading(true);
    try {
      const effectiveReviewerId =
        overrides.reviewerId ?? reviewerFilter ?? null;
      const effectiveStatus =
        overrides.applicationStatus ?? statusFilter ?? null;
      const effectiveRsaPin = overrides.rsaPin ?? rsaPinFilter ?? null;
      const effectiveCreatedFromDate =
        overrides.createdFromDate ?? createdFromDate;
      const effectiveCreatedToDate = overrides.createdToDate ?? createdToDate;
      const effectiveSubmittedFromDate =
        overrides.submittedFromDate ?? submittedFromDate;
      const effectiveSubmittedToDate =
        overrides.submittedToDate ?? submittedToDate;

      const data = await getBulkReassignmentApplications({
        pageNumber: page,
        pageSize: pageSizeOverride,
        sortBy,
        sortDescending,
        reviewerId: effectiveReviewerId,
        applicationStatus: effectiveStatus,
        rsaPin: effectiveRsaPin,
        createdFromDate: effectiveCreatedFromDate || null,
        createdToDate: effectiveCreatedToDate || null,
        submittedFromDate: effectiveSubmittedFromDate || null,
        submittedToDate: effectiveSubmittedToDate || null,
      });

      const appsList =
        data?.applications ||
        data?.data ||
        data?.items ||
        (Array.isArray(data) ? data : []);
      setApplications(appsList || []);
      setPageNumber(
        Number.isFinite(data?.pageNumber) && data.pageNumber > 0
          ? data.pageNumber
          : page,
      );
      setPageSize(
        Number.isFinite(data?.pageSize) && data.pageSize > 0
          ? data.pageSize
          : pageSizeOverride,
      );
      setTotalPages(
        Number.isFinite(data?.totalPages) && data.totalPages > 0
          ? data.totalPages
          : 1,
      );
      setTotalCount(data?.totalCount || data?.applications?.length || 0);
      setSummary(data?.summary || {});
      setReviewerWorkloads(data?.summary?.reviewerWorkloads || []);
      // Kick off HNI checks for the loaded applications
      checkHniForApplications(appsList || []);
      setSelectedAssignmentIds([]);
    } catch (error) {
      toast.error(
        error.message || "Failed to load bulk reassignment applications.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewerOptions();
    loadApplications(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkHniForApplications = async (apps) => {
    if (!Array.isArray(apps) || apps.length === 0) return;

    const next = {};
    await Promise.all(
      apps.map(async (item) => {
        const rsaPin = item.rsaPin || item.RsaPin || null;

        const key =
          item.assignmentId ||
          item.id ||
          item.applicationId ||
          item.applicationNumber;

        if (!rsaPin) {
          next[key] = false;
          return;
        }

        try {
          const balance = await getBalanceByRsaPin(rsaPin);
          next[key] = balance !== null && balance >= HNI_THRESHOLD;
        } catch (err) {
          next[key] = false;
        }
      }),
    );

    setHniMap((prev) => ({ ...prev, ...next }));
  };

  const applicationKey = (item) =>
    item.assignmentId ||
    item.id ||
    item.applicationId ||
    item.applicationNumber;

  const toggleAssignment = (assignmentId, isActive) => {
    if (!isActive) return;
    setSelectedAssignmentIds((prev) =>
      prev.includes(assignmentId)
        ? prev.filter((value) => value !== assignmentId)
        : [...prev, assignmentId],
    );
  };

  const handleBulkSuccess = () => {
    setSelectedAssignmentIds([]);
    setIsBulkModalOpen(false);
    loadApplications(pageNumber);
  };

  const applyFilters = async () => {
    setPageNumber(1);
    await loadApplications(1, pageSize);
  };

  const handleResetFilters = async () => {
    setReviewerFilter("");
    setStatusFilter("");
    setRsaPinFilter("");
    setCreatedFromDate("");
    setCreatedToDate("");
    setSubmittedFromDate("");
    setSubmittedToDate("");
    setPageNumber(1);
    await loadApplications(1, pageSize, {
      reviewerId: null,
      applicationStatus: null,
      rsaPin: null,
      createdFromDate: "",
      createdToDate: "",
      submittedFromDate: "",
      submittedToDate: "",
    });
  };

  const changePage = async (nextPage) => {
    setPageNumber(nextPage);
    await loadApplications(nextPage);
  };

  const summaryItems = useMemo(
    () => [
      {
        label: "Total active applications",
        value: summary.totalActiveApplications ?? totalCount ?? "—",
      },
      {
        label: "Unique reviewers",
        value: summary.uniqueReviewerCount ?? sourceReviewers.length ?? "—",
      },
      {
        label: "Overdue applications",
        value: summary.overdueApplicationsCount ?? "—",
      },
      {
        label: "Average assigned hours",
        value:
          summary.averageAssignedHours !== undefined
            ? summary.averageAssignedHours
            : "—",
      },
    ],
    [summary, totalCount, sourceReviewers.length],
  );

  return (
    <div className="space-y-6 min-w-0">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Bulk Reassignments
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Browse applications ready for reassignment, filter by reviewer or
              status, and reassign selected assignments in bulk.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadApplications(pageNumber)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-gray-200 bg-slate-50 p-5"
          >
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-gray-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Reviewer filter
              </label>
              <select
                value={reviewerFilter}
                onChange={(e) => setReviewerFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
              >
                <option value="">All reviewers</option>
                {sourceReviewers.map((reviewer) => (
                  <option key={reviewer.reviewerId} value={reviewer.reviewerId}>
                    {reviewer.reviewerName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
              >
                {statusOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                RSA PIN
              </label>
              <input
                type="text"
                value={rsaPinFilter}
                onChange={(e) => setRsaPinFilter(e.target.value)}
                placeholder="Search RSA PIN"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Created from
              </label>
              <input
                type="date"
                value={createdFromDate}
                onChange={(e) => setCreatedFromDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Created to
              </label>
              <input
                type="date"
                value={createdToDate}
                onChange={(e) => setCreatedToDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Submitted from
              </label>
              <input
                type="date"
                value={submittedFromDate}
                onChange={(e) => setSubmittedFromDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Submitted to
              </label>
              <input
                type="date"
                value={submittedToDate}
                onChange={(e) => setSubmittedToDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={applyFilters}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Apply filters
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset
            </button>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Sort order
              </label>
              <select
                value={sortDescending ? "desc" : "asc"}
                onChange={(e) => setSortDescending(e.target.value === "desc")}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Select
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Application #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Borrower
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    RSA PIN
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 w-20">
                    HNI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Reviewer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Hours
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Loan Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {applications.map((item) => {
                  const assignmentId = applicationKey(item);
                  const isActive = item.isActive ?? item.active ?? false;
                  const borrowerName = [
                    item.borrowerFirstName,
                    item.borrowerLastName,
                    item.borrowerName,
                  ]
                    .filter(Boolean)
                    .join(" ");
                  const assignedForHours =
                    item.assignedForHours ??
                    item.assignedHours ??
                    item.duration ??
                    item.assignedHours;
                  const loanAmount =
                    item.loanAmount ?? item.loanAmount ?? item.amount;

                  return (
                    <tr
                      key={
                        assignmentId ||
                        item.applicationId ||
                        item.applicationNumber
                      }
                    >
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedAssignmentIds.includes(assignmentId)}
                          disabled={!isActive}
                          onChange={() =>
                            toggleAssignment(assignmentId, isActive)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                        {item.applicationNumber || item.applicationId || "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {borrowerName || "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {item.rsaPin || item.rsaPin || "—"}
                      </td>
                      <td className="px-2 py-4 text-center">
                        {hniMap[assignmentId] ? (
                          <span className="inline-block text-sm font-extrabold text-white bg-green-600 px-2 py-1 rounded-md shadow">
                            HNI
                          </span>
                        ) : (
                          <span className="inline-block w-6" />
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {item.reviewerName || item.currentReviewerName || "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {item.applicationPriority || item.priority || "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {item.applicationStatus || item.status || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {assignedForHours !== undefined &&
                        assignedForHours !== null
                          ? `${Number(assignedForHours).toFixed(1)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {loanAmount != null
                          ? `₦${Number(loanAmount).toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedApplicationForDetails({
                              id: item.applicationId || item.id || assignmentId,
                              applicationNumber:
                                item.applicationNumber || item.applicationId,
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {applications.length === 0 && !loading && (
            <div className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
              No applications available for bulk reassignment.
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              Page {pageNumber} of {totalPages}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={pageNumber <= 1 || loading}
                onClick={() => changePage(Math.max(1, pageNumber - 1))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pageNumber >= totalPages || loading}
                onClick={() => changePage(Math.min(totalPages, pageNumber + 1))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
              <select
                value={pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setPageSize(newSize);
                  setPageNumber(1);
                  loadApplications(1, newSize);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-green-500 focus:outline-none"
              >
                {[25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-gray-200 bg-slate-50 p-6">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm font-medium text-gray-900">
              Selected applications
            </p>
            <p className="mt-2 text-sm text-gray-600">
              {selectedAssignmentIds.length} application(s) selected for
              reassignment.
            </p>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm font-medium text-gray-900">
              Reviewer workloads
            </p>
            <div className="mt-3 space-y-3">
              {reviewerWorkloads.length > 0 ? (
                reviewerWorkloads.slice(0, 6).map((reviewer) => (
                  <div
                    key={reviewer.reviewerId}
                    className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-gray-700"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {reviewer.reviewerName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {reviewer.reviewerEmail || reviewer.email || ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p>
                        {reviewer.assignmentCount ??
                          reviewer.activeAssignments ??
                          "—"}{" "}
                        apps
                      </p>
                      <p className="text-xs text-gray-500">
                        {reviewer.averageAssignedHours ?? "—"} hrs avg
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  Reviewer workload details are unavailable.
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            disabled={selectedAssignmentIds.length === 0}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reassign selected applications
          </button>
        </div>
      </div>

      <BulkReassignmentModal
        isOpen={isBulkModalOpen}
        assignmentIds={selectedAssignmentIds}
        sourceReviewerId={reviewerFilter}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={handleBulkSuccess}
      />

      {selectedApplicationForDetails && (
        <ApplicationReviewModal
          application={selectedApplicationForDetails}
          onClose={() => setSelectedApplicationForDetails(null)}
        />
      )}
    </div>
  );
};

export default LeadReviewerReassignments;
