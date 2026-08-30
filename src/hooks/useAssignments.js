import { useCallback, useState } from "react";
import api from "../services/axios-config";

export const useAssignments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getErrorMessage = (err) => {
    const serverMessage =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.response?.data?.title ||
      err?.message;

    return serverMessage || "Assignment request failed";
  };

  const isActiveAssignmentError = (message) => {
    if (!message || typeof message !== "string") {
      return false;
    }

    const normalized = message.toLowerCase();
    return (
      normalized.includes("already has an active assignment") ||
      normalized.includes("use reassign endpoint")
    );
  };

  const handleRequest = async (fn) => {
    try {
      setLoading(true);
      setError(null);
      return await fn();
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const autoAssignApplication = useCallback(async (applicationId) => {
    return handleRequest(async () => {
      const response = await api.post(
        `/analytics/assignments/auto/${applicationId}`,
      );
      return response.data;
    });
  }, []);

  const reassignApplication = useCallback(
    async (applicationId, newReviewerId, reason) => {
      return handleRequest(async () => {
        const response = await api.post(
          `/assignments/reassign/${applicationId}`,
          {
            newReviewerId,
            reason,
          },
        );
        return response.data;
      });
    },
    [],
  );

  const assignApplication = useCallback(
    async (applicationId, newReviewerId, reason) => {
      return handleRequest(async () => {
        try {
          const response = await api.post(
            `/Assignments/assign/${applicationId}`,
            {
              newReviewerId,
              reason,
            },
          );
          return response.data;
        } catch (err) {
          const message = getErrorMessage(err);

          if (isActiveAssignmentError(message)) {
            const response = await api.post(
              `/assignments/reassign/${applicationId}`,
              {
                newReviewerId,
                reason,
              },
            );

            return { ...response.data, reassignedViaFallback: true };
          }

          throw err;
        }
      });
    },
    [],
  );

  const getCurrentAssignment = useCallback(async (applicationId) => {
    return handleRequest(async () => {
      const response = await api.get(`/assignments/current/${applicationId}`);
      return response.data;
    });
  }, []);

  const getMyAssignments = useCallback(async () => {
    return handleRequest(async () => {
      const response = await api.get("/assignments/mine");
      return Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
    });
  }, []);

  const bulkReassignAssignments = useCallback(
    async (assignmentIds, newReviewerId, reason) => {
      return handleRequest(async () => {
        if (!assignmentIds || assignmentIds.length === 0) {
          throw new Error("At least one assignment ID is required.");
        }
        if (!newReviewerId) {
          throw new Error("New reviewer ID is required.");
        }
        if (!reason || !reason.trim()) {
          throw new Error("Reassignment reason is required.");
        }

        const response = await api.post(
          "/analytics/assignments/reassign-bulk",
          {
            assignmentIds,
            newReviewerId,
            reason,
          },
        );
        return response.data;
      });
    },
    [],
  );

  return {
    loading,
    error,
    autoAssignApplication,
    assignApplication,
    reassignApplication,
    getCurrentAssignment,
    getMyAssignments,
    bulkReassignAssignments,
  };
};
