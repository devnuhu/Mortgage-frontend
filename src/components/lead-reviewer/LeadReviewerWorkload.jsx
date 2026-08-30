import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  CheckCircle2,
  ArrowUpRight,
  RefreshCcw,
  AlertTriangle,
  Clock3,
  BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getReviewersWorkload,
  getWorkloadSuggestions,
  getUnavailableReviewers,
  markReviewerAvailable,
} from "../../services/analyticsService";

const getRiskBadgeClasses = (riskValue) => {
  const normalizedRisk = String(riskValue || "")
    .trim()
    .toLowerCase();

  if (
    normalizedRisk.includes("critical") ||
    normalizedRisk.includes("high") ||
    normalizedRisk.includes("at risk") ||
    normalizedRisk.includes("overloaded")
  ) {
    return "bg-red-500";
  }

  if (
    normalizedRisk.includes("moderate") ||
    normalizedRisk.includes("watch") ||
    normalizedRisk.includes("medium") ||
    normalizedRisk.includes("warning")
  ) {
    return "bg-amber-500";
  }

  if (
    normalizedRisk.includes("low") ||
    normalizedRisk.includes("healthy") ||
    normalizedRisk.includes("stable") ||
    normalizedRisk.includes("normal") ||
    normalizedRisk.includes("good")
  ) {
    return "bg-emerald-500";
  }

  return "bg-slate-400";
};

