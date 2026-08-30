import React, { useEffect, useMemo, useState } from "react";
import { Clock, Repeat, UserCheck, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import { useReviewers } from "../../hooks/useReviewers";
import {
  getReassignmentHistory,
  getReviewerReassignmentHistory,
  getReassignmentMetrics,
  getReviewerAssignments,
} from "../../services/analyticsService";

const LeadReviewerReassignmentHistory = () => {
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [reviewers, setReviewers] = useState([]);
  const [reviewerFilter, setReviewerFilter] = useState("");
  const [days, setDays] = useState(30);
  const [pageSize, setPageSize] = useState(100);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reviewerAssignments, setReviewerAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const { getAllReviewers } = useReviewers();

  const loadReviewers = async () => {
    try {
      const data = await getAllReviewers();
      setReviewers(data || []);
    } catch (error) {
      toast.error(error.message || "Failed to load reviewers.");
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await getReassignmentMetrics();
      setMetrics(data || {});
    } catch (error) {
      toast.error(error.message || "Failed to load reassignment metrics.");
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      setLoading(true);
      const data = reviewerFilter
        ? await getReviewerReassignmentHistory(reviewerFilter, days)
        : await getReassignmentHistory(days, pageSize);

      setHistory(data?.history || data || []);
    } catch (error) {
      toast.error(error.message || "Failed to load reassignment history.");
    } finally {
      setHistoryLoading(false);
      setLoading(false);
    }
  };

  const loadReviewerAssignments = async (reviewerId) => {
    if (!reviewerId) {
      setReviewerAssignments([]);
      return;
    }

    try {
      setAssignmentsLoading(true);
      const data = await getReviewerAssignments(reviewerId);
      setReviewerAssignments(data || []);
    } catch (error) {
      toast.error(error.message || "Failed to load reviewer assignments.");
    } finally {
      setAssignmentsLoading(false);
    }
  };

  useEffect(() => {
    loadReviewers();
    loadMetrics();
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadHistory();
    loadReviewerAssignments(reviewerFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewerFilter, days]);

  const selectedReviewer = useMemo(
    () => reviewers.find((item) => item.reviewerId === reviewerFilter) || null,
    [reviewers, reviewerFilter],
  );

  const summaryCards = [
    {
      label: "Total reassignments",
      value: metrics?.totalReassignments ?? "—",
    },
    {
      label: "Manual reassignments",
      value: metrics?.manualReassignments ?? "—",
    },
    {
      label: "Automatic reassignments",
      value: metrics?.automaticReassignments ?? "—",
    },
    {
      label: "Avg reassignments per reviewer",
      value: metrics?.averageReassignmentsPerReviewer ?? "—",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Reassignment History
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View audit history for assignment reassignments and reviewer-level
              trends.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              loadMetrics();
              loadHistory();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh history
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-gray-100 bg-slate-50 p-4"
              >
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold text-gray-900">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics?.reassignmentsByReason &&
              Object.entries(metrics.reassignmentsByReason).map(
                ([reason, value]) => (
                  <div
                    key={reason}
                    className="rounded-2xl border border-gray-100 bg-slate-50 p-4"
                  >
                    <p className="text-sm uppercase tracking-wide text-gray-500">
                      {reason}
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-gray-900">
                      {value}
                    </p>
                  </div>
                ),
              )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-slate-50 p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Reviewer filter
              </p>
              <p className="text-sm text-gray-500">
                Filter history by reviewer, or leave blank for all
                reassignments.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reviewer
                </label>
                <select
                  value={reviewerFilter}
                  onChange={(event) => setReviewerFilter(event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
                >
                  <option value="">All reviewers</option>
                  {reviewers.map((reviewer) => (
                    <option
                      key={reviewer.reviewerId}
                      value={reviewer.reviewerId}
                    >
                      {reviewer.reviewerName || reviewer.reviewerEmail}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Days to show
                </label>
                <input
                  type="number"
                  min={1}
                  value={days}
                  onChange={(event) => setDays(Number(event.target.value))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Record limit
                </label>
                <input
                  type="number"
                  min={1}
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>

            {selectedReviewer && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-sm font-semibold text-gray-900">
                  Selected reviewer
                </p>
                <p className="text-sm text-gray-600">
                  {selectedReviewer.reviewerName}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedReviewer.reviewerEmail}
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  Current reviewer assignments are shown below.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">
                  Current assignments
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                  {assignmentsLoading ? "Loading" : reviewerAssignments.length}
                </span>
              </div>
              {selectedReviewer ? (
                reviewerAssignments.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-gray-700">
                    {reviewerAssignments.slice(0, 5).map((assignment) => (
                      <li
                        key={
                          assignment.applicationId ||
                          assignment.id ||
                          assignment.assignmentId
                        }
                      >
                        {assignment.applicationRefNumber ||
                          assignment.applicationId ||
                          assignment.applicationNumber}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">
                    No current assignments found for this reviewer.
                  </p>
                )
              ) : (
                <p className="mt-3 text-sm text-gray-500">
                  Select a reviewer to view current assignments.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Reassignment events
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Audit trail of assignment reassignments from the last {days} days.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-gray-700">
            <Repeat className="h-4 w-4" /> {history.length} records
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">App Ref</th>
                <th className="px-4 py-3">Previous reviewer</th>
                <th className="px-4 py-3">New reviewer</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">By</th>
                <th className="px-4 py-3">At</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {historyLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    Loading reassignment history...
                  </td>
                </tr>
              ) : history.length > 0 ? (
                history.map((item) => (
                  <tr
                    key={
                      item.id ||
                      item.applicationId ||
                      `${item.applicationId}-${item.reassignedAt}`
                    }
                  >
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {item.applicationRefNumber || item.applicationId || "—"}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {item.previousReviewerName || "—"}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {item.newReviewerName || "—"}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {item.reassignmentReason || "—"}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {item.reassignmentDetails || "—"}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {item.reassignedByUserName || "—"}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {item.reassignedAt
                        ? new Date(item.reassignedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {item.newAssignmentStatus ||
                          item.previousAssignmentStatus ||
                          "—"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No reassignment history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadReviewerReassignmentHistory;
