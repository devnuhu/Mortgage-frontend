import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  isAdmin,
  isLeadReviewer,
  isServiceManager,
  isSuperAdmin,
} from "../../types/auth";
import toast from "react-hot-toast";

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState("dashboard");

  // Update active item based on current URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/my-queue")) {
      setActiveItem("my-queue");
    } else if (path.includes("/manage-pmi")) {
      setActiveItem("manage-pmi");
    } else if (path.includes("/manage-admins")) {
      setActiveItem("manage-admins");
    } else if (path.includes("/admin/escalation-rules")) {
      setActiveItem("escalation-rules");
    } else if (path.includes("/service-manager/applications")) {
      setActiveItem("applications");
    } else if (path.includes("/service-manager/create-application")) {
      setActiveItem("submit-application");
    } else if (path.includes("/service-manager/my-drafts")) {
      setActiveItem("pending-applications");
    } else if (path.includes("/service-manager")) {
      setActiveItem("service-manager");
    } else if (path.includes("/applications")) {
      setActiveItem("submissions");
    } else if (path.includes("/submissions")) {
      setActiveItem("submissions");
    } else if (path.includes("/reports")) {
      setActiveItem("reports");
    } else if (path.includes("/lead-reviewer/queue")) {
      setActiveItem("queue");
    } else if (path.includes("/lead-reviewer/reports")) {
      setActiveItem("reports");
    } else if (path.includes("/lead-reviewer/escalations")) {
      setActiveItem("escalations");
    } else if (path.includes("/lead-reviewer/workload")) {
      setActiveItem("workload");
    } else if (path.includes("/lead-reviewer/reviewer-management")) {
      setActiveItem("reviewer-management");
    } else if (path.includes("/lead-reviewer")) {
      setActiveItem("lead-reviewer");
    } else if (path.includes("/submit-application")) {
      setActiveItem("submit-application");
    } else if (path.includes("/pending-applications")) {
      setActiveItem("pending-applications");
    } else if (path.includes("/post-approval")) {
      setActiveItem("post-approval");
    } else if (path.includes("/returned-docs")) {
      setActiveItem("returned-docs");
    } else if (path.includes("/profile")) {
      setActiveItem("profile");
    } else {
      setActiveItem("dashboard");
    }
  }, [location.pathname]);

  // Admin Navigation Items
  const superAdminMenuItems = [
    {
      id: "manage-pmi",
      name: "Manage PMI",
      route: "/admin/manage-pmi",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      description: "Create and manage PMI companies",
    },
    {
      id: "manage-admins",
      name: "Manage Users",
      route: "/admin/manage-admins",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-5.916 3.163A7.97 7.97 0 0012 22a7.97 7.97 0 005.916-4.837A7 7 0 0012 14z"
          />
        </svg>
      ),
      description: "Add and manage users",
    },
    {
      id: "escalation-rules",
      name: "Escalation Rules",
      route: "/admin/escalation-rules",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      description: "Manage escalation rules for overdue applications",
    },
    {
      id: "submissions",
      name: "Submissions",
      route: "/admin/applications",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      description: "Review and approve applications",
    },
    {
      id: "reports",
      name: "Reports",
      route: "/admin/reports",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      description: "View system analytics and reports",
    },
  ];

  const adminReviewerMenuItems = [
    {
      id: "my-queue",
      name: "My Queue",
      route: "/admin/my-queue",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      description: "Assigned applications for review",
    },
    {
      id: "submissions",
      name: "Submissions",
      route: "/admin/applications",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      description: "Review and approve applications",
    },
    {
      id: "reports",
      name: "Reports",
      route: "/admin/reports",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      description: "View analytics and reports",
    },
  ];

  const leadReviewerMenuItems = [
    {
      id: "lead-reviewer",
      name: "Dashboard",
      route: "/lead-reviewer",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      ),
      description: "Review metrics and workload at a glance",
    },
    {
      id: "workload",
      name: "Workload",
      route: "/lead-reviewer/workload",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 0v10m-6-8h12"
          />
        </svg>
      ),
      description: "Balance reviewer capacity and assignments",
    },
    {
      id: "reviewer-management",
      name: "Reviewer Management",
      route: "/lead-reviewer/reviewer-management",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-5.916 3.163A7.97 7.97 0 0012 22a7.97 7.97 0 005.916-4.837A7 7 0 0012 14z"
          />
        </svg>
      ),
      description: "Manage reviewer availability and leave status",
    },
    {
      id: "applications",
      name: "Applications",
      route: "/lead-reviewer/applications",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v8m4-8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2V9a2 2 0 012-2z"
          />
        </svg>
      ),
      description: "Browse and manage all applications",
    },
    {
      id: "reassignments",
      name: "Reassignments",
      route: "/lead-reviewer/reassignments",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-8 8h8m-8 4h8m-8 4h8"
          />
        </svg>
      ),
      description: "Manage single and bulk assignment reassignments",
    },
    {
      id: "reassignment-history",
      name: "Reassignment History",
      route: "/lead-reviewer/reassignment-history",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7h16M4 12h10m-10 5h16"
          />
        </svg>
      ),
      description: "View reassignment audit trail and metrics",
    },
    {
      id: "escalations",
      name: "Escalations",
      route: "/lead-reviewer/escalations",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.29 3.86l-7.2 12.5A2 2 0 005.02 19h13.96a2 2 0 001.93-2.64l-7.2-12.5a2 2 0 00-3.42 0z"
          />
        </svg>
      ),
      description: "Track urgent exceptions and follow ups",
    },
    {
      id: "reports",
      name: "Reports",
      route: "/lead-reviewer/reports",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      description: "Review performance insights and team reports",
    },
    {
      id: "performance",
      name: "Performance Analytics",
      route: "/lead-reviewer/performance",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 11V3m4 18V11m4-1a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      description: "View reviewer performance trends",
    },
    {
      id: "advanced-actions",
      name: "Advanced Actions",
      route: "/lead-reviewer/advanced-actions",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm8-6V7m0 10v-4m0 0h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4a2 2 0 012-2z"
          />
        </svg>
      ),
      description: "Run auto-balance and criteria-based reassignment",
    },
  ];

  // PMI Client Navigation Items
  const serviceManagerMenuItems = [
    {
      id: "service-manager",
      name: "Dashboard",
      route: "/service-manager",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
      ),
      description: "Service Manager dashboard and quick actions",
    },
    {
      id: "all-applications",
      name: "All Applications",
      route: "/service-manager/all-applications",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
      description: "Search all applications by RSA PIN or borrower name",
    },
    {
      id: "applications",
      name: "My Applications",
      route: "/service-manager/applications",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v8m4-8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2V9a2 2 0 012-2z"
          />
        </svg>
      ),
      description: "Search and monitor all applications system-wide",
    },
    {
      id: "submit-application",
      name: "Create Application",
      route: "/service-manager/create-application",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      ),
      description: "Create a new application as Service Manager",
    },
    {
      id: "pending-applications",
      name: "My Drafts",
      route: "/service-manager/my-drafts",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      description: "Update your own draft applications",
    },
  ];

  const clientMenuItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      route: "/client",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
      ),
      description: "Overview and summary",
    },
    {
      id: "submit-application",
      name: "Submit Application",
      route: "/client/submit-application",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      ),
      description: "Submit new mortgage application",
    },
    {
      id: "pending-applications",
      name: "My Applications",
      route: "/client/pending-applications",
      icon: (
        <svg
          className="h-5 w-5"
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
      ),
      description: "View applications under review",
    },
    {
      id: "post-approval",
      name: "Post Approval Documentation",
      route: "/client/post-approval",
      icon: (
        <svg
          className="h-5 w-5"
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
      ),
      description: "Upload post-approval documents",
    },
    {
      id: "returned-docs",
      name: "Returned Documentation",
      route: "/client/returned-docs",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"
          />
        </svg>
      ),
      description: "Handle returned applications",
    },
    {
      id: "profile",
      name: "Manage Profile",
      route: "/client/profile",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      description: "Update profile and settings",
    },
  ];

  const menuItems = isSuperAdmin(user)
    ? [...superAdminMenuItems]
    : isAdmin(user)
      ? adminReviewerMenuItems
      : isLeadReviewer(user)
        ? leadReviewerMenuItems
        : isServiceManager(user)
          ? serviceManagerMenuItems
          : clientMenuItems;

  const handleItemClick = (item) => {
    setActiveItem(item.id);
    setIsMobileOpen(false); // Close mobile sidebar when item is clicked

    if (!item.route) {
      toast.info(`Navigation to ${item.name} - Coming in next modules!`);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <div className="flex items-center">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center mr-3"
            style={{ backgroundColor: "#A8C045" }}
          >
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {isSuperAdmin(user)
                ? "PFA Super Admin"
                : isAdmin(user)
                  ? "PFA Admin"
                  : isLeadReviewer(user)
                    ? "Lead Reviewer Portal"
                    : isServiceManager(user)
                      ? "Service Manager Portal"
                      : "PMI Portal"}
            </h2>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1 rounded-md hover:bg-white/30 backdrop-blur-md"
        >
          <svg
            className="h-5 w-5 text-gray-500"
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
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) =>
          item.route ? (
            <NavLink
              key={item.id}
              to={item.route}
              onClick={() => handleItemClick(item)}
              className={({ isActive }) =>
                `w-full flex items-start p-3 rounded-lg text-left transition-colors ${
                  isActive
                    ? "text-white shadow-md"
                    : "text-slate-700 hover:bg-white/30 hover:backdrop-blur-md"
                }`
              }
              end={
                item.route === "/lead-reviewer" ||
                item.route === "/client" ||
                item.route === "/admin" ||
                item.route === "/service-manager"
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? "#A8C045" : "transparent",
              })}
            >
              <div className="flex-shrink-0 mr-3 pt-0.5">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium`}>{item.name}</p>
                <p className={`text-xs mt-1 text-gray-500`}>
                  {item.description}
                </p>
              </div>
            </NavLink>
          ) : (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`w-full flex items-start p-3 rounded-lg text-left transition-colors ${
                activeItem === item.id
                  ? "text-white shadow-md"
                  : "text-slate-700 hover:bg-white/30 hover:backdrop-blur-md"
              }`}
              style={{
                backgroundColor:
                  activeItem === item.id ? "#A8C045" : "transparent",
              }}
            >
              <div className="flex-shrink-0 mr-3 pt-0.5">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium`}>{item.name}</p>
                <p className={`text-xs mt-1 text-gray-500`}>
                  {item.description}
                </p>
              </div>
            </button>
          ),
        )}
      </nav>

      {/* User Info at Bottom */}
      <div className="p-4 border-t border-white/20">
        <div className="flex items-center">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
            style={{
              backgroundColor: isSuperAdmin(user)
                ? "#063a82ff"
                : isAdmin(user)
                  ? "#EF4444"
                  : "#A8C045",
            }}
          >
            {user?.firstName?.charAt(0)}
            {user?.lastName?.charAt(0)}
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-600 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {isSuperAdmin(user)
                ? "PFA Super Admin"
                : isAdmin(user)
                  ? "PFA Administrator"
                  : isServiceManager(user)
                    ? "Service Manager"
                    : user?.pmiCompanyName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="fixed left-0 top-[104px] z-30 flex w-72 shrink-0">
          <div className="bg-white/70 border-r border-white/20 h-[calc(100vh-104px)] overflow-y-auto backdrop-blur-xl">
            <SidebarContent />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsMobileOpen(false)}
          ></div>

          {/* Sidebar */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white/70 backdrop-blur-xl">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
