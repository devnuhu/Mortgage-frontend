import React, { useState } from "react";
import toast from "react-hot-toast";

const defaultRule = {
  id: null,
  name: "",
  criteria: "daysOverdue",
  threshold: 24,
  action: "reassign",
  assignee: "",
  active: true,
};

const initialRules = [
  {
    id: "rule-1",
    name: "24 Hour Overdue Assignment",
    criteria: "daysOverdue",
    threshold: 24,
    action: "reassign",
    assignee: "nextAvailableReviewer",
    active: true,
  },
  {
    id: "rule-2",
    name: "48 Hour Pending Review",
    criteria: "daysPending",
    threshold: 48,
    action: "notifyManager",
    assignee: "leadReviewer",
    active: true,
  },
];

const AdminEscalationRules = () => {
  const [rules, setRules] = useState(initialRules);
  const [formState, setFormState] = useState(defaultRule);
  const [isEditing, setIsEditing] = useState(false);

  const resetForm = () => {
    setFormState(defaultRule);
    setIsEditing(false);
  };

  const handleChange = (field, value) => {
    setFormState((curr) => ({ ...curr, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formState.name.trim()) {
      toast.error("Escalation rule name is required.");
      return;
    }
    if (!formState.threshold || Number(formState.threshold) <= 0) {
      toast.error("Threshold must be greater than zero.");
      return;
    }

    if (isEditing) {
      setRules((currentRules) =>
        currentRules.map((rule) =>
          rule.id === formState.id ? { ...rule, ...formState } : rule,
        ),
      );
      toast.success("Escalation rule updated.");
    } else {
      setRules((currentRules) => [
        {
          ...formState,
          id: `rule-${Date.now()}`,
        },
        ...currentRules,
      ]);
      toast.success("Escalation rule saved.");
    }

    resetForm();
  };

  const handleEdit = (rule) => {
    setFormState(rule);
    setIsEditing(true);
  };

  const handleDelete = (ruleId) => {
    setRules((currentRules) =>
      currentRules.filter((rule) => rule.id !== ruleId),
    );
    toast.success("Escalation rule removed.");
    if (formState.id === ruleId) {
      resetForm();
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Escalation Rule Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create, edit, and maintain escalation rules for overdue or stalled
              applications.
            </p>
          </div>
        </div>

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Rule name
            </label>
            <input
              type="text"
              value={formState.name}
              onChange={(event) => handleChange("name", event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Example: 24 Hour Overdue Assignment"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Criteria
            </label>
            <select
              value={formState.criteria}
              onChange={(event) => handleChange("criteria", event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="daysOverdue">Days Overdue</option>
              <option value="daysPending">Days Pending</option>
              <option value="unassignedHours">Hours Unassigned</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Threshold
            </label>
            <input
              type="number"
              min="1"
              value={formState.threshold}
              onChange={(event) =>
                handleChange("threshold", event.target.value)
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Action
            </label>
            <select
              value={formState.action}
              onChange={(event) => handleChange("action", event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="reassign">Reassign Reviewer</option>
              <option value="notifyManager">Notify Manager</option>
              <option value="holdForReview">Hold for Senior Review</option>
            </select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Assignee / note
            </label>
            <input
              type="text"
              value={formState.assignee}
              onChange={(event) => handleChange("assignee", event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g. nextAvailableReviewer, leadReviewer, teamLead"
            />
          </div>

          <div className="flex items-center gap-4 sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formState.active}
                onChange={(event) =>
                  handleChange("active", event.target.checked)
                }
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
              />
              Active rule
            </label>
          </div>

          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              {isEditing ? "Update Rule" : "Create Rule"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg bg-white shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Configured escalation rules
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Review active escalation rules and make edits as needed.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Criteria
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Threshold
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                    {rule.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700 capitalize">
                    {rule.criteria}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                    {rule.threshold}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700 capitalize">
                    {rule.action}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${rule.active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}`}
                    >
                      {rule.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(rule)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rule.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No escalation rules configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminEscalationRules;
