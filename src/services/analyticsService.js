import api from "./axios-config";

const logError = (operation, error) => {
  console.error(`❌ ${operation} error:`, error);
  throw error;
};

export const getReviewerPerformanceAll = async () => {
  try {
    const response = await api.get("/analytics/performance/all");
    return response.data;
  } catch (error) {
    logError("Get reviewer performance all", error);
  }
};

export const getWorkloadDistribution = async () => {
  try {
    const response = await api.get("/analytics/workload/distribution");
    // API returns object with summary and reviewerWorkloads array
    return {
      summary: response.data,
      reviewerWorkloads: response.data.reviewerWorkloads || [],
    };
  } catch (error) {
    logError("Get workload distribution", error);
  }
};

const extractEscalationList = (response) => {
  if (!response) return [];
  const payload = response.data || response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.escalations)) return payload.escalations;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

export const getActiveEscalations = async () => {
  try {
    const response = await api.get("/analytics/escalations/active");
    return extractEscalationList(response);
  } catch (error) {
    logError("Get active escalations", error);
  }
};

export const getReviewerEscalations = async (reviewerId) => {
  try {
    if (!reviewerId) {
      throw new Error("Reviewer ID is required");
    }
    const response = await api.get(
      `/analytics/escalations/reviewer/${reviewerId}`,
    );
    return extractEscalationList(response);
  } catch (error) {
    logError(`Get reviewer escalations for ${reviewerId}`, error);
  }
};

export const checkDelayedAssignments = async () => {
  try {
    const response = await api.post("/analytics/escalation/check-delays", {});
    return response.data;
  } catch (error) {
    logError("Check delayed assignments", error);
  }
};

export const resolveEscalation = async (escalationId, payload = {}) => {
  try {
    const response = await api.put(
      `/analytics/escalations/${escalationId}/resolve`,
      payload,
    );
    return response.data;
  } catch (error) {
    logError("Resolve escalation", error);
  }
};

export const getReviewersWorkload = async (
  pageNumber = 1,
  pageSize = 25,
  sortBy = "reviewerName",
  sortDescending = false,
) => {
  try {
    const response = await api.get("/analytics/workload/distribution");
    const payload = response.data || {};
    const items = Array.isArray(payload.reviewerWorkloads)
      ? payload.reviewerWorkloads
      : [];

    const sortedItems = [...items].sort((a, b) => {
      const getValue = (item, field) => {
        switch (field) {
          case "workload":
            return Number(item.workloadPercentage || 0);
          case "activeassignments":
            return Number(item.activeAssignments || 0);
          case "approvalrate":
            return Number(item.approvalRatePercentage || 0);
          case "turnaroundtime":
            return Number(item.averageTurnaroundTimeHours || 0);
          case "performancerating":
            return Number(item.performanceRating || 0);
          default:
            return String(item.reviewerName || "").toLowerCase();
        }
      };

      const left = getValue(a, sortBy);
      const right = getValue(b, sortBy);

      if (typeof left === "string" && typeof right === "string") {
        return sortDescending
          ? right.localeCompare(left)
          : left.localeCompare(right);
      }

      return sortDescending
        ? Number(right) - Number(left)
        : Number(left) - Number(right);
    });

    const start = (pageNumber - 1) * pageSize;
    const pagedItems = sortedItems.slice(start, start + pageSize);

    return {
      data: pagedItems,
      summary: payload,
      totalCount: sortedItems.length,
      pageNumber,
      pageSize,
      totalPages: Math.max(1, Math.ceil(sortedItems.length / pageSize)),
    };
  } catch (error) {
    logError("Get reviewers workload", error);
  }
};

export const getWorkloadSuggestions = async () => {
  try {
    const response = await api.get("/analytics/workload/suggestions");
    return response.data;
  } catch (error) {
    logError("Get workload suggestions", error);
  }
};

export const getAvailableReviewers = async () => {
  try {
    const response = await api.get(
      "/analytics/reviewers/availability/available",
    );
    return response.data;
  } catch (error) {
    logError("Get available reviewers", error);
  }
};

export const markReviewerAvailable = async (reviewerId) => {
  try {
    const response = await api.put(
      `/analytics/reviewers/${reviewerId}/availability/available`,
    );
    return response.data;
  } catch (error) {
    logError("Mark reviewer available", error);
  }
};

export const markReviewerUnavailable = async (
  reviewerId,
  reason = "Unavailable",
  endDate = null,
) => {
  try {
    const body = { reason, endDate };
    const response = await api.put(
      `/analytics/reviewers/${reviewerId}/availability/unavailable`,
      body,
    );
    return response.data;
  } catch (error) {
    logError("Mark reviewer unavailable", error);
  }
};

