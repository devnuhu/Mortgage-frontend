import React, { useEffect, useMemo, useState } from "react";
import { X, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAssignments } from "../../hooks/useAssignments";
import { useReviewers } from "../../hooks/useReviewers";
import toast from "react-hot-toast";

const BulkReassignmentModal = ({
  isOpen,
  assignmentIds,
  sourceReviewerId,
  onClose,
  onSuccess,
}) => {
  const { bulkReassignAssignments, loading, error } = useAssignments();
  const {
    getAvailableReviewers,
    loading: reviewersLoading,
    error: reviewersError,
  } = useReviewers();
  const [reviewers, setReviewers] = useState([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchReviewers = async () => {
      if (!isOpen) return;
      try {
        const data = await getAvailableReviewers();
        setReviewers(data);
      } catch (err) {
        console.error("Failed to fetch reviewers", err);
      }
    };

    fetchReviewers();
  }, [getAvailableReviewers, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedReviewerId("");
      setReason("");
      setSuccess(false);
      setReviewers([]);
    }
  }, [isOpen]);

  const selectedReviewer = useMemo(
    () =>
      reviewers.find((reviewer) => reviewer.reviewerId === selectedReviewerId),
    [reviewers, selectedReviewerId],
  );

  const handleBulkReassign = async () => {
    if (!selectedReviewerId) {
      toast.error("Please select a reviewer before reassigning.");
      return;
    }

    if (!reason || !reason.trim()) {
      toast.error("Please provide a reason for reassignment.");
      return;
    }

    if (selectedReviewerId === sourceReviewerId) {
      toast.error("Cannot reassign to the same reviewer.");
      return;
    }

    if (selectedReviewer?.isAvailable === false) {
      toast.error("Selected reviewer is currently unavailable.");
      return;
    }

    try {
      const result = await bulkReassignAssignments(
        assignmentIds,
        selectedReviewerId,
        reason.trim(),
      );

      if (result?.success === false) {
        toast.error(result.message || "Bulk reassignment failed.");
        return;
      }

      setSuccess(true);
      toast.success(
        `Successfully reassigned ${assignmentIds.length} application(s).`,
      );
      onSuccess(result);
    } catch (err) {
      console.error("Bulk reassignment failed", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Bulk Reassign Applications
            </h2>
            <p className="text-sm text-gray-500">
              Reassign selected assignments to one reviewer with a single
              workflow.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-gray-700">
              Assignments selected:{" "}
              <span className="font-semibold">{assignmentIds.length}</span>
            </p>
            <p className="text-sm text-gray-500">
              Choose a reviewer below and provide a reason for reassignment.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                New reviewer
              </label>
              <select
                value={selectedReviewerId}
                onChange={(e) => setSelectedReviewerId(e.target.value)}
                disabled={reviewersLoading}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
              >
                <option value="">Select a reviewer</option>
                {reviewers.map((reviewer) => {
                  const raw = reviewer.raw || {};
                  const first = reviewer.firstName || raw.firstName || "";
                  const last = reviewer.lastName || raw.lastName || "";
                  const fullFromRaw = raw.fullName || raw.name || "";
                  const displayName =
                    first || last
                      ? `${first.trim()} ${last.trim()}`.trim()
                      : fullFromRaw ||
                        reviewer.reviewerName ||
                        reviewer.reviewerEmail ||
                        "Unknown";

                  return (
                    <option
                      key={reviewer.reviewerId}
                      value={reviewer.reviewerId}
                    >
                      {displayName}
                      {reviewer.workloadPercentage != null
                        ? ` • ${reviewer.workloadPercentage}% load`
                        : ""}
                    </option>
                  );
                })}
              </select>
              {reviewersError && (
                <p className="mt-2 text-sm text-red-600">{reviewersError}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
                placeholder="Load balancing, reviewer unavailable, overdue follow-up, etc."
              />
            </div>
          </div>

          {selectedReviewer && (
            <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  Selected reviewer{" "}
                  <strong>{selectedReviewer.reviewerName}</strong> has{" "}
                  <strong>{selectedReviewer.activeAssignments}</strong> active
                  assignments.
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-between sm:items-center">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBulkReassign}
            disabled={loading || reviewersLoading || assignmentIds.length === 0}
            className="inline-flex items-center justify-center rounded-full bg-green-600 px-5 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Reassigning..." : "Execute bulk reassignment"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkReassignmentModal;
