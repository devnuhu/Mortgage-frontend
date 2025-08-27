import React, { useState } from "react";
import PMITable from "./PMITable";
import PMIModal from "./PMIModal";

const ManagePMI = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPMI, setEditingPMI] = useState(null);

  // Handle opening modal for adding new PMI
  const handleAddPMI = () => {
    setEditingPMI(null);
    setIsModalOpen(true);
  };

  // Handle opening modal for editing existing PMI
  const handleEditPMI = (pmi) => {
    setEditingPMI(pmi);
    setIsModalOpen(true);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPMI(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Manage PMI Companies
            </h1>
            <p className="text-gray-600">
              Create, edit, and manage Primary Mortgage Insurance companies.
              Each PMI company can submit mortgage applications on behalf of
              their clients.
            </p>
          </div>
        </div>
      </div>

      {/* PMI Management Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 mb-1">
              PMI Management Guide
            </h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>
                • <strong>Add PMI:</strong> Create new PMI companies with
                temporary passwords
              </p>
              <p>
                • <strong>Edit PMI:</strong> Update company information and
                contact details
              </p>
              <p>
                • <strong>Status Control:</strong> Set companies as Active,
                Inactive, or Suspended
              </p>
              <p>
                • <strong>Password Reset:</strong> Generate new temporary
                passwords when needed
              </p>
              <p>
                • <strong>Search & Filter:</strong> Find specific PMI companies
                quickly
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PMI Table Component */}
      <PMITable onAddPMI={handleAddPMI} onEditPMI={handleEditPMI} />

      {/* PMI Modal Component */}
      <PMIModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editPMI={editingPMI}
      />
    </div>
  );
};

export default ManagePMI;
