// src/components/common/StatusIcons.jsx
import React from "react";

/**
 * Status icon components for application status display
 */

export const ApprovedIcon = ({ className = "h-4 w-4" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export const PendingIcon = ({ className = "h-4 w-4" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export const ReturnedIcon = ({ className = "h-4 w-4" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3"
    />
  </svg>
);

export const RejectedIcon = ({ className = "h-4 w-4" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

/**
 * Get status icon component based on status
 * @param {string} status - Application status
 * @param {string} className - CSS classes for the icon
 * @returns {JSX.Element|null} Status icon component
 */
export const getStatusIcon = (status, className = "h-4 w-4") => {
  const normalizedStatus = status?.toLowerCase();

  switch (normalizedStatus) {
    case "approved":
      return <ApprovedIcon className={className} />;
    case "pending":
    case "submitted":
    case "under_review":
      return <PendingIcon className={className} />;
    case "returned":
    case "needs_revision":
      return <ReturnedIcon className={className} />;
    case "rejected":
    case "declined":
      return <RejectedIcon className={className} />;
    default:
      return null;
  }
};
