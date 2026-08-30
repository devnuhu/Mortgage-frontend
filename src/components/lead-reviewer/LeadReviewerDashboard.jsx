import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Users,
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  RefreshCcw,
} from "lucide-react";
import {
  getReviewerPerformanceAll,
  getWorkloadDistribution,
  getActiveEscalations,
} from "../../services/analyticsService";
import { getReportSummary } from "../../services/applicationService";
import toast from "react-hot-toast";

const LeadReviewerDashboard = () => {
  const navigate = useNavigate();
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [workloadDistribution, setWorkloadDistribution] = useState([]);
  const [workloadSummary, setWorkloadSummary] = useState({});
  const [reportSummary, setReportSummary] = useState({});
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);

  const quickLinks = [
    {
      label: "Applications",
      route: "/lead-reviewer/applications",
      icon: <ClipboardList className="h-4 w-4" />,
    },
    {
      label: "Workload",
      route: "/lead-reviewer/workload",
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Reassignments",
      route: "/lead-reviewer/reassignments",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      label: "Escalations",
      route: "/lead-reviewer/escalations",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      label: "Performance",
      route: "/lead-reviewer/performance",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      label: "Advanced Actions",
      route: "/lead-reviewer/advanced-actions",
      icon: <RefreshCcw className="h-4 w-4" />,
    },
  ];

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [performance, workload, activeEscalations, summary] =
          await Promise.all([
            getReviewerPerformanceAll(),
            getWorkloadDistribution(),
            getActiveEscalations(),
            getReportSummary(),
          ]);

        setPerformanceMetrics(
          Array.isArray(performance) ? performance : performance.metrics || [],
        );
        setWorkloadSummary(workload.summary || {});
        setWorkloadDistribution(workload.reviewerWorkloads || []);
        setEscalations(
          Array.isArray(activeEscalations)
            ? activeEscalations
            : activeEscalations.escalations || [],
        );
        setReportSummary(summary || {});
      } catch (error) {
        toast.error(error.message || "Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const totalApplicationsAssigned = useMemo(
    () =>
      workloadDistribution.reduce(
        (sum, item) => sum + (item.totalAssignments || 0),
        0,
      ),
    [workloadDistribution],
  );

  const pendingApplicationsCount = useMemo(
    () =>
      workloadDistribution.reduce(
        (sum, item) => sum + (item.activeAssignments || 0),
        0,
      ),
    [workloadDistribution],
  );

  const averageTurnaround = useMemo(() => {
    if (!performanceMetrics.length) return 0;
    return (
      performanceMetrics.reduce(
        (sum, item) => sum + (item.averageTurnaroundTimeHours || 0),
        0,
      ) / performanceMetrics.length
    ).toFixed(1);
  }, [performanceMetrics]);

  const approvalRate = useMemo(() => {
    if (!performanceMetrics.length) return 0;
    return (
      performanceMetrics.reduce(
        (sum, item) => sum + (item.approvalRatePercentage || 0),
        0,
      ) / performanceMetrics.length
    ).toFixed(1);
  }, [performanceMetrics]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Lead Reviewer Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Primary landing page for lead reviewer metrics, workload, and
              escalations.
            </p>
          </div>
          <div className="rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
            {loading ? "Loading metrics..." : "Dashboard loaded"}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 via-emerald-50 to-white p-3 shadow-sm ring-1 ring-green-100">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4">
          <div className="flex min-h-[150px] flex-col justify-between rounded-lg border border-green-200 bg-white/90 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
              Total Records
            </p>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {reportSummary.totalRecords ?? reportSummary.totalCount ?? 0}
              </p>
              <p className="mt-1 text-xs text-gray-500">Applications</p>
            </div>
          </div>
          <div className="flex min-h-[150px] flex-col justify-between rounded-lg border border-blue-200 bg-blue-50/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Submitted
            </p>
            <div>
              <p className="text-2xl font-bold text-[#003883]">
                {reportSummary.submittedCount ?? reportSummary.submitted ?? 0}
              </p>
              <p className="mt-1 text-xs text-gray-500">New applications</p>
            </div>
          </div>
          <div className="flex min-h-[150px] flex-col justify-between rounded-lg border border-orange-200 bg-orange-50/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">
              Under Review
            </p>
            <div>
              <p className="text-2xl font-bold text-[#FF8200]">
                {reportSummary.underReviewCount ??
                  reportSummary.underReview ??
                  0}
              </p>
              <p className="mt-1 text-xs text-gray-500">Currently active</p>
            </div>
          </div>
          <div className="flex min-h-[150px] flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Pending
            </p>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {reportSummary.pendingCount ?? 0}
              </p>
              <p className="mt-1 text-xs text-gray-500">Awaiting action</p>
            </div>
          </div>
          <div className="flex min-h-[150px] flex-col justify-between rounded-lg border border-red-200 bg-red-50/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
              Rejected
            </p>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {reportSummary.rejectedCount ?? reportSummary.rejected ?? 0}
              </p>
              <p className="mt-1 text-xs text-gray-500">Declined</p>
            </div>
          </div>
          <div className="flex min-h-[150px] flex-col justify-between rounded-lg border border-amber-200 bg-amber-50/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
              Returned
            </p>
            <div>
              <p className="text-2xl font-bold text-[#FF8200]">
                {reportSummary.returnedCount ?? reportSummary.returned ?? 0}
              </p>
              <p className="mt-1 text-xs text-gray-500">Needs resubmission</p>
            </div>
          </div>
          <div className="flex min-h-[150px] flex-col justify-between rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Approved
            </p>
            <div>
              <p className="text-2xl font-bold text-[#8DC63F]">
                {reportSummary.approvedCount ?? reportSummary.approved ?? 0}
              </p>
              <p className="mt-1 text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2.5">
        <div className="group flex min-h-[100px] flex-col justify-between rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md">
          <p className="text-sm font-medium text-gray-500">
            Total Applications Assigned
          </p>
          <div>
            <p className="text-xl font-semibold text-gray-900">
              {totalApplicationsAssigned}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              Across all reviewers
            </p>
          </div>
        </div>
        <div className="group flex min-h-[100px] flex-col justify-between rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md">
          <p className="text-sm font-medium text-gray-500">
            Pending Applications
          </p>
          <div>
            <p className="text-xl font-semibold text-gray-900">
              {pendingApplicationsCount}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              Currently active assignments
            </p>
          </div>
        </div>
        <div className="group flex min-h-[100px] flex-col justify-between rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md">
          <p className="text-sm font-medium text-gray-500">
            Average Turnaround
          </p>
          <div>
            <p className="text-xl font-semibold text-gray-900">
              {averageTurnaround}h
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              Across reviewer performance
            </p>
          </div>
        </div>
        <div className="group flex min-h-[100px] flex-col justify-between rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md">
          <p className="text-sm font-medium text-gray-500">Approval Rate</p>
          <div>
            <p className="text-xl font-semibold text-gray-900">
              {approvalRate}%
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              Team-wide approval performance
            </p>
          </div>
        </div>
        <div className="group flex min-h-[100px] flex-col justify-between rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md">
          <p className="text-sm font-medium text-gray-500">
            Applications Overdue
          </p>
          <div>
            <p className="text-xl font-semibold text-gray-900">
              {escalations.length}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              Active overdue escalations
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        <div className="group flex min-h-[100px] flex-col justify-between rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md">
          <p className="text-sm font-medium text-gray-500">
            Workload total assignments
          </p>
          <div>
            <p className="text-xl font-semibold text-gray-900">
              {workloadSummary.totalAssignments ?? totalApplicationsAssigned}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              Across workload distribution
            </p>
          </div>
        </div>
        <div className="group flex min-h-[100px] flex-col justify-between rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md">
          <p className="text-sm font-medium text-gray-500">
            Average assignments
          </p>
          <div>
            <p className="text-xl font-semibold text-gray-900">
              {workloadSummary.averageAssignments ?? "N/A"}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              Average per reviewer
            </p>
          </div>
        </div>
        <div className="group flex min-h-[100px] flex-col justify-between rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md">
          <p className="text-sm font-medium text-gray-500">Approval rate</p>
          <div>
            <p className="text-xl font-semibold text-gray-900">
              {workloadSummary.overallApprovalRatePercentage ?? approvalRate}%
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              From workload summary
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Review activity
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Snapshots from reviewer performance and active assignments.
              </p>
            </div>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>Total reviewers</span>
              <span className="font-semibold">{performanceMetrics.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>Tracked workloads</span>
              <span className="font-semibold">
                {workloadDistribution.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>Escalations active</span>
              <span className="font-semibold">{escalations.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Workload distribution
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Discover reviewers at capacity and those ready for new work.
              </p>
            </div>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-gray-500">Highest load</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">
                {workloadDistribution.reduce(
                  (max, item) => Math.max(max, item.workloadPercentage || 0),
                  0,
                )}
                %
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-gray-500">Workload range</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">
                {workloadDistribution.length ? "Tracked" : "None"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-slate-50 p-5">
          <div className="flex items-center gap-2 text-gray-700">
            <RefreshCcw className="h-5 w-5" />
            <p className="text-sm">
              Updated from analytics endpoints in real time whenever the
              dashboard loads.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <button
              key={link.route}
              type="button"
              onClick={() => navigate(link.route)}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-green-300 hover:bg-green-50"
            >
              <div>
                <p className="text-sm text-gray-500">{link.label}</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  Open {link.label}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-2 text-green-700">
                {link.icon}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeadReviewerDashboard;
