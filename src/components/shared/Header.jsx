import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { UserRole, isAdmin, isSuperAdmin } from "../../types/auth";
import logo from "../../assets/Logo.png";
import toast from "react-hot-toast";
import ConfirmModal from "../ui/ConfirmModal";

const Header = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const getUserInitials = () => {
    if (!user) return "";
    return `${user.firstName.charAt(0)}${user.lastName.charAt(
      0
    )}`.toUpperCase();
  };

  const getUserRole = () => {
    if (!user) return "";
    if (isSuperAdmin(user)) return "PFA Super Admin";
    return isAdmin(user) ? "PFA Administrator" : "PMI Company";
  };

  const getRoleColor = () => {
    if (!user) return "#6B7280";
    return isSuperAdmin(user)
      ? "#063a82ff"
      : isAdmin(user)
      ? "#EF4444"
      : "#A8C045";
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-28">
            {/* Logo and System Name */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-24 w-24 rounded-lg flex items-center justify-center mr-10">
                  <svg
                    className="h-8 w-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2zm0 0V9a2 2 0 012-2h14a2 2 0 012 2v2M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2"
                    />
                  </svg>
                  <img className="h-10 w-23 text-white " src={logo} alt="" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-500">
                    Access ARM Mortgage
                  </h1>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    {isAdmin(user)
                      ? "PFA Administration Portal"
                      : "PMI Company Portal"}
                  </p>
                </div>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* User Role Badge */}
              <div className="hidden md:flex items-center">
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getRoleColor() }}
                >
                  {getUserRole()}
                </span>
              </div>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 p-2 hover:bg-gray-50"
                  style={{ focusRingColor: "rgba(168, 192, 69, 0.5)" }}
                >
                  {/* User Avatar */}
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: getRoleColor() }}
                  >
                    {getUserInitials()}
                  </div>

                  {/* User Info - Hidden on mobile */}
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>

                  {/* Dropdown Arrow */}
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
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

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      {/* User Info - Visible on mobile */}
                      <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </p>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white mt-2"
                          style={{ backgroundColor: getRoleColor() }}
                        >
                          {getUserRole()}
                        </span>
                      </div>

                      {/* PMI Company Info */}
                      {!isAdmin(user) && user?.pmiCompanyName && (
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-xs text-gray-500">Company</p>
                          <p className="text-sm font-medium text-gray-900">
                            {user.pmiCompanyName}
                          </p>
                        </div>
                      )}

                      {/* Menu Items */}
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          // Will add profile management later
                          toast.info(
                            "Profile management coming in next modules!"
                          );
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          <svg
                            className="mr-3 h-4 w-4 text-gray-400"
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
                          Manage Profile
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          // Will add change password later
                          toast.info("Change password coming in next modules!");
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          <svg
                            className="mr-3 h-4 w-4 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.414-6.414a6 6 0 016.414-6.414z"
                            />
                          </svg>
                          Change Password
                        </div>
                      </button>

                      <div className="border-t border-gray-100">
                        <button
                          onClick={confirmLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                          <div className="flex items-center">
                            <svg
                              className="mr-3 h-4 w-4 text-red-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            Sign Out
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Click outside to close dropdown */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to login again to access the application."
        confirmLabel="Logout"
        cancelLabel="Cancel"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleLogout();
        }}
        onCancel={() => {
          setShowLogoutConfirm(false);
          setShowUserMenu(false);
        }}
      />
    </>
  );
};

export default Header;
