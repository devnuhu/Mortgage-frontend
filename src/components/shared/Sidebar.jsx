import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isAdmin, isSuperAdmin } from "../../types/auth";
import toast from "react-hot-toast";

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState("dashboard");

  // Update active item based on current URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/manage-pmi")) {
      setActiveItem("manage-pmi");
    } else if (path.includes("/manage-admins")) {
      setActiveItem("manage-admins");
    } else if (path.includes("/applications")) {
      setActiveItem("submissions");
    } else if (path.includes("/submissions")) {
      setActiveItem("submissions");
    } else if (path.includes("/reports")) {
      setActiveItem("reports");
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

  // PMI Client Navigation Items
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
    ? [...superAdminMenuItems] // super admin sees all super admin menus + submissions already listed there
    : isAdmin(user)
    ? adminReviewerMenuItems
    : clientMenuItems;

  const handleItemClick = (item) => {
    setActiveItem(item.id);
    setIsMobileOpen(false); // Close mobile sidebar when item is clicked

    // Navigate to the route
    if (item.route) {
      navigate(item.route);
    } else {
      // For routes not implemented yet - show non-blocking toast instead of native alert
      toast.info(`Navigation to ${item.name} - Coming in next modules!`);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
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
                : "PMI Portal"}
            </h2>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1 rounded-md hover:bg-gray-100"
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
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={`w-full flex items-start p-3 rounded-lg text-left transition-colors ${
              activeItem === item.id
                ? "text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            style={{
              backgroundColor:
                activeItem === item.id ? "#A8C045" : "transparent",
            }}
            onMouseEnter={(e) => {
              if (activeItem !== item.id) {
                e.target.style.backgroundColor = "#f3f4f6";
              }
            }}
            onMouseLeave={(e) => {
              if (activeItem !== item.id) {
                e.target.style.backgroundColor = "transparent";
              }
            }}
          >
            <div className="flex-shrink-0 mr-3 pt-0.5">{item.icon}</div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  activeItem === item.id ? "text-white" : "text-gray-900"
                }`}
              >
                {item.name}
              </p>
              <p
                className={`text-xs mt-1 ${
                  activeItem === item.id ? "text-green-100" : "text-gray-500"
                }`}
              >
                {item.description}
              </p>
            </div>
          </button>
        ))}
      </nav>

      {/* User Info at Bottom */}
      <div className="p-4 border-t border-gray-200">
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
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-72">
          <div className="bg-white border-r border-gray-200 h-full">
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
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
