import React, { useState } from "react";
import {
  mockApplications,
  calculateDashboardStats,
} from "../../types/application";

const TabNavigation = ({ activeTab, onTabChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Calculate stats for badge numbers
  const stats = calculateDashboardStats(mockApplications);

  // Define navigation tabs
  const tabs = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: "📊",
      description: "Overview and statistics",
      badge: null, // No badge for dashboard
      href: "#dashboard",
    },
    {
      id: "submit",
      name: "Submit Application",
      icon: "📝",
      description: "New mortgage application",
      badge: null,
      href: "#submit-application",
    },
    {
      id: "pending",
      name: "Pending Applications",
      icon: "⏳",
      description: "Applications under review",
      badge: stats.pending > 0 ? stats.pending : null,
      badgeColor: "bg-yellow-100 text-yellow-800",
      href: "#pending-applications",
    },
    {
      id: "approved",
      name: "Post Approval Documentation",
      icon: "✅",
      description: "Approved applications",
      badge: stats.approved > 0 ? stats.approved : null,
      badgeColor: "bg-green-100 text-green-800",
      href: "#post-approval",
    },
    {
      id: "returned",
      name: "Returned Documentation",
      icon: "🔄",
      description: "Applications requiring action",
      badge:
        stats.returned + stats.incomplete > 0
          ? stats.returned + stats.incomplete
          : null,
      badgeColor: "bg-red-100 text-red-800",
      href: "#returned-documentation",
    },
    {
      id: "profile",
      name: "Manage Profile",
      icon: "⚙️",
      description: "Account settings",
      badge: null,
      href: "#manage-profile",
    },
  ];

  const handleTabClick = (tab) => {
    onTabChange(tab.id);
    setIsMobileMenuOpen(false); // Close mobile menu when tab is selected
  };

  const currentTab = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      {/* Mobile Tab Selector */}
      <div className="sm:hidden">
        <div className="relative">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 bg-white border-b border-gray-200"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{currentTab.icon}</span>
              <div>
                <div>{currentTab.name}</div>
                <div className="text-xs text-gray-500">
                  {currentTab.description}
                </div>
              </div>
              {currentTab.badge && (
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${currentTab.badgeColor}`}
                >
                  {currentTab.badge}
                </span>
              )}
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isMobileMenuOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 20 20"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-25 z-40"
                onClick={() => setIsMobileMenuOpen(false)}
              ></div>

              {/* Dropdown */}
              <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 ${
                      activeTab === tab.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{tab.icon}</span>
                      <div>
                        <div
                          className={`text-sm font-medium ${
                            activeTab === tab.id
                              ? "text-blue-700"
                              : "text-gray-700"
                          }`}
                        >
                          {tab.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {tab.description}
                        </div>
                      </div>
                    </div>
                    {tab.badge && (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tab.badgeColor}`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Desktop Tab Navigation */}
      <div className="hidden sm:block">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`
                  relative whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${
                    activeTab === tab.id
                      ? "border-current text-current"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
                style={{
                  color: activeTab === tab.id ? "#A8C045" : undefined,
                  borderBottomColor:
                    activeTab === tab.id ? "#A8C045" : undefined,
                }}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.name}</span>
                  {tab.badge && (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tab.badgeColor}`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Description Bar (Desktop Only) */}
      <div className="hidden sm:block bg-gray-50 px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">{currentTab.description}</div>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Total Applications: {stats.total}</span>
            {stats.pending > 0 && (
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>{stats.pending} Pending</span>
              </span>
            )}
            {stats.returned + stats.incomplete > 0 && (
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>{stats.returned + stats.incomplete} Need Action</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;