export const markReviewerOnLeave = async (
  reviewerId,
  reason = "Annual leave",
  endDate,
) => {
  try {
    const response = await api.put(
      `/analytics/reviewers/${reviewerId}/availability/on-leave`,
      { reason, endDate },
    );
    return response.data;
  } catch (error) {
    logError("Mark reviewer on leave", error);
  }
};

export const getUnavailableReviewers = async () => {
  try {
    const response = await api.get(
      "/analytics/reviewers/availability/unavailable",
    );
    return response.data;
  } catch (error) {
    logError("Get unavailable reviewers", error);
  }
};

export const getCurrentAssignment = async (applicationId) => {
  try {
    const response = await api.get(`/assignments/current/${applicationId}`);
    return response.data;
  } catch (error) {
    logError("Get current assignment", error);
  }
};

export const getReviewerAssignments = async (reviewerId) => {
  try {
    const response = await api.get(
      `/analytics/reviewer/${reviewerId}/assignments`,
    );
    return Array.isArray(response.data)
      ? response.data
      : response.data.data || [];
  } catch (error) {
    logError("Get reviewer assignments", error);
  }
};

export const getBulkReassignmentApplications = async ({
  pageNumber = 1,
  pageSize = 25,
  sortBy = "applicationNumber",
  sortDescending = false,
  reviewerId = null,
  applicationStatus = null,
  rsaPin = null,
  createdFromDate = null,
  createdToDate = null,
  submittedFromDate = null,
  submittedToDate = null,
}) => {
  try {
    const normalizeDateParam = (value) => {
      if (!value) return null;
      const trimmed = String(value).trim();
      if (!trimmed) return null;
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime()) && trimmed.includes("T")) {
        return parsed.toISOString();
      }
      return trimmed;
    };

    const params = {
      pageNumber,
      pageSize,
      sortBy,
      sortDescending,
    };

    if (reviewerId !== null && reviewerId !== undefined && reviewerId !== "") {
      params.reviewerId = reviewerId;
    }
    if (
      applicationStatus !== null &&
      applicationStatus !== undefined &&
      applicationStatus !== ""
    ) {
      params.applicationStatus = applicationStatus;
    }
    if (rsaPin !== null && rsaPin !== undefined && rsaPin !== "") {
      params.rsaPin = String(rsaPin).trim();
    }

    const normalizedCreatedFromDate = normalizeDateParam(createdFromDate);
    const normalizedCreatedToDate = normalizeDateParam(createdToDate);
    const normalizedSubmittedFromDate = normalizeDateParam(submittedFromDate);
    const normalizedSubmittedToDate = normalizeDateParam(submittedToDate);

    if (normalizedCreatedFromDate) {
      params.createdFromDate = normalizedCreatedFromDate;
      params.applicationCreatedFromDate = normalizedCreatedFromDate;
    }
    if (normalizedCreatedToDate) {
      params.createdToDate = normalizedCreatedToDate;
      params.applicationCreatedToDate = normalizedCreatedToDate;
    }
    if (normalizedSubmittedFromDate) {
      params.submittedFromDate = normalizedSubmittedFromDate;
      params.applicationSubmittedFromDate = normalizedSubmittedFromDate;
    }
    if (normalizedSubmittedToDate) {
      params.submittedToDate = normalizedSubmittedToDate;
      params.applicationSubmittedToDate = normalizedSubmittedToDate;
    }

    const response = await api.get(
      "/analytics/applications/for-bulk-reassignment",
      { params },
    );
    return response.data;
  } catch (error) {
    logError("Get bulk reassignment applications", error);
  }
};

export const getMyAssignments = async () => {
  try {
    const response = await api.get("/assignments/mine");
    return Array.isArray(response.data)
      ? response.data
      : response.data.data || [];
  } catch (error) {
    logError("Get my assignments", error);
  }
};

export const getAllApplications = async (pageNumber = 1, pageSize = 50) => {
  try {
    const response = await api.get("/applications", {
      params: { pageNumber, pageSize },
    });
    return response.data;
  } catch (error) {
    logError("Get all applications", error);
  }
};

export const searchApplications = async ({
  rsaPin,
  borrowerName,
  submittedFromDate,
  submittedToDate,
  pageNumber = 1,
  pageSize = 50,
}) => {
  try {
    const params = {};
    if (rsaPin) params.rsaPin = rsaPin;
    if (borrowerName) params.borrowerName = borrowerName;
    if (submittedFromDate) params.submittedFromDate = submittedFromDate;
    if (submittedToDate) params.submittedToDate = submittedToDate;
    if (pageNumber) params.pageNumber = pageNumber;
    if (pageSize) params.pageSize = pageSize;

    const response = await api.get("/applications/search", { params });
    return response.data;
  } catch (error) {
    logError("Search applications", error);
  }
};

