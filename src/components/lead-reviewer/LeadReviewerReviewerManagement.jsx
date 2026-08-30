import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, RefreshCcw, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  getAvailableReviewers,
  getUnavailableReviewers,
  markReviewerAvailable,
  markReviewerOnLeave,
  markReviewerUnavailable,
} from "../../services/analyticsService";
import { withAuth } from "../../context/AuthContext";
import { UserRole } from "../../types/auth";

// Helper: extract array from various API shapes
const extractList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.reviewers)) return payload.reviewers;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const toLocalDisplay = (iso) => {
  if (!iso) return "Ongoing";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

const formatFullName = (r) =>
  r?.fullName ||
  `${r?.firstName || ""} ${r?.lastName || ""}`.trim() ||
  r?.name ||
  "Unknown Reviewer";

const LeadReviewerReviewerManagement = () => {
  const [activeTab, setActiveTab] = useState("available");
  const [available, setAvailable] = useState([]);
  const [unavailable, setUnavailable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null); // 'unavailable' | 'on-leave'
  const [modalReviewerId, setModalReviewerId] = useState("");
  const [modalReason, setModalReason] = useState("");
  const [modalEndDate, setModalEndDate] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmReviewer, setConfirmReviewer] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [a, u] = await Promise.all([
        getAvailableReviewers(),
        getUnavailableReviewers(),
      ]);
      setAvailable(extractList(a));
      setUnavailable(extractList(u));
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load reviewer availability.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableCount = useMemo(() => available.length, [available]);
  const unavailableCount = useMemo(() => unavailable.length, [unavailable]);

  const openModal = (action, reviewer) => {
    setModalAction(action);
    setModalReviewerId(reviewer?.reviewerId || reviewer?.id || "");
    setModalReason("");
    setModalEndDate("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalAction(null);
    setModalReviewerId("");
    setModalReason("");
    setModalEndDate("");
    setSubmitting(false);
  };

  const openConfirmAvailable = (reviewer) => {
    setConfirmReviewer(reviewer);
    setIsConfirmOpen(true);
  };

  const closeConfirm = () => {
    setIsConfirmOpen(false);
    setConfirmReviewer(null);
    setSubmitting(false);
  };

  const validateFuture = (value) => {
    if (!value) return true;
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now();
  };

  const submitModal = async () => {
    if (!modalReviewerId) return toast.error("Please choose a reviewer.");
    if (modalAction === "on-leave" && !modalEndDate.trim())
      return toast.error("Leave end date is required.");
    if (modalEndDate.trim() && !validateFuture(modalEndDate))
      return toast.error("End date must be a future date/time.");

    const endDateIso = modalEndDate.trim()
      ? new Date(modalEndDate).toISOString()
      : null;
    try {
      setSubmitting(true);
      if (modalAction === "unavailable") {
        await markReviewerUnavailable(
          modalReviewerId,
          modalReason.trim() || undefined,
          endDateIso,
        );
        toast.success("✓ Reviewer marked as unavailable");
      } else if (modalAction === "on-leave") {
        await markReviewerOnLeave(
          modalReviewerId,
          modalReason.trim() || undefined,
          endDateIso,
        );
        toast.success("✓ Reviewer marked on leave");
      }
      await loadAll();
      closeModal();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update reviewer availability.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const markAvailable = async () => {
    const reviewer = confirmReviewer;
    const reviewerId = reviewer?.reviewerId || reviewer?.id;
    const name = reviewer?.fullName || formatFullName(reviewer);
    try {
      setSubmitting(true);
      await markReviewerAvailable(reviewerId);
      toast.success(`✓ ${name} marked as available`);
      await loadAll();
      closeConfirm();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to mark reviewer as available.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const reviewerOptions = useMemo(
    () =>
      available.map((r) => ({
        id: r.reviewerId || r.id,
        label: r.fullName || `${r.firstName || ""} ${r.lastName || ""}`.trim(),
      })),
    [available],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Reviewer Availability Status
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage reviewer availability for auto-assignment.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadAll}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Available Reviewers</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {availableCount}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Unavailable Reviewers</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {unavailableCount}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={loadAll}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("available")}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${activeTab === "available" ? "bg-[#003883] text-white" : "text-slate-700 hover:bg-slate-100"}`}
          >
            Available Reviewers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("unavailable")}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${activeTab === "unavailable" ? "bg-[#003883] text-white" : "text-slate-700 hover:bg-slate-100"}`}
          >
            Unavailable Reviewers
          </button>
        </div>
      </div>

      {activeTab === "available" ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Available Reviewers
              </h2>
              <p className="text-sm text-slate-500">
                Reviewers currently available to receive applications.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Loading available reviewers...
            </div>
          ) : available.length === 0 ? (
            <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              No available reviewers. At least one reviewer must be available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium">Name</th>
                    <th className="px-3 py-3 text-left font-medium">Email</th>
                    <th className="px-3 py-3 text-left font-medium">
                      Active Assignments
                    </th>
                    <th className="px-3 py-3 text-left font-medium">Status</th>
                    <th className="px-3 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {available.map((r) => {
                    const id = r.id || r.reviewerId;
                    const name =
                      r.fullName ||
                      `${r.firstName || ""} ${r.lastName || ""}`.trim() ||
                      r.name ||
                      "Unknown Reviewer";
                    const email = r.email || "—";
                    const assignments = r.activeAssignmentCount ?? 0;

                    return (
                      <tr key={id} className="align-top">
                        <td className="px-3 py-3 font-medium text-slate-800">
                          <button
                            type="button"
                            onClick={() => openModal("unavailable", r)}
                            className="text-left text-[#003883] hover:underline"
                          >
                            {name}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-slate-700">{email}</td>
                        <td className="px-3 py-3 text-slate-700">
                          {assignments}
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Available
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openModal("unavailable", r)}
                              className="rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                            >
                              Mark as Unavailable
                            </button>
                            <button
                              type="button"
                              onClick={() => openModal("on-leave", r)}
                              className="rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                            >
                              Mark On Leave
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Unavailable Reviewers
              </h2>
              <p className="text-sm text-slate-500">
                Reviewers currently unavailable or on leave.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Loading unavailable reviewers...
            </div>
          ) : unavailable.length === 0 ? (
            <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              All reviewers are available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium">Name</th>
                    <th className="px-3 py-3 text-left font-medium">Email</th>
                    <th className="px-3 py-3 text-left font-medium">
                      Active Assignments
                    </th>
                    <th className="px-3 py-3 text-left font-medium">Status</th>
                    <th className="px-3 py-3 text-left font-medium">Reason</th>
                    <th className="px-3 py-3 text-left font-medium">Until</th>
                    <th className="px-3 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unavailable.map((r) => {
                    const id = r.id || r.reviewerId;
                    const name =
                      r.fullName ||
                      `${r.firstName || ""} ${r.lastName || ""}`.trim() ||
                      r.name ||
                      "Unknown Reviewer";
                    const email = r.email || "—";
                    const assignments = r.activeAssignmentCount ?? 0;
                    const status = r.status || "Unavailable";
                    const reasonText =
                      r.reason || r.unavailabilityReason || "—";
                    const until =
                      r.statusEndDate ||
                      r.endDate ||
                      r.unavailableUntil ||
                      null;

                    return (
                      <tr key={id} className="align-top">
                        <td className="px-3 py-3 font-medium text-slate-800">
                          {name}
                        </td>
                        <td className="px-3 py-3 text-slate-700">{email}</td>
                        <td className="px-3 py-3 text-slate-700">
                          {assignments}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.toLowerCase().includes("leave") ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-red-100 text-red-700 border-red-200"}`}
                          >
                            {status.toLowerCase().includes("unavailable") ? (
                              <X className="h-3.5 w-3.5" />
                            ) : (
                              <Clock3 className="h-3.5 w-3.5" />
                            )}
                            {status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {reasonText}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {toLocalDisplay(until)}
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => openConfirmAvailable(r)}
                            disabled={submitting}
                            className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            Mark as Available
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {modalAction === "on-leave"
                    ? "Mark Reviewer On Leave"
                    : "Mark Reviewer Unavailable"}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Select reviewer and provide details.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Reviewer
                </label>
                <select
                  value={modalReviewerId}
                  onChange={(e) => setModalReviewerId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#003883] focus:outline-none focus:ring-2 focus:ring-[#003883]/20"
                >
                  <option value="">Select reviewer</option>
                  {reviewerOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Reason
                </label>
                <input
                  type="text"
                  maxLength={255}
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder={
                    modalAction === "on-leave"
                      ? "e.g., Annual leave, Paternity leave"
                      : "e.g., Sick leave, Training, On vacation"
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#003883] focus:outline-none focus:ring-2 focus:ring-[#003883]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {modalAction === "on-leave"
                    ? "Leave End Date"
                    : "Until When?"}
                  {modalAction === "on-leave" && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>
                <input
                  type="datetime-local"
                  value={modalEndDate}
                  onChange={(e) => setModalEndDate(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#003883] focus:outline-none focus:ring-2 focus:ring-[#003883]/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitModal}
                disabled={submitting}
                className="rounded-md bg-[#003883] px-4 py-2 text-sm font-semibold text-white hover:bg-[#002F6F] disabled:opacity-60"
              >
                {submitting
                  ? "Updating..."
                  : modalAction === "on-leave"
                    ? "Mark On Leave"
                    : "Mark Unavailable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmOpen && confirmReviewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Confirm Mark Available
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Restore this reviewer to available status.
                </p>
              </div>
              <button
                type="button"
                onClick={closeConfirm}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">
                    {confirmReviewer.fullName ||
                      formatFullName(confirmReviewer)}
                  </span>
                  will be restored to available status.
                </p>
              </div>
              <div className="text-sm text-slate-600">
                This action will allow the reviewer to receive new assignments
                again.
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={closeConfirm}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={markAvailable}
                disabled={submitting}
                className="rounded-md bg-[#003883] px-4 py-2 text-sm font-semibold text-white hover:bg-[#002F6F] disabled:opacity-60"
              >
                {submitting ? "Restoring..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default withAuth(LeadReviewerReviewerManagement, [
  UserRole.LEAD_REVIEWER,
]);
