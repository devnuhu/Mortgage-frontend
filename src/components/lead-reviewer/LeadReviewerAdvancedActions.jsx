import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const localDateValue = (localValue) => {
  if (!localValue) return null;
  const date = new Date(localValue);
  return Number.isNaN(date.getTime()) ? null : date;
};
import {
  CalendarClock,
  Clock3,
  LockKeyhole,
  RefreshCcw,
  Save,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  autoBalanceWorkload,
  getReviewersWorkload,
  reassignByCriteria,
} from "../../services/analyticsService";
import {
  cancelRoleAccessSchedule,
  getRoleAccessControls,
  scheduleRoleAccessControl,
  updateRoleAccessControl,
} from "../../services/role-access-api";

const toLocalDateTimeInput = (utcValue) => {
  if (!utcValue) return "";
  const date = new Date(utcValue);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toLocalIso = (localValue) => {
  if (!localValue) return null;
  return localValue.length === 16 ? `${localValue}:00` : localValue;
};

const formatRemaining = (endTime, now) => {
  const remaining = new Date(endTime).getTime() - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return "Schedule ended";
  const totalMinutes = Math.ceil(remaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`;
};

const isScheduleActive = (setting, now) =>
  Boolean(setting.isScheduled) &&
  Boolean(setting.scheduledEndTime) &&
  new Date(setting.scheduledEndTime).getTime() > now;

const roleDefaults = {
  CLIENT: {
    role: "CLIENT",
    isLoginEnabled: true,
    disabledMessage:
      "Please note that client access is temporarily unavailable. Please try again during business hours or contact support.",
    changeReason: "",
    isScheduled: false,
    scheduledStartTime: null,
    scheduledEndTime: null,
    scheduledReason: "",
    scheduledStartLocal: "",
    scheduledEndLocal: "",
  },
  SERVICE_MANAGER: {
    role: "SERVICE_MANAGER",
    isLoginEnabled: true,
    disabledMessage:
      "Please note that service manager access is temporarily unavailable. Please try again during business hours or contact support.",
    changeReason: "",
    isScheduled: false,
    scheduledStartTime: null,
    scheduledEndTime: null,
    scheduledReason: "",
    scheduledStartLocal: "",
    scheduledEndLocal: "",
  },
};

const LeadReviewerAdvancedActions = () => {
  const [reviewers, setReviewers] = useState([]);
  const [balanceResult, setBalanceResult] = useState(null);
  const [criteriaResult, setCriteriaResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accessControls, setAccessControls] = useState(roleDefaults);
  const [accessLoading, setAccessLoading] = useState(true);
  const [savingRole, setSavingRole] = useState(null);
  const [scheduleActionRole, setScheduleActionRole] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [criteria, setCriteria] = useState({
    workloadThresholdPercentage: 80,
    reassignIfUnavailable: true,
    targetWorkloadMaxPercentage: 100,
    prioritizeHighPerformers: true,
    minimumApprovalRatePercentage: 75,
    maxReassignments: 20,
  });

  const loadReviewers = async () => {
    try {
      const data = await getReviewersWorkload(1, 100, "reviewerName", false);
      setReviewers(data.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to load reviewers");
    }
  };

  const loadAccessControls = async () => {
    try {
      const settings = await getRoleAccessControls();
      setAccessControls((current) =>
        settings.reduce(
          (controls, setting) => ({
            ...controls,
            [setting.role]: {
              ...controls[setting.role],
              ...setting,
              scheduledStartLocal: toLocalDateTimeInput(
                setting.scheduledStartTime,
              ),
              scheduledEndLocal: toLocalDateTimeInput(setting.scheduledEndTime),
            },
          }),
          current,
        ),
      );
    } catch (error) {
      toast.error(error.message || "Failed to load login access settings");
    } finally {
      setAccessLoading(false);
    }
  };

  useEffect(() => {
    loadReviewers();
    loadAccessControls();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const handleAccessChange = (role, field, value) => {
    setAccessControls((current) => ({
      ...current,
      [role]: { ...current[role], [field]: value },
    }));
  };

  const handleSaveAccess = async (role) => {
    const setting = accessControls[role];
    try {
      setSavingRole(role);
      const updated = await updateRoleAccessControl(role, setting);
      setAccessControls((current) => ({ ...current, [role]: updated }));
      toast.success(
        `${role === "CLIENT" ? "Client" : "Service Manager"} login access updated`,
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update login access",
      );
    } finally {
      setSavingRole(null);
    }
  };

  const handleScheduleChange = (role, field, value) => {
    handleAccessChange(role, field, value);
  };

  const handleSchedule = async (role) => {
    const setting = accessControls[role];
    const start = new Date(setting.scheduledStartLocal);
    const end = new Date(setting.scheduledEndLocal);
    if (!setting.scheduledStartLocal || !setting.scheduledEndLocal) {
      toast.error("Select both a schedule start and end time");
      return;
    }
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error("Enter valid schedule times");
      return;
    }
    if (start <= new Date()) {
      toast.error("Schedule start time must be in the future");
      return;
    }
    if (start >= end) {
      toast.error("Schedule start time must be before the end time");
      return;
    }

    try {
      setScheduleActionRole(role);
      const updated = await scheduleRoleAccessControl(role, {
        scheduledStartTime: toLocalIso(setting.scheduledStartLocal),
        scheduledEndTime: toLocalIso(setting.scheduledEndLocal),
        disabledMessage: setting.disabledMessage,
        scheduledReason: setting.scheduledReason,
      });
      setAccessControls((current) => ({
        ...current,
        [role]: {
          ...updated,
          scheduledStartLocal: toLocalDateTimeInput(updated.scheduledStartTime),
          scheduledEndLocal: toLocalDateTimeInput(updated.scheduledEndTime),
        },
      }));
      toast.success("Automatic login schedule saved");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to save schedule",
      );
    } finally {
      setScheduleActionRole(null);
    }
  };

  const handleCancelSchedule = async (role) => {
    try {
      setScheduleActionRole(role);
      await cancelRoleAccessSchedule(role);
      setAccessControls((current) => ({
        ...current,
        [role]: {
          ...current[role],
          isScheduled: false,
          scheduledStartTime: null,
          scheduledEndTime: null,
          scheduledReason: "",
          scheduledStartLocal: "",
          scheduledEndLocal: "",
        },
      }));
      toast.success("Automatic login schedule cancelled");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to cancel schedule",
      );
    } finally {
      setScheduleActionRole(null);
    }
  };

  const handleAutoBalance = async () => {
    try {
      setLoading(true);
      const result = await autoBalanceWorkload();
      setBalanceResult(result);
      toast.success(result.message || "Auto-balance completed.");
    } catch (error) {
      toast.error(error.message || "Failed to auto-balance workload");
    } finally {
      setLoading(false);
    }
  };

  const handleCriteriaReassign = async () => {
    try {
      setLoading(true);
      const result = await reassignByCriteria(criteria);
      setCriteriaResult(result);
      toast.success(result.message || "Criteria-based reassignment complete.");
    } catch (error) {
      toast.error(
        error.message || "Failed to execute criteria-based reassignment",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Auto-Balance & Advanced Actions
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Run workload redistribution and enforce criteria-based
              reassignments across available reviewers.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAutoBalance}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Zap className="h-4 w-4" /> Auto-balance
            </button>
            <button
              type="button"
              onClick={handleCriteriaReassign}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className="h-4 w-4" /> Execute criteria reassign
            </button>
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[#003883]/10 p-3 text-[#003883]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Login access controls
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Temporarily pause sign-in for client-facing teams while keeping
                reviewer access available.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <LockKeyhole className="h-4 w-4" /> Lead reviewer only
          </span>
        </div>

        {accessLoading ? (
          <div className="flex items-center gap-3 py-8 text-sm text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#003883]" />
            Loading access settings...
          </div>
        ) : (
          <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-2">
            {Object.keys(roleDefaults).map((role) => {
              const setting = accessControls[role];
              const label = role === "CLIENT" ? "Client" : "Service Manager";
              const scheduleActive = isScheduleActive(setting, now);
              return (
                <div
                  key={role}
                  className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50/70 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {label} login
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {setting.isLoginEnabled
                          ? "Users can sign in normally."
                          : "New sign-ins are currently paused."}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={setting.isLoginEnabled}
                      aria-label={`${label} login access`}
                      disabled={scheduleActive}
                      title={
                        scheduleActive
                          ? "Cannot change while schedule is active. Please cancel the schedule first or wait for it to expire."
                          : undefined
                      }
                      onClick={() =>
                        handleAccessChange(
                          role,
                          "isLoginEnabled",
                          !setting.isLoginEnabled,
                        )
                      }
                      className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${scheduleActive ? "cursor-not-allowed bg-slate-300 opacity-70" : setting.isLoginEnabled ? "bg-emerald-600" : "bg-slate-400"}`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${setting.isLoginEnabled ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </button>
                  </div>

                  <label
                    className="mt-5 block text-sm font-medium text-slate-700"
                    htmlFor={`${role}-message`}
                  >
                    Message shown when access is paused
                  </label>
                  <textarea
                    id={`${role}-message`}
                    rows="3"
                    value={setting.disabledMessage || ""}
                    onChange={(event) =>
                      handleAccessChange(
                        role,
                        "disabledMessage",
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#003883] focus:outline-none focus:ring-2 focus:ring-[#003883]/10"
                    placeholder="Enter the message users should see"
                  />
                  <label
                    className="mt-4 block text-sm font-medium text-slate-700"
                    htmlFor={`${role}-reason`}
                  >
                    Change reason{" "}
                    <span className="font-normal text-slate-400">
                      (optional)
                    </span>
                  </label>
                  <input
                    id={`${role}-reason`}
                    value={setting.changeReason || ""}
                    onChange={(event) =>
                      handleAccessChange(
                        role,
                        "changeReason",
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#003883] focus:outline-none focus:ring-2 focus:ring-[#003883]/10"
                    placeholder="e.g. Scheduled maintenance"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveAccess(role)}
                    disabled={savingRole !== null || scheduleActive}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#003883] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#002b63] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {savingRole === role ? "Saving..." : "Save changes"}
                  </button>

                  <div className="mt-6 max-h-[min(680px,calc(100vh-180px))] overflow-y-auto border-t border-slate-200 pt-5 pr-1">
                    {scheduleActive && (
                      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <p className="font-semibold">
                          Scheduled maintenance is active
                        </p>
                        <p className="mt-1">
                          Cannot change while schedule is active. Please cancel
                          the schedule first or wait for it to expire.
                        </p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <CalendarClock className="h-4 w-4 text-[#003883]" />
                          Automatic access schedule
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">
                          Times use your local timezone and are sent to the
                          server as UTC.
                        </p>
                      </div>
                      {scheduleActive && (
                        <span className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                          {formatRemaining(setting.scheduledEndTime, now)}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        { label: "Starts", field: "scheduledStartLocal" },
                        { label: "Ends", field: "scheduledEndLocal" },
                      ].map(({ label, field }) => {
                        const value =
                          setting[field] ||
                          toLocalDateTimeInput(
                            setting[
                              field === "scheduledStartLocal"
                                ? "scheduledStartTime"
                                : "scheduledEndTime"
                            ],
                          );
                        const isStart = field === "scheduledStartLocal";
                        return (
                          <div
                            key={field}
                            className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <label
                                className="text-xs font-bold uppercase tracking-wide text-slate-600"
                                htmlFor={`${role}-${field}-date`}
                              >
                                {label}
                              </label>
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                                Local time
                              </span>
                            </div>
                            <DatePicker
                              id={`${role}-${field}`}
                              selected={localDateValue(value)}
                              onChange={(date) =>
                                handleScheduleChange(
                                  role,
                                  field,
                                  date
                                    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
                                    : "",
                                )
                              }
                              showTimeSelect
                              withPortal
                              timeIntervals={15}
                              timeCaption="Time"
                              dateFormat="MMM d, yyyy h:mm aa"
                              calendarClassName="role-access-calendar"
                              minDate={
                                isStart
                                  ? new Date()
                                  : localDateValue(
                                      setting.scheduledStartLocal,
                                    ) || new Date()
                              }
                              placeholderText="Select date and time"
                              popperPlacement="bottom-start"
                              popperClassName="role-access-datepicker"
                              className="block min-w-0 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#003883] focus:bg-white focus:ring-2 focus:ring-[#003883]/10"
                              wrapperClassName="block w-full"
                            />
                          </div>
                        );
                      })}
                    </div>
                    <input
                      value={setting.scheduledReason || ""}
                      onChange={(event) =>
                        handleScheduleChange(
                          role,
                          "scheduledReason",
                          event.target.value,
                        )
                      }
                      className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#003883] focus:outline-none"
                      placeholder="Schedule reason (optional)"
                    />
                    <div className="mt-3 flex min-w-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleSchedule(role)}
                        disabled={scheduleActionRole !== null}
                        className="inline-flex max-w-full items-center gap-2 rounded-lg border border-[#003883] px-3 py-2 text-left text-sm font-semibold text-[#003883] transition hover:bg-[#003883]/5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Clock3 className="h-4 w-4" />
                        {scheduleActionRole === role
                          ? "Updating..."
                          : "Schedule automatic pause"}
                      </button>
                      {scheduleActive && (
                        <button
                          type="button"
                          onClick={() => handleCancelSchedule(role)}
                          disabled={scheduleActionRole !== null}
                          className="inline-flex max-w-full items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <X className="h-4 w-4" />
                          Cancel Scheduled Maintenance
                        </button>
                      )}
                    </div>
                    {setting.isScheduled &&
                      setting.scheduledStartTime &&
                      setting.scheduledEndTime && (
                        <p className="mt-2 break-words text-xs text-slate-500">
                          Active window:{" "}
                          {new Date(
                            setting.scheduledStartTime,
                          ).toLocaleString()}{" "}
                          -{" "}
                          {new Date(setting.scheduledEndTime).toLocaleString()}
                        </p>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Workload criteria
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Adjust the rebalancing rules before executing criteria-based
            reassignment.
          </p>

          <div className="mt-6 space-y-4">
            {[
              {
                label: "Workload threshold %",
                key: "workloadThresholdPercentage",
              },
              {
                label: "Target workload max %",
                key: "targetWorkloadMaxPercentage",
              },
              {
                label: "Minimum approval rate %",
                key: "minimumApprovalRatePercentage",
              },
              { label: "Max reassignments", key: "maxReassignments" },
            ].map(({ label, key }) => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {label}
                </label>
                <input
                  type="number"
                  value={criteria[key]}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      [key]: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
                />
              </div>
            ))}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={criteria.reassignIfUnavailable}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      reassignIfUnavailable: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                Reassign if unavailable
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={criteria.prioritizeHighPerformers}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      prioritizeHighPerformers: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                Prioritize high performers
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Reviewer capacity
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Reviewers available for reassignment and their current workload.
          </p>

          <div className="mt-6 space-y-3">
            {reviewers.slice(0, 6).map((reviewer) => (
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
                      {reviewer.availabilityStatus || "Unknown status"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {reviewer.workloadPercentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(balanceResult || criteriaResult) && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Results</h2>
          {balanceResult && (
            <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
              <p className="text-sm text-gray-700">{balanceResult.message}</p>
              {Array.isArray(balanceResult.reassignments) && (
                <p className="text-sm text-gray-500 mt-2">
                  Reassignments: {balanceResult.reassignments.length}
                </p>
              )}
            </div>
          )}
          {criteriaResult && (
            <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
              <p className="text-sm text-gray-700">{criteriaResult.message}</p>
              {Array.isArray(criteriaResult.reassignments) && (
                <p className="text-sm text-gray-500 mt-2">
                  Reassignments: {criteriaResult.reassignments.length}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeadReviewerAdvancedActions;
