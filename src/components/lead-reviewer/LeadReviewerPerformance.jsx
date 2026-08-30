import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, TrendingUp, ArrowUpRight, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "../ui/ConfirmModal";
import {
  getReviewerPerformanceAll,
  getReviewerPerformance,
  getReviewerTurnaroundTime,
  getReviewerHoursSummary,
  getTopPerformers,
  getBottomPerformers,
  recalcAllMetrics,
} from "../../services/analyticsService";

const LeadReviewerPerformance = () => {
  const [metrics, setMetrics] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [bottomPerformers, setBottomPerformers] = useState([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");
  const [reviewerDetails, setReviewerDetails] = useState(null);
  const [turnaroundDays, setTurnaroundDays] = useState(30);
  const [turnaroundData, setTurnaroundData] = useState(null);
  const [hoursSummary, setHoursSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [topCount, setTopCount] = useState(5);
  const [bottomCount, setBottomCount] = useState(5);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const [allData, topData, bottomData] = await Promise.all([
        getReviewerPerformanceAll(),
        getTopPerformers(topCount),
        getBottomPerformers(bottomCount),
      ]);
      setMetrics(Array.isArray(allData) ? allData : allData.metrics || []);
      setTopPerformers(
        Array.isArray(topData) ? topData : topData.topPerformers || [],
      );
      setBottomPerformers(
        Array.isArray(bottomData)
          ? bottomData
          : bottomData.bottomPerformers || [],
      );
    } catch (error) {
      toast.error(error.message || "Failed to load performance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformanceData();
  }, []);

  useEffect(() => {
    if (!selectedReviewerId && metrics.length) {
      const firstReviewer = metrics.find(
        (item) => item.reviewerId || item.id || item.reviewerID,
      );
      if (firstReviewer) {
        setSelectedReviewerId(
          firstReviewer.reviewerId ||
            firstReviewer.id ||
            firstReviewer.reviewerID,
        );
      }
    }
  }, [metrics, selectedReviewerId]);

  useEffect(() => {
    const loadReviewerDetail = async () => {
      if (!selectedReviewerId) return;

      try {
        setLoading(true);
        const [detailData, turnaround, hoursSummaryData] = await Promise.all([
          getReviewerPerformance(selectedReviewerId),
          getReviewerTurnaroundTime(selectedReviewerId, turnaroundDays),
          getReviewerHoursSummary(selectedReviewerId),
        ]);

        setReviewerDetails(detailData);
        setTurnaroundData(turnaround);
        setHoursSummary(hoursSummaryData);
      } catch (error) {
        toast.error(
          error.message || "Failed to load reviewer performance details",
        );
      } finally {
        setLoading(false);
      }
    };

    loadReviewerDetail();
  }, [selectedReviewerId, turnaroundDays]);

  const handleRecalculate = async () => {
    try {
      setLoading(true);
      await recalcAllMetrics();
      toast.success("Recalculation triggered successfully.");
      loadPerformanceData();
    } catch (error) {
      toast.error(error.message || "Failed to recalculate metrics");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const handleOpenConfirm = () => {
    setConfirmOpen(true);
  };

  const handleCancelConfirm = () => {
    setConfirmOpen(false);
  };

  const handleReviewerChange = (event) => {
    setSelectedReviewerId(event.target.value);
  };

  const summary = useMemo(() => {
    if (!metrics.length) return [];
    const totalReviewers = metrics.length;

    const sum = (key) =>
      metrics.reduce((acc, item) => acc + (Number(item?.[key]) || 0), 0);

    const averageApprovalRate = (
      sum("approvalRatePercentage") / totalReviewers
    ).toFixed(1);
    const averageTurnaround = (
      sum("averageTurnaroundTimeHours") / totalReviewers
    ).toFixed(1);
    const averageRejectionRate = (
      sum("rejectionRatePercentage") / totalReviewers
    ).toFixed(1);
    const averageRevisionRequestRate = (
      sum("revisionRequestRatePercentage") / totalReviewers
    ).toFixed(1);
    const averageHoursPerAssignment =
      sum("averageHoursPerAssignment") ||
      sum("averageHoursPerAssignmentHours") ||
      0;
    const totalEscalated =
      sum("escalatedAssignments") || sum("escalatedCount") || 0;
    const totalCompleted =
      sum("completedAssignments") || sum("completedCount") || 0;

    return [
      { label: "Reviewers tracked", value: totalReviewers },
      { label: "Avg. approval rate", value: `${averageApprovalRate}%` },
      { label: "Avg. turnaround (hrs)", value: `${averageTurnaround} hrs` },
      { label: "Avg. rejection rate", value: `${averageRejectionRate}%` },
      { label: "Avg. revision rate", value: `${averageRevisionRequestRate}%` },
      {
        label: "Avg hrs / assignment",
        value: averageHoursPerAssignment
          ? `${averageHoursPerAssignment.toFixed(1)} hrs`
          : "N/A",
      },
      { label: "Escalated assignments", value: totalEscalated },
      { label: "Completed assignments", value: totalCompleted },
    ];
  }, [metrics]);

  // Simple sparkline generator from an array of numeric values
  const Sparkline = ({ values = [], width = 120, height = 24 }) => {
    if (!values || values.length === 0)
      return <div className="text-xs text-gray-400">No data</div>;
    const nums = values.map((v) => Number(v) || 0);
    const max = Math.max(...nums) || 1;
    const min = Math.min(...nums);
    const points = nums
      .map((v, i) => {
        const x = (i / (nums.length - 1)) * width;
        const y = height - ((v - min) / (max - min || 1)) * height;
        return `${x},${y}`;
      })
      .join(" ");
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke="#10B981"
          strokeWidth="1.5"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Performance Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitor reviewer performance trends, top and bottom performers,
              and recalculate metrics when needed.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className="h-4 w-4" /> Recalculate metrics
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {summary.map((item) => (
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

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Reviewer details
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              View performance and turnaround metrics for a selected reviewer.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr] xl:grid-cols-[2fr_1fr]">
            <label className="block text-sm text-gray-500">
              Reviewer
              <select
                value={selectedReviewerId}
                onChange={handleReviewerChange}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              >
                {metrics.map((reviewer) => {
                  const reviewerId =
                    reviewer.reviewerId || reviewer.id || reviewer.reviewerID;
                  const reviewerName =
                    reviewer.reviewerName || reviewer.name || reviewer.fullName;
                  return (
                    <option key={reviewerId} value={reviewerId}>
                      {reviewerName || reviewerId}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="block text-sm text-gray-500">
              Time window
              <select
                value={turnaroundDays}
                onChange={(e) => setTurnaroundDays(Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
            <p className="text-sm text-gray-500">Review summary</p>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Total assignments</span>
                <span className="font-semibold">
                  {reviewerDetails?.totalAssignments ?? "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Active assignments</span>
                <span className="font-semibold">
                  {reviewerDetails?.activeAssignments ?? "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Approved</span>
                <span className="font-semibold">
                  {reviewerDetails?.approvedCount ?? "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rejected</span>
                <span className="font-semibold">
                  {reviewerDetails?.rejectedCount ?? "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Revision requests</span>
                <span className="font-semibold">
                  {reviewerDetails?.revisionRequestedCount ??
                    reviewerDetails?.revisionCount ??
                    "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
            <p className="text-sm text-gray-500">Performance metrics</p>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Approval rate</span>
                <span className="font-semibold">
                  {reviewerDetails?.approvalRatePercentage?.toFixed?.(1) ??
                    reviewerDetails?.approvalRatePercentage ??
                    "N/A"}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rejection rate</span>
                <span className="font-semibold">
                  {reviewerDetails?.rejectionRatePercentage?.toFixed?.(1) ??
                    reviewerDetails?.rejectionRatePercentage ??
                    "N/A"}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Revision request rate</span>
                <span className="font-semibold">
                  {reviewerDetails?.revisionRequestRatePercentage?.toFixed?.(
                    1,
                  ) ??
                    reviewerDetails?.revisionRequestRatePercentage ??
                    "N/A"}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Avg turnaround</span>
                <span className="font-semibold">
                  {reviewerDetails?.averageTurnaroundTimeHours?.toFixed?.(1) ??
                    reviewerDetails?.averageTurnaroundTimeHours ??
                    "N/A"}
                  h
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Performance rating</span>
                <span className="font-semibold">
                  {reviewerDetails?.performanceRating ?? "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
            <p className="text-sm text-gray-500">Turnaround time</p>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Average turnaround</span>
                <span className="font-semibold">
                  {turnaroundData?.averageTurnaroundTimeHours?.toFixed?.(1) ??
                    turnaroundData?.averageTurnaroundHours ??
                    "N/A"}
                  h
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Historical window</span>
                <span className="font-semibold">{turnaroundDays} days</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
            <p className="text-sm text-gray-500">Hours summary</p>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Total hours logged</span>
                <span className="font-semibold">
                  {hoursSummary?.totalHours ?? hoursSummary?.hours ?? "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Average hours / assignment</span>
                <span className="font-semibold">
                  {hoursSummary?.averageHoursPerAssignment ?? "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Assignments counted</span>
                <span className="font-semibold">
                  {hoursSummary?.assignmentCount ?? "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between gap-2 text-gray-900 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Top performers</h2>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Show</label>
              <select
                value={topCount}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setTopCount(v);
                  loadPerformanceData();
                }}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
              >
                {[3, 5, 10, 20].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Reviewer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Avg TAT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {topPerformers.map((reviewer) => (
                  <tr key={reviewer.reviewerId}>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {reviewer.rank}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {reviewer.reviewerName}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {reviewer.performanceRating}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {reviewer.averageTurnaroundTimeHours} hrs
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      <div className="w-32">
                        <Sparkline
                          values={[
                            reviewer.averageTurnaroundTimeHours,
                            reviewer.approvalRatePercentage,
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between gap-2 text-gray-900 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Bottom performers</h2>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Show</label>
              <select
                value={bottomCount}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setBottomCount(v);
                  loadPerformanceData();
                }}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
              >
                {[3, 5, 10, 20].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Reviewer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Avg TAT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {bottomPerformers.map((reviewer) => (
                  <tr key={reviewer.reviewerId}>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {reviewer.rank}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {reviewer.reviewerName}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {reviewer.performanceRating}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {reviewer.averageTurnaroundTimeHours} hrs
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      <div className="w-32">
                        <Sparkline
                          values={[
                            reviewer.averageTurnaroundTimeHours,
                            reviewer.approvalRatePercentage,
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-slate-50 p-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Live performance summary
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Detailed reviewer performance will surface once metrics can be
            fetched from the analytics service.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
          <ArrowUpRight className="h-4 w-4" /> Performance metrics loaded
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Confirm recalculate metrics"
        message="This will trigger a backend recalculation of all reviewer performance metrics. Continue?"
        confirmLabel="Recalculate"
        cancelLabel="Cancel"
        onConfirm={handleRecalculate}
        onCancel={handleCancelConfirm}
        loading={loading}
      />
    </div>
  );
};

export default LeadReviewerPerformance;
