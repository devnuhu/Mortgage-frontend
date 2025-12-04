import React, { useEffect, useRef, useState } from "react";

const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
}) => {
  const [mounted, setMounted] = useState(isOpen);
  const overlayRef = useRef(null);
  const confirmRef = useRef(null);

  // Mount/unmount with animation
  useEffect(() => {
    if (isOpen) setMounted(true);
  }, [isOpen]);

  // After mounting, if closed, wait for animation before unmounting
  // We will unmount after the CSS transition duration when modal is closed
  const TRANSITION_DURATION_MS = 200;

  // ESC key to cancel
  useEffect(() => {
    const onKey = (e) => {
      try {
        if (e.key === "Escape") {
          onCancel && onCancel();
          return;
        }

        if (e.key === "Enter") {
          if (document.activeElement === confirmRef.current) {
            onConfirm && onConfirm();
          }
          return;
        }

        // Focus trap for Tab / Shift+Tab
        if (e.key === "Tab") {
          const modal = document.querySelector("[role=dialog]");
          if (!modal) return;
          const focusable = modal.querySelectorAll(
            'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (!focusable || focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      } catch (err) {
        // Swallow errors to avoid blocking UI
        // Log to console for debugging
        // eslint-disable-next-line no-console
        console.error("ConfirmModal keyboard handler error:", err);
      }
    };

    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onCancel, onConfirm]);

  // Focus management: focus confirm button when modal opens
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setTimeout(() => {
        confirmRef.current?.focus();
      }, 50);
    } else {
      // When closing, unmount after transition duration so CSS can animate
      const t = setTimeout(
        () => setMounted(false),
        TRANSITION_DURATION_MS + 20
      );
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 99999 }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <div
        ref={overlayRef}
        onClick={onCancel}
        style={{ zIndex: 99990 }}
        className={`fixed inset-0 bg-black transition-opacity duration-200 ${
          isOpen
            ? "opacity-40 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      <div
        style={{ zIndex: 100000 }}
        className={`relative bg-white rounded-lg shadow-lg max-w-md w-full p-6 transform transition-all duration-200 ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
      >
        <h3
          id="confirm-modal-title"
          className="text-lg font-semibold text-gray-900 mb-2"
        >
          {title}
        </h3>
        <p id="confirm-modal-desc" className="text-sm text-gray-600 mb-4">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
