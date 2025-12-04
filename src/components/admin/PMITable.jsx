import React, { useState } from "react";
import toast from "react-hot-toast";
import { usePMI } from "../../context/PMIContext";
import { PMIStatus, getStatusColor, formatDate } from "../../types/pmi";

const PMITable = ({ onEditPMI, onAddPMI }) => {
  const {
    pmis,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    updatePMIStatus,
    resetTempPassword,
    deletePMI,
    clearError,
    getPMIStats,
  } = usePMI();

  const [actionLoading, setActionLoading] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const stats = getPMIStats();

  // Handle status change
  const handleStatusChange = async (pmiId, newStatus) => {
    setActionLoading(pmiId);
    const result = await updatePMIStatus(pmiId, newStatus);
    if (!result.success) {
      // Error is handled by context
    }
    setActionLoading(null);
  };

  // Handle password reset
  const handlePasswordReset = async (pmiId) => {
    setActionLoading(pmiId);
    const result = await resetTempPassword(pmiId);
    if (result.success) {
      toast.success(`New temporary password: ${result.tempPassword}`);
    }
    setActionLoading(null);
  };

  // Handle delete PMI
  const handleDeletePMI = async (pmiId) => {
    setActionLoading(pmiId);
    const result = await deletePMI(pmiId);
    if (result.success) {
      setShowDeleteConfirm(null);
    }
    setActionLoading(null);
  };

  if (loading && pmis.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div
            className="animate-spin rounded-full h-6 w-6 border-b-2"
            style={{ borderColor: "#A8C045" }}
          ></div>
          <span className="text-gray-600">Loading PMI companies...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              PMI Companies
            </h2>
            <p className="text-sm text-gray-600">
              Total: {stats.total} • Active: {stats.active} • Inactive:{" "}
              {stats.inactive} • Suspended: {stats.suspended}
            </p>
          </div>
          <button
            onClick={onAddPMI}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50"
            style={{ backgroundColor: "#A8C045" }}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add PMI Company
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search PMI companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:border-opacity-50 sm:text-sm"
                style={{
                  focusRingColor: "#A8C045",
                  focusBorderColor: "#A8C045",
                }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:border-opacity-50"
              style={{ focusRingColor: "#A8C045", focusBorderColor: "#A8C045" }}
            >
              <option value="ALL">All Status</option>
              <option value={PMIStatus.ACTIVE}>Active</option>
              <option value={PMIStatus.INACTIVE}>Inactive</option>
              <option value={PMIStatus.SUSPENDED}>Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={clearError}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PMI Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {pmis.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No PMI companies found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || statusFilter !== "ALL"
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating a new PMI company."}
            </p>
            {!searchQuery && statusFilter === "ALL" && (
              <div className="mt-6">
                <button
                  onClick={onAddPMI}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: "#A8C045" }}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add PMI Company
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PMI Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource Person
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pmis.map((pmi) => (
                  <tr key={pmi.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                            style={{ backgroundColor: "#A8C045" }}
                          >
                            {pmi.pmiName.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {pmi.pmiName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {pmi.emailAddress}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {pmi.resourcePersonName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {pmi.resourcePersonEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pmi.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={pmi.status}
                        onChange={(e) =>
                          handleStatusChange(pmi.id, e.target.value)
                        }
                        disabled={actionLoading === pmi.id}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${getStatusColor(
                          pmi.status
                        )} ${actionLoading === pmi.id ? "opacity-50" : ""}`}
                      >
                        <option value={PMIStatus.ACTIVE}>Active</option>
                        <option value={PMIStatus.INACTIVE}>Inactive</option>
                        <option value={PMIStatus.SUSPENDED}>Suspended</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(pmi.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => onEditPMI(pmi)}
                          disabled={actionLoading === pmi.id}
                          className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                          title="Edit PMI"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>

                        {/* Reset Password Button */}
                        <button
                          onClick={() => handlePasswordReset(pmi.id)}
                          disabled={actionLoading === pmi.id}
                          className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                          title="Reset Password"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                            />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setShowDeleteConfirm(pmi.id)}
                          disabled={actionLoading === pmi.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Delete PMI"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Delete PMI Company
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this PMI company? This action
                  cannot be undone.
                </p>
              </div>
              <div className="flex gap-4 px-4 py-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePMI(showDeleteConfirm)}
                  disabled={actionLoading === showDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {actionLoading === showDeleteConfirm
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PMITable;
