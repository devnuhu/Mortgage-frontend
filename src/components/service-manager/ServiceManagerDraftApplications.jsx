import React from "react";
import { Link } from "react-router-dom";
import { useApplications } from "../../hooks/useApplications";
import { useAuth } from "../../context/AuthContext";

const ServiceManagerDraftApplications = () => {
  const { user } = useAuth();
  const { applications, isLoading, error, refresh } = useApplications({
    autoRefresh: false,
    initialSort: { field: "createdAt", order: "desc" },
  });

  const drafts = applications.filter(
    (app) => app.status?.toLowerCase() === "draft" && app.userId === user?.id,
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Draft Applications
          </h1>
          <p className="text-gray-600 mt-2">
            Update your own draft applications before submission.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
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
                RSA PIN
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Last updated
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  Loading draft applications...
                </td>
              </tr>
            ) : drafts.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  No draft applications found.
                </td>
              </tr>
            ) : (
              drafts.map((app) => (
                <tr key={app.id || app.applicationNumber}>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {app.applicationNumber || app.id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {`${app.firstName || ""} ${app.lastName || ""}`.trim() ||
                      "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {app.rsaPin || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {new Date(
                      app.updatedAt || app.createdAt || Date.now(),
                    ).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <Link
                      to={`/service-manager/create-application?appId=${app.backendApplicationId || app.id || app.applicationNumber}`}
                      className="inline-flex rounded-md bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                    >
                      Edit draft
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServiceManagerDraftApplications;
