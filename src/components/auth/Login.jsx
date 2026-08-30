import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../../assets/access_logo.png";
import whiteLogo from "../../assets/accesspensions_white.png";
import bgMortgage from "../../assets/bgMortgage.png";
import PasswordChange from "./PasswordChange";
import { Ban, Bell, Clock3, Headphones, Mail, X } from "lucide-react";
import { getCachedActiveRoleSchedule } from "../../services/role-access-api";

const formatScheduleRemaining = (endTime, now) => {
  const remaining = new Date(endTime).getTime() - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return "Schedule ended";
  const totalMinutes = Math.ceil(remaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} ${hours === 1 ? "hour" : "hours"} ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
};

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showFirstLoginFlow, setShowFirstLoginFlow] = useState(false);
  const [accessDisabledMessage, setAccessDisabledMessage] = useState("");
  const [accessSchedule, setAccessSchedule] = useState(null);
  const [popupNow, setPopupNow] = useState(() => Date.now());

  const { login, isLoading, user, requiresPasswordChange } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const loginInputRef = useRef(null);
  const countdownEndTime = accessSchedule?.scheduledEndTime;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!accessDisabledMessage) return undefined;
    setAccessSchedule(getCachedActiveRoleSchedule());
    const timer = window.setInterval(() => {
      setPopupNow(Date.now());
      setAccessSchedule(getCachedActiveRoleSchedule());
    }, 60000);
    return () => window.clearInterval(timer);
  }, [accessDisabledMessage]);

  useEffect(() => {
    if (user) {
      if (
        typeof window !== "undefined" &&
        window.location.hostname === "localhost"
      ) {
        console.log("🔍 Login useEffect sees:", {
          user,
          requiresPasswordChange,
          showFirstLoginFlow,
        });
      }

      if (requiresPasswordChange && !showFirstLoginFlow) {
        console.log("User requires password change - showing first login flow");
        setShowFirstLoginFlow(true);
      } else if (!requiresPasswordChange) {
        const redirectTo = location.state?.from?.pathname || "/dashboard";
        navigate(redirectTo, { replace: true });
      }
    }
  }, [user, requiresPasswordChange, showFirstLoginFlow, navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // FIXED: Simplified handleSubmit - AuthContext handles password change detection
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await login(formData.email, formData.password);
      // AuthContext handles requiresPasswordChange detection automatically
      setErrors({});
    } catch (error) {
      const responseData = error.response?.data;
      const responsePayload = responseData?.data || responseData;
      const accessDisabledCode = [
        error.code,
        responsePayload?.code,
        responsePayload?.Code,
      ].some(
        (code) => String(code).trim().toUpperCase() === "LOGIN_ACCESS_DISABLED",
      );

      if (accessDisabledCode) {
        const currentTime = Date.now();
        setAccessDisabledMessage(
          responsePayload?.message ||
            responsePayload?.Message ||
            error.message ||
            "Login access is temporarily unavailable.",
        );
        const cachedSchedule = getCachedActiveRoleSchedule();
        const responseSchedule = responsePayload?.scheduledEndTime
          ? {
              ...responsePayload,
              isScheduled: true,
            }
          : null;
        setAccessSchedule(responseSchedule || cachedSchedule);
        setPopupNow(currentTime);
        setErrors({});
        return;
      }

      let errorMessage = error.message;

      if (
        errorMessage.toLowerCase().includes("invalid credentials") ||
        errorMessage.toLowerCase().includes("invalid email or password")
      ) {
        errorMessage =
          "Invalid email or password. Please check your credentials.";
      } else if (
        errorMessage.toLowerCase().includes("account locked") ||
        errorMessage.toLowerCase().includes("account disabled")
      ) {
        errorMessage =
          "Your account has been locked or disabled. Please contact support.";
      } else if (errorMessage.toLowerCase().includes("network")) {
        errorMessage = "Network error. Please try again.";
      }

      setErrors({ submit: errorMessage });
    }
  };

  const handleFirstLoginPasswordChangeSuccess = () => {
    console.log("First login password change completed");
    setShowFirstLoginFlow(false);
    toast.success("Password changed successfully!");
    setTimeout(() => navigate("/login", { replace: true }), 900);
  };

  const handleBackToLogin = () => {
    setShowFirstLoginFlow(false);
    setFormData({ email: "", password: "" });
    setErrors({});
  };

  const closeAccessDisabledMessage = () => {
    setAccessDisabledMessage("");
    setAccessSchedule(null);
  };

  const handleForgotPassword = () => {
    toast.info("Forgot password functionality will be implemented soon.");
  };

  return (
    <div className="min-h-screen relative flex flex-col lg:flex-row">
      {accessDisabledMessage && (
        <div
          className="login-access-overlay fixed inset-0 z-50 flex items-center justify-center bg-[#07152e]/60 px-4 py-8 backdrop-blur-sm"
          role="presentation"
          onMouseDown={closeAccessDisabledMessage}
        >
          <section
            className="login-access-modal relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="access-disabled-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="h-1.5 bg-[#d9782b]" />
            <button
              type="button"
              onClick={closeAccessDisabledMessage}
              aria-label="Close message"
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#d9782b] text-white shadow-sm">
                  <Bell className="h-7 w-7" strokeWidth={1.8} />
                </div>
                <div>
                  <h2
                    id="access-disabled-title"
                    className="text-3xl font-bold tracking-tight text-[#101c3b]"
                  >
                    Please Note
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    To serve you better, please note our application
                    availability schedule.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-4 rounded-xl border border-[#e6c99f] bg-[#fffaf4] p-4 sm:p-5">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-[5px] border-[#d9782b] text-[#d9782b] sm:h-20 sm:w-20">
                    <Clock3
                      className="h-9 w-9 sm:h-11 sm:w-11"
                      strokeWidth={1.7}
                    />
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#101c3b]">
                      Application Available
                    </p>
                    <p className="mt-1 text-2xl font-extrabold leading-tight text-[#d9782b] sm:text-3xl">
                      8:00 AM - 5:00 PM
                    </p>
                    <p className="text-base font-bold text-[#101c3b]">Daily</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-xl border border-[#d99d94] bg-[#fff6f5] p-4 sm:p-5">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-[5px] border-[#b33b31] text-[#b33b31] sm:h-20 sm:w-20">
                    <Ban
                      className="h-9 w-9 sm:h-11 sm:w-11"
                      strokeWidth={1.7}
                    />
                  </div>
                  <div>
                    <p className="text-base font-bold leading-5 text-[#b33b31]">
                      Unavailable After Business Hours, Weekends &amp; Holidays
                    </p>
                    <p className="mt-2 text-sm leading-5 text-slate-700">
                      {accessDisabledMessage}
                    </p>
                    {countdownEndTime ? (
                      <div className="mt-3 rounded-lg border border-[#e5b3ac] bg-white/70 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8e2d27]">
                          Access resumes in
                        </p>
                        <p className="mt-0.5 text-lg font-extrabold text-[#b33b31]">
                          {formatScheduleRemaining(countdownEndTime, popupNow)}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs italic text-[#8e2d27]">
                        Access will resume when the scheduled maintenance window
                        ends.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                <Headphones
                  className="h-8 w-8 flex-shrink-0 text-[#101c3b]"
                  strokeWidth={1.7}
                />
                <p className="text-xs leading-5 text-slate-700">
                  For enquiries within business hours,
                  <br />
                  please contact our support team.
                  <a
                    href="mailto:initiatorsamortgage@access-armpensions.com"
                    className="mt-1 inline-flex max-w-full items-center gap-1 break-all font-semibold text-[#003883] underline-offset-2 hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    initiatorsamortgage@access-armpensions.com
                  </a>
                </p>
              </div>
              <button
                type="button"
                onClick={closeAccessDisabledMessage}
                className="mt-6 w-full rounded-lg bg-[#003883] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#002b63] focus:outline-none focus:ring-4 focus:ring-[#003883]/20"
              >
                Return to sign in
              </button>
            </div>
          </section>
        </div>
      )}
      {/* Background Image - Covers entire page */}
      <div className="absolute inset-0 z-0">
        <img src={bgMortgage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#003883]/35 via-[#003883]/30 to-[#003883]/25"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row">
        {/* Left Section - Brand Information */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center lg:justify-start lg:px-16 text-white">
          <div className="max-w-xl rounded-[40px] border border-white/5 bg-[linear-gradient(135deg,rgba(1,26,44,0.32),rgba(1,26,44,0.06))] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.14)] backdrop-blur-[0.5px]">
            <div className="mb-10">
              <img
                src={logo}
                alt="Access Pensions logo"
                className="mb-6 h-20 w-auto object-contain opacity-100"
              />
              <p className="text-lg text-white/95 leading-relaxed font-semibold mb-2">
                Funding Dreams. Empowering Lives. Shaping the Future.
                #FutureShaping
              </p>

              {/* Social Media Links */}
              <div className="flex items-center gap-4 pt-2">
                <a
                  href="https://www.youtube.com/channel/UCs5TldJ5P7oj51o6Olhlzgg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-[#FF8200] transition text-white"
                  title="YouTube"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.615 3.175c-3.674-.576-9.165-.576-12.838 0-3.506.55-3.954 3.487-3.956 8.812.002 5.33.45 8.268 3.956 8.818 3.673.576 9.165.576 12.838 0 3.506-.55 3.954-3.487 3.956-8.818-.002-5.33-.45-8.268-3.956-8.812zM8.25 15.5v-7l6 3.5-6 3.5z" />
                  </svg>
                </a>
                <a
                  href="https://x.com/access_arm?lang=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-[#FF8200] transition text-white"
                  title="X (Twitter)"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.64l-5.207-6.807-5.974 6.807H2.42l7.728-8.835L1.254 2.25h6.823l4.713 6.231 5.734-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/AccessARMPensionsLtd/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-[#FF8200] transition text-white"
                  title="Facebook"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/accesspensions/?hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-[#FF8200] transition text-white"
                  title="Instagram"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m5.521 12.912c0 .643-.008 1.408-.059 2.265-.296 4.965-3.075 6.938-6.977 7.046-1.157.038-2.258.078-4.486 0-2.779-.134-5.682-1.656-5.976-6.977-.027-.551-.052-1.13-.052-1.954 0-.854.016-1.416.036-2.035.293-5.003 3.092-6.937 6.977-7.047.8-.027 1.622-.046 2.444-.046 1.274 0 2.328.023 3.042.054 4.965.293 6.938 3.075 7.046 6.977.038 1.157.078 2.29 0 4.486l-.006.269v.07c-.036 1.123-.057 2.16-.038 3.354m-6.521 4.018c-3.226 0-3.573-.015-4.819-.07-2.117-.093-3.228-1.199-3.322-3.322-.056-1.245-.07-1.593-.07-4.819 0-3.224.014-3.573.07-4.819.095-2.128 1.203-3.231 3.322-3.323 1.246-.057 1.593-.071 4.819-.071s3.573.014 4.819.07c2.122.092 3.227 1.201 3.323 3.323.056 1.246.07 1.593.07 4.819 0 3.226-.014 3.573-.07 4.819-.096 2.126-1.206 3.229-3.323 3.322-1.246.056-1.593.071-4.819.071h.001m3.575-9.261c0 .804-.652 1.456-1.456 1.456s-1.456-.652-1.456-1.456.652-1.456 1.456-1.456 1.456.652 1.456 1.456m-3.575 1.159c-1.575 0-2.851-1.276-2.851-2.851s1.276-2.851 2.851-2.851 2.851 1.276 2.851 2.851-1.276 2.851-2.851 2.851" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#FF8200]/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#FF8200]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Fast & Secure</h3>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 text-sm text-white/70">
              © {currentYear} Access Pensions
            </div>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 lg:py-0 lg:px-8">
          <div className="w-full max-w-xl">
            {showFirstLoginFlow ? (
              <FirstLoginPasswordChangeWrapper
                onPasswordChanged={handleFirstLoginPasswordChangeSuccess}
                onCancel={handleBackToLogin}
              />
            ) : (
              <div className="bg-white backdrop-blur-2xl rounded-3xl shadow-2xl p-12 sm:p-16 border border-white/30 space-y-8">
                {/* Welcome Section */}
                <div className="mb-8">
                  <h2 className="text-4xl font-bold text-black mb-3">
                    Welcome Back
                  </h2>
                  <p className="text-lg text-slate-900 font-semibold">
                    Sign in to your account to continue
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Input */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-base font-bold text-black mb-3"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-slate-700"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-4 py-4 rounded-lg border-2 transition font-semibold text-black placeholder-slate-600 focus:outline-none ${
                          errors.email
                            ? "border-red-400 bg-red-50/80 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                            : "border-slate-300 bg-slate-50/80 focus:border-[#003883] focus:ring-2 focus:ring-[#003883]/10"
                        }`}
                        placeholder="your@email.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-3 flex items-center text-base text-red-700 font-bold">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18.101 12.93a1 1 0 00-1.414-1.414L10 14.586l-6.687-6.687a1 1 0 00-1.414 1.414l8.1 8.1a1 1 0 001.414 0l8.1-8.1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Input */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-base font-bold text-black mb-3"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-slate-700"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <input
                        ref={loginInputRef}
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-12 py-4 rounded-lg border-2 transition font-semibold text-black placeholder-slate-600 focus:outline-none ${
                          errors.password
                            ? "border-red-400 bg-red-50/80 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                            : "border-slate-300 bg-slate-50/80 focus:border-[#003883] focus:ring-2 focus:ring-[#003883]/10"
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        aria-label="Toggle visibility"
                        aria-pressed={showPassword}
                        onMouseDown={(e) => e.preventDefault()}
                        onPointerDown={(e) => e.preventDefault()}
                        onTouchStart={(e) => e.preventDefault()}
                        onClick={() => {
                          setShowPassword((prev) => !prev);

                          const inputEl = loginInputRef.current;
                          if (inputEl) {
                            setTimeout(() => {
                              try {
                                inputEl.focus();
                                const len = inputEl.value.length;
                                inputEl.setSelectionRange(len, len);
                              } catch (err) {}
                            }, 0);
                          }
                        }}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-700 hover:text-slate-900 transition"
                      >
                        {showPassword ? (
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                              clipRule="evenodd"
                            />
                            <path d="M15.171 13.576l1.414 1.414a1 1 0 00.707-.293l-1.72-1.72a2 2 0 00-.401.599zM12.501 8.697l2.578 2.578.961-.961a4 4 0 00-5.115-5.115l.961.961z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-3 flex items-center text-base text-red-700 font-bold">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18.101 12.93a1 1 0 00-1.414-1.414L10 14.586l-6.687-6.687a1 1 0 00-1.414 1.414l8.1 8.1a1 1 0 001.414 0l8.1-8.1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-[#003883] focus:ring-[#003883]"
                      />
                      <span className="ml-2 text-base text-slate-900 font-semibold">
                        Remember me
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-base font-bold text-[#003883] hover:text-[#002652] transition"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {errors.submit && (
                    <div className="rounded-lg bg-red-50 border-2 border-red-300 p-5 text-base text-red-800 font-bold flex items-start gap-3">
                      <svg
                        className="w-6 h-6 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>{errors.submit}</div>
                    </div>
                  )}

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative flex justify-center items-center py-4 px-6 rounded-lg bg-gradient-to-r from-[#FF8200] to-[#FF6900] text-white font-bold shadow-lg shadow-[#FF8200]/30 hover:shadow-xl hover:shadow-[#FF8200]/40 hover:from-[#E67600] hover:to-[#E55A00] focus:outline-none focus:ring-4 focus:ring-[#FF8200]/30 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none text-lg"
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin h-6 w-6 mr-3"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-6 h-6 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Sign In
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper component to adapt your existing PasswordChange for first login flow
const FirstLoginPasswordChangeWrapper = ({ onPasswordChanged, onCancel }) => {
  const { changePassword, user } = useAuth();

  // Override the default PasswordChange behavior
  const handlePasswordChangeSuccess = async () => {
    // The changePassword function in AuthContext already handles the state updates
    onPasswordChanged();
  };

  return (
    <div className="bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20">
      {/* Custom header for first login context */}
      <div className="bg-gradient-to-r from-[#003883] to-[#003883]/80 px-8 py-8 text-white">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold">First Login Detected</h3>
            <p className="text-sm text-white/80 mt-1">
              Welcome, {user?.FirstName || user?.firstName}! Set Your New
              Password to get started.
            </p>
          </div>
        </div>
      </div>

      {/* Use your existing PasswordChange component */}
      <div className="p-8">
        <div className="mb-4">
          <p className="text-lg font-semibold text-slate-800">
            Please create a secure password
          </p>
        </div>
        <PasswordChange
          onSuccess={handlePasswordChangeSuccess}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
};

export default Login;
