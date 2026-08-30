import { useCallback, useState } from "react";
import api from "../services/axios-config";

export const useReviewers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRequest = async (fn) => {
    try {
      setLoading(true);
      setError(null);
      return await fn();
    } catch (err) {
      const message = err?.message || "Reviewer request failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const normalize = (raw) => {
    if (!raw) return null;
    const candidate = raw.reviewer || raw.user || raw;
    const first = candidate.firstName || candidate.first || null;
    const last = candidate.lastName || candidate.last || null;
    const full =
      candidate.fullName ||
      candidate.name ||
      `${first || ""} ${last || ""}`.trim();

    return {
      reviewerId:
        raw.reviewerId ||
        raw.id ||
        raw.userId ||
        candidate.id ||
        candidate.reviewerId,
      // expose firstName/lastName for UI that consumes them directly
      firstName: first,
      lastName: last,
      reviewerName: raw.reviewerName || full || null,
      reviewerEmail: candidate.email || raw.email || raw.reviewerEmail || "",
      isAvailable:
        raw.isAvailable ||
        raw.available ||
        raw.availabilityStatus === "available" ||
        raw.status === "Available",
      workloadPercentage:
        raw.workloadPercentage ||
        raw.workload ||
        raw.currentWorkloadPercent ||
        candidate.workloadPercentage ||
        null,
      activeAssignments:
        raw.activeAssignments ||
        raw.activeAssignmentCount ||
        raw.currentAssignments ||
        candidate.activeAssignments ||
        0,
      raw,
    };
  };

  const extractItems = (response) => {
    if (!response?.data) return [];
    if (Array.isArray(response.data)) return response.data;
    return (
      response.data.data ||
      response.data.reviewers ||
      response.data.items ||
      response.data.results ||
      response.data.payload ||
      response.data ||
      []
    );
  };

  const getAllReviewers = useCallback(async () => {
    return handleRequest(async () => {
      const response = await api.get("/users/reviewers");
      const items = extractItems(response);
      return Array.isArray(items) ? items.map(normalize).filter(Boolean) : [];
    });
  }, []);

  const getAvailableReviewers = useCallback(async () => {
    return handleRequest(async () => {
      try {
        const response = await api.get(
          "/analytics/reviewers/availability/available",
        );
        const items = extractItems(response);
        return Array.isArray(items) ? items.map(normalize).filter(Boolean) : [];
      } catch (error) {
        if (error.response?.status === 404) {
          const fallbackResponse = await api.get("/users/reviewers/available");
          const fallbackItems = extractItems(fallbackResponse);
          return Array.isArray(fallbackItems)
            ? fallbackItems.map(normalize).filter(Boolean)
            : [];
        }
        throw error;
      }
    });
  }, []);

  const getReviewersWithWorkload = useCallback(async () => {
    return handleRequest(async () => {
      const response = await api.get("/users/reviewers/with-workload", {
        params: { pageNumber: 1, pageSize: 100 },
      });
      const items = extractItems(response);
      return Array.isArray(items) ? items.map(normalize).filter(Boolean) : [];
    });
  }, []);

  return {
    loading,
    error,
    getAllReviewers,
    getAvailableReviewers,
    getReviewersWithWorkload,
  };
};
