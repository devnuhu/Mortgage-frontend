import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { useReviewers } from "../../hooks/useReviewers";
import {
  checkDelayedAssignments,
  getActiveEscalations,
  getReviewerEscalations,
  resolveEscalation,
} from "../../services/analyticsService";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "triggered", label: "Triggered" },
  { value: "notified", label: "Notified" },
  { value: "reassigned", label: "Reassigned" },
  { value: "escalated_to_lead", label: "Escalated to Lead" },
];

const normalizeEscalationList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.escalations)) return data.escalations;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

const LeadReviewerEscalations = () => {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEscalationId, setSelectedEscalationId] = useState(null);
  const [resolutionComments, setResolutionComments] = useState("");
  const [resolvingId, setResolvingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [triggeringCheck, setTriggeringCheck] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewerFilter, setReviewerFilter] = useState("");
  const [reviewers, setReviewers] = useState([]);

  const { getAllReviewers } = useReviewers();

  const fetchReviewers = async () => {
    try {
      const list = await getAllReviewers();
      setReviewers(list);
    } catch (err) {
      console.error("Failed to load reviewer list:", err);
    }
  };

  const loadEscalations = async (filterReviewerId = reviewerFilter) => {
    try {
      setLoading(true);
      setError(null);
      const data = filterReviewerId
        ? await getReviewerEscalations(filterReviewerId)
        : await getActiveEscalations();
      setEscalations(normalizeEscalationList(data));
    } catch (err) {
      console.error("Error loading active escalations:", err);
      const message = err?.response?.data?.message || err?.message;
      setError(
        message || "Unable to load active escalations. Please try again.",
      );
      toast.error(message || "Failed to load escalations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewers();
    loadEscalations();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEscalations();
    setRefreshing(false);
  };

  const handleReviewerFilterChange = async (reviewerId) => {
    setReviewerFilter(reviewerId);
    await loadEscalations(reviewerId);
  };

  const handleTriggerCheck = async () => {
    try {
      setTriggeringCheck(true);
      setError(null);
      const response = await checkDelayedAssignments();
      const message = response?.message || "Escalation check completed";
      toast.success(message);
      await loadEscalations();
    } catch (err) {
      console.error("Error checking delayed assignments:", err);
      const message = err?.response?.data?.message || err?.message;
      setError(message || "Unable to run escalation check. Please try again.");
      toast.error(message || "Failed to run escalation check");
    } finally {
      setTriggeringCheck(false);
    }
  };

  const selectedEscalation = useMemo(
    () => escalations.find((item) => item.id === selectedEscalationId),
    [escalations, selectedEscalationId],
  );

  const filteredEscalations = useMemo(() => {
    return escalations.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [escalations, statusFilter]);

  const handleResolve = async () => {
    if (!selectedEscalation) {
      return;
    }

    if (!resolutionComments.trim()) {
      toast.error("Please provide resolution comments before resolving.");
      return;
    }

    try {
      setResolvingId(selectedEscalation.id);
      await resolveEscalation(selectedEscalation.id, {
        resolutionComments: resolutionComments.trim(),
      });
      toast.success("Escalation resolved successfully.");
      setSelectedEscalationId(null);
      setResolutionComments("");
      await loadEscalations();
    } catch (err) {
      console.error("Error resolving escalation:", err);
      const message = err?.response?.data?.message || err?.message;
      toast.error(message || "Failed to resolve escalation. Please try again.");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Escalations
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View active escalations, filter by status or reviewer, and resolve
              urgent exceptions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Refresh
            </button>
            <button
              type="button"
              onClick={handleTriggerCheck}
              disabled={triggeringCheck}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {triggeringCheck ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Check Delayed Assignments
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Filter by Status
          </label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Filter by Reviewer
          </label>
          <select
            value={reviewerFilter}
            onChange={(event) => handleReviewerFilterChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All reviewers</option>
            {reviewers.map((reviewer) => (
              <option key={reviewer.reviewerId} value={reviewer.reviewerId}>
                {reviewer.reviewerName || reviewer.reviewerEmail}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col justify-end text-sm text-gray-500">
          <p className="font-medium text-gray-700">Active escalations</p>
          <p>
            {filteredEscalations.length} item
            {filteredEscalations.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Application
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Rule
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Hours Over
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Reassigned To
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Escalated At
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredEscalations.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {item.applicationId || item.applicationNumber || "N/A"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {item.ruleName || item.escalationRuleId || "N/A"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {item.hoursOverThreshold ?? "N/A"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {item.status}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {item.reassignedToReviewerId || "Not reassigned"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {item.escalatedAt
                      ? new Date(item.escalatedAt).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedEscalationId(
                          selectedEscalationId === item.id ? null : item.id,
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      View details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        ) : filteredEscalations.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            No active escalations found.
          </div>
        ) : null}
      </div>

      {selectedEscalation && (
        <div className="rounded-lg border border-gray-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Escalation details
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Review the escalation and provide resolution comments.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEscalationId(null)}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900"
            >
              Close
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">Application</p>
              <p className="text-sm text-gray-900">
                {selectedEscalation.applicationId || "N/A"}
              </p>
              <p className="text-sm font-semibold text-gray-700">Rule</p>
              <p className="text-sm text-gray-900">
                {selectedEscalation.ruleName ||
                  selectedEscalation.escalationRuleId}
              </p>
              <p className="text-sm font-semibold text-gray-700">Status</p>
              <p className="text-sm text-gray-900">
                {selectedEscalation.status}
              </p>
              <p className="text-sm font-semibold text-gray-700">
                Hours Over Threshold
              </p>
              <p className="text-sm text-gray-900">
                {selectedEscalation.hoursOverThreshold ?? "N/A"}
              </p>
            </div>

            <div className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">
                Reassigned Reviewer
              </p>
              <p className="text-sm text-gray-900">
                {selectedEscalation.reassignedToReviewerId || "Not reassigned"}
              </p>
              <p className="text-sm font-semibold text-gray-700">
                Escalated At
              </p>
              <p className="text-sm text-gray-900">
                {selectedEscalation.escalatedAt
                  ? new Date(selectedEscalation.escalatedAt).toLocaleString()
                  : "N/A"}
              </p>
              <p className="text-sm font-semibold text-gray-700">
                Action Reason
              </p>
              <p className="text-sm text-gray-900">
                {selectedEscalation.actionReason ||
                  "No action reason provided."}
              </p>
              <p className="text-sm font-semibold text-gray-700">
                Assignment ID
              </p>
              <p className="text-sm text-gray-900">
                {selectedEscalation.applicationAssignmentId || "N/A"}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3 rounded-lg bg-white p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700">
              Resolution comments
            </label>
            <textarea
              value={resolutionComments}
              onChange={(event) => setResolutionComments(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <p className="text-xs text-gray-500">
                Resolution comments are optional but recommended for audit
                trail.
              </p>
              <button
                type="button"
                onClick={handleResolve}
                disabled={resolvingId === selectedEscalation.id}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resolvingId === selectedEscalation.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Resolve Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-slate-50 p-5">
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="h-4 w-4" />
          <p className="text-sm">
            Active escalations are shown here. Resolved escalations are filtered
            out by design.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeadReviewerEscalations;
