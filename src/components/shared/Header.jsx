import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  UserRole,
  isAdmin,
  isServiceManager,
  isSuperAdmin,
} from "../../types/auth";
import logo from "../../assets/access_logo.png";
import toast from "react-hot-toast";
import ConfirmModal from "../ui/ConfirmModal";

const Header = ({ onMenuToggle }) => {
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
      0,
    )}`.toUpperCase();
  };

  const getUserRole = () => {
    if (!user) return "";
    if (isSuperAdmin(user)) return "PFA Super Admin";
    if (user.role === UserRole.LEAD_REVIEWER) return "Lead Reviewer";
    if (isServiceManager(user)) return "Service Manager";
    return isAdmin(user) ? "PFA Administrator" : "PMI Company";
  };

  const getRoleColor = () => {
    if (!user) return "#6B7280";
    if (isSuperAdmin(user)) return "#003883";
    if (user.role === UserRole.LEAD_REVIEWER) return "#2563eb";
    if (isServiceManager(user)) return "#0f766e";
    return isAdmin(user) ? "#FF8200" : "#8DC63F";
  };

  const portalLabel = isAdmin(user)
    ? "PFA Administration Portal"
    : user?.role === UserRole.LEAD_REVIEWER
      ? "Lead Reviewer Portal"
      : isServiceManager(user)
        ? "Service Manager Portal"
        : "PMI Company Portal";

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/20 bg-white/80 shadow-[0_8px_30px_rgba(0,56,131,0.12)] backdrop-blur-xl">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-24 items-center justify-between gap-4 py-3 sm:min-h-28 sm:gap-6 sm:py-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={onMenuToggle}
                aria-label="Toggle navigation"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/30 bg-white/20 text-[#003883] transition hover:border-white/50 hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8200]/50 backdrop-blur-md lg:hidden"
              >
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
              </button>

              <div className="flex min-w-0 items-center gap-3">
                <img
                  className="h-12 w-auto object-contain sm:h-14"
                  src={logo}
                  alt="Access Pensions logo"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center md:flex">
                <span
                  className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: getRoleColor() }}
                >
                  {getUserRole()}
                </span>
              </div>

              <button
                type="button"
                aria-label="Notifications"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/20 text-[#003883] transition hover:border-white/50 hover:bg-white/40 hover:text-[#FF8200] backdrop-blur-md sm:inline-flex"
              >
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341A6.002 6.002 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-haspopup="menu"
                  aria-expanded={showUserMenu}
                  className="flex items-center gap-2 rounded-full border border-white/30 bg-white/20 p-1.5 pr-3 text-sm transition hover:border-white/50 hover:bg-white/30 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8200]/50"
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: getRoleColor() }}
                  >
                    {getUserInitials()}
                  </div>

                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-semibold text-slate-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>

                  <svg
                    className={`h-4 w-4 text-slate-500 transition ${showUserMenu ? "rotate-180" : ""}`}
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

                {showUserMenu && (
                  <div className="absolute right-0 z-50 mt-3 w-64 origin-top-right rounded-2xl border border-white/30 bg-white/90 p-2 shadow-2xl shadow-slate-300/40 backdrop-blur-xl">
                    <div className="rounded-xl border border-white/40 bg-white/40 p-4 backdrop-blur-md sm:hidden">
                      <p className="text-sm font-semibold text-slate-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {user?.email}
                      </p>
                      <span
                        className="mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                        style={{ backgroundColor: getRoleColor() }}
                      >
                        {getUserRole()}
                      </span>
                    </div>

                    {!isAdmin(user) && user?.pmiCompanyName && (
                      <div className="border-b border-white/20 px-3 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Company
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {user.pmiCompanyName}
                        </p>
                      </div>
                    )}

                    <div className="mt-2 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          toast.info(
                            "Profile management coming in next modules!",
                          );
                        }}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white/40 hover:backdrop-blur-md"
                      >
                        <svg
                          className="mr-3 h-4 w-4 text-slate-400"
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
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          toast.info("Change password coming in next modules!");
                        }}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white/40 hover:backdrop-blur-md"
                      >
                        <svg
                          className="mr-3 h-4 w-4 text-slate-400"
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
                      </button>

                      <div className="mt-2 border-t border-white/20 pt-2">
                        <button
                          type="button"
                          onClick={confirmLogout}
                          className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          <svg
                            className="mr-3 h-4 w-4"
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

      {showUserMenu && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}

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