export const getApplicationDetails = async (applicationId) => {
  try {
    const response = await api.get(`/applications/${applicationId}/details`);
    return response.data;
  } catch (error) {
    logError("Get application details", error);
  }
};

export const reassignBulk = async (assignmentIds, newReviewerId, reason) => {
  try {
    const response = await api.post("/analytics/assignments/reassign-bulk", {
      assignmentIds,
      newReviewerId,
      reason,
    });
    return response.data;
  } catch (error) {
    logError("Bulk reassignment", error);
  }
};

export const reassignSingle = async (applicationId, newReviewerId, reason) => {
  try {
    const response = await api.post(`/assignments/reassign/${applicationId}`, {
      newReviewerId,
      reason,
    });
    return response.data;
  } catch (error) {
    logError("Single reassignment", error);
  }
};

export const getReassignmentHistory = async (days = 30, pageSize = 100) => {
  try {
    const response = await api.get("/analytics/reassignments/history", {
      params: { days, pageSize },
    });
    // API returns array directly; wrap in { history: [...] } for component compatibility
    const items = Array.isArray(response.data)
      ? response.data
      : response.data.data || [];
    return { history: items };
  } catch (error) {
    logError("Get reassignment history", error);
  }
};

export const getReviewerReassignmentHistory = async (reviewerId, days = 30) => {
  try {
    const response = await api.get(
      `/analytics/reassignments/history/reviewer/${reviewerId}`,
      { params: { days } },
    );
    // API returns array directly
    const items = Array.isArray(response.data)
      ? response.data
      : response.data.data || [];
    return items;
  } catch (error) {
    logError("Get reviewer reassignment history", error);
  }
};

export const getAssignmentHistory = async (applicationId) => {
  try {
    const response = await api.get(`/assignments/${applicationId}/history`);
    // API returns array directly
    const items = Array.isArray(response.data)
      ? response.data
      : response.data.data || [];
    return items;
  } catch (error) {
    logError("Get assignment history", error);
  }
};

export const getReassignmentMetrics = async () => {
  try {
    const response = await api.get("/analytics/reassignments/metrics");
    return response.data;
  } catch (error) {
    logError("Get reassignment metrics", error);
  }
};

export const getTopPerformers = async (count = 5) => {
  try {
    const response = await api.get("/analytics/performance/top", {
      params: { count },
    });
    return response.data;
  } catch (error) {
    logError("Get top performers", error);
  }
};

export const getBottomPerformers = async (count = 5) => {
  try {
    const response = await api.get("/analytics/performance/bottom", {
      params: { count },
    });
    return response.data;
  } catch (error) {
    logError("Get bottom performers", error);
  }
};

export const getReviewerPerformance = async (reviewerId) => {
  try {
    const response = await api.get(
      `/analytics/reviewer/${reviewerId}/performance`,
    );
    return response.data;
  } catch (error) {
    logError("Get reviewer performance detail", error);
  }
};

export const getReviewerTurnaroundTime = async (reviewerId, days = 30) => {
  try {
    const response = await api.get(
      `/analytics/reviewer/${reviewerId}/turnaround-time`,
      { params: { days } },
    );
    return response.data;
  } catch (error) {
    logError("Get reviewer turnaround time", error);
  }
};

export const getReviewerHoursSummary = async (
  reviewerId,
  dateFrom = null,
  dateTo = null,
) => {
  try {
    if (!reviewerId) {
      throw new Error("Reviewer ID is required");
    }

    const params = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    const response = await api.get(
      `/analytics/reviewer/${reviewerId}/hours-summary`,
      {
        params,
      },
    );
    return response.data;
  } catch (error) {
    logError("Get reviewer hours summary", error);
  }
};

export const recalcReviewerMetrics = async (reviewerId) => {
  try {
    const response = await api.post(
      `/analytics/reviewer/${reviewerId}/recalculate-metrics`,
    );
    return response.data;
  } catch (error) {
    logError("Recalculate reviewer metrics", error);
  }
};

export const recalcAllMetrics = async () => {
  try {
    const response = await api.post("/analytics/performance/recalculate-all");
    return response.data;
  } catch (error) {
    logError("Recalculate all metrics", error);
  }
};

export const autoBalanceWorkload = async () => {
  try {
    const response = await api.post(
      "/analytics/applications/auto-balance-workload",
    );
    return response.data;
  } catch (error) {
    logError("Auto-balance workload", error);
  }
};

export const reassignByCriteria = async (criteria) => {
  try {
    const response = await api.post(
      "/analytics/applications/reassign-by-criteria",
      criteria,
    );
    return response.data;
  } catch (error) {
    logError("Criteria-based reassignment", error);
  }
};
