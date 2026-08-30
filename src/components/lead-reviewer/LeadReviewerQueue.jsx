import React, { useState } from "react";
import { Search, Clock, CheckCircle, AlertTriangle } from "lucide-react";

const sampleQueue = [
  {
    id: "LR-001",
    borrower: "Amina Yusuf",
    status: "Pending review",
    assignedTo: "Team A",
    priority: "High",
  },
  {
    id: "LR-002",
    borrower: "Emeka Okafor",
    status: "Awaiting documents",
    assignedTo: "Team B",
    priority: "Medium",
  },
  {
    id: "LR-003",
    borrower: "Grace Nwosu",
    status: "Under review",
    assignedTo: "Team A",
    priority: "High",
  },
];

const LeadReviewerQueue = () => {
  const [filter, setFilter] = useState("");

  const filteredQueue = sampleQueue.filter((item) =>
    [item.id, item.borrower, item.status, item.assignedTo, item.priority]
      .join(" ")
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Review Queue
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track the applications assigned for review and next actions.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search queue..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-10 py-2 focus:border-green-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Application
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Borrower
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Team
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Priority
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredQueue.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                    {item.id}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {item.borrower}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      <Clock className="h-3.5 w-3.5" /> {item.status}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {item.assignedTo}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        item.priority === "High"
                          ? "bg-red-100 text-red-700"
                          : item.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredQueue.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">
            No matching review tasks found.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-200 bg-green-50 p-5">
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <p className="text-sm font-semibold">On track</p>
          </div>
          <p className="mt-4 text-sm text-gray-700">
            Most assigned applications are progressing within target review
            time.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-yellow-50 p-5">
          <div className="flex items-center gap-3 text-yellow-700">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm font-semibold">Requires attention</p>
          </div>
          <p className="mt-4 text-sm text-gray-700">
            Escalated items should be reviewed within 24 hours to avoid delay.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeadReviewerQueue;