const LeadReviewerWorkload = () => {
  const [reviewers, setReviewers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [unavailable, setUnavailable] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(null);
  const [sortBy, setSortBy] = useState("reviewerName");
  const [sortDescending, setSortDescending] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadWorkload = async () => {
    try {
      setLoading(true);
      const [workloadData, suggestionData, unavailableData] = await Promise.all(
        [
          getReviewersWorkload(pageNumber, pageSize, sortBy, sortDescending),
          getWorkloadSuggestions(),
          getUnavailableReviewers(),
        ],
      );

      setReviewers(workloadData.data || []);
      setSummary(workloadData.summary || null);
      setTotalCount(workloadData.totalCount || null);
      setSuggestions(suggestionData.suggestions || []);
      setUnavailable(unavailableData.reviewers || []);
    } catch (error) {
      toast.error(error.message || "Failed to load workload data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkload();
  }, [pageNumber, sortBy, sortDescending]);

  const handleMarkAvailable = async (reviewerId) => {
    try {
      await markReviewerAvailable(reviewerId);
      toast.success("Reviewer marked as available");
      loadWorkload();
    } catch (error) {
      toast.error(error.message || "Failed to update reviewer availability.");
    }
  };

  const capacityAlert = useMemo(
    () => reviewers.some((reviewer) => reviewer.workloadPercentage >= 90),
    [reviewers],
  );

  const summaryCards = useMemo(() => {
    if (!summary) return [];

    return [
      {
        label: "Total reviewers",
        value: summary.totalReviewers ?? reviewers.length,
        icon: Users,
      },
      {
        label: "Team workload",
        value: `${summary.teamCapacityUtilization ?? 0}%`,
        icon: BarChart3,
      },
      {
        label: "Avg. turnaround",
        value: `${summary.teamAverageTurnaroundTime ?? 0}h`,
        icon: Clock3,
      },
      {
        label: "At risk",
        value: summary.reviewersAtRisk ?? 0,
        icon: AlertTriangle,
      },
    ];
  }, [reviewers.length, summary]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Workload Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              See each reviewer workload, availability, and suggestions for
              rebalancing.
            </p>
          </div>
          <button
            type="button"
            onClick={loadWorkload}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{card.label}</p>
                <Icon className="h-4 w-4 text-gray-400" />
              </div>
              <p className="mt-3 text-2xl font-semibold text-gray-900">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Workload distribution
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Reviewer load, approval rate, and turnaround metrics.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-500">
                Sort by
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPageNumber(1);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
                >
                  <option value="reviewername">Reviewer name</option>
                  <option value="workload">Workload</option>
                  <option value="activeassignments">Active assignments</option>
                  <option value="approvalrate">Approval rate</option>
                  <option value="turnaroundtime">Turnaround time</option>
                  <option value="performancerating">Performance rating</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-500">
                Direction
                <select
                  value={String(sortDescending)}
                  onChange={(e) => {
                    setSortDescending(e.target.value === "true");
                    setPageNumber(1);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
                >
                  <option value="false">Ascending</option>
                  <option value="true">Descending</option>
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span>
                Page {pageNumber}
                {totalCount != null
                  ? ` of ${Math.max(1, Math.ceil(totalCount / pageSize))}`
                  : ""}
              </span>
              <button
                type="button"
                onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                disabled={pageNumber <= 1}
                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => {
                  if (totalCount != null) {
                    setPageNumber((prev) =>
                      Math.min(
                        prev + 1,
                        Math.max(1, Math.ceil(totalCount / pageSize)),
                      ),
                    );
                  } else {
                    setPageNumber((prev) => prev + 1);
                  }
                }}
                disabled={
                  totalCount != null &&
                  pageNumber >= Math.max(1, Math.ceil(totalCount / pageSize))
                }
                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Reviewer Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Active
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Pending
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Approval
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Turnaround
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Capacity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Risk
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {reviewers.map((reviewer) => (
                  <tr key={reviewer.reviewerId}>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {reviewer.reviewerName}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {reviewer.activeAssignments}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {reviewer.pendingAssignments}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {reviewer.totalAssignments}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {reviewer.approvalRatePercentage?.toFixed?.(1) ??
                        reviewer.approvalRatePercentage}
                      %
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {reviewer.averageTurnaroundTimeHours?.toFixed?.(1) ??
                        reviewer.averageTurnaroundTimeHours}
                      h
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {reviewer.capacityUtilizationPercentage?.toFixed?.(1) ??
                        reviewer.workloadPercentage?.toFixed?.(1) ??
                        reviewer.workloadPercentage}
                      %
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      <span
                        title={
                          reviewer.capacityStatus ||
                          reviewer.burnoutRisk ||
                          reviewer.performanceRating
                        }
                        className={`inline-block h-3.5 w-3.5 rounded-full ${getRiskBadgeClasses(
                          reviewer.capacityStatus ||
                            reviewer.burnoutRisk ||
                            reviewer.performanceRating,
                        )}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Workload suggestions
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Recommendations for balancing review assignments.
            </p>

            <div className="mt-6 max-h-[calc(100vh-24rem)] overflow-y-auto space-y-3">
              {suggestions.length > 0 ? (
                suggestions.map((item, index) => (
                  <div
                    key={`${item.fromReviewerId}-${item.toReviewerId}-${index}`}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {item.reason}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Move {item.applicationCount} application(s) from{" "}
                      {item.fromReviewerId} to {item.toReviewerId}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Estimated impact: {item.estimatedImpact}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No workload suggestions available.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Unavailable reviewers
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Track unavailable or on-leave reviewers.
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-700" />
            </div>

            <div className="mt-6 space-y-3">
              {unavailable.length > 0 ? (
                unavailable.map((reviewer) => (
                  <div
                    key={reviewer.reviewerId}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {reviewer.reviewerName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {reviewer.status} ·{" "}
                          {reviewer.reason || "No reason provided"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMarkAvailable(reviewer.reviewerId)}
                        className="inline-flex items-center rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        Mark available
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Ends: {reviewer.endDate || "Not specified"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No unavailable reviewers at this time.
                </p>
              )}
            </div>
          </div>

          {capacityAlert && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              One or more reviewers are at or above 90% workload capacity.
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-slate-50 p-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Review capacity alert
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Use the workload suggestions panel to reassign work from
                overloaded reviewers.
              </p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadReviewerWorkload;
