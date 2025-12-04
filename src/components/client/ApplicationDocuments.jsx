import React, { useEffect, useMemo, useRef, useState } from "react";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";
import {
  listFiles,
  deleteFileById,
  uploadPdfForApplication,
  replaceFileById,
  downloadFile,
  triggerFileDownload,
  submitApplicationById,
} from "../../services/api";
import {
  getApplicationById,
  getApplicationDocuments,
} from "../../services/application-api";
import toast from "react-hot-toast";
import ConfirmModal from "../ui/ConfirmModal";

const bytesToReadable = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const ApplicationDocuments = ({
  applicationId,
  applicationStatus = null, // new: pass backend application.status when available
  defaultDocumentType = "identity_document",
  onDocumentCountChange, // NEW: Callback to notify parent of document count changes
}) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [replacingMap, setReplacingMap] = useState({}); // { [fileId]: boolean }

  const canUse = useMemo(() => Boolean(applicationId), [applicationId]);

  const load = async () => {
    if (!canUse) return;
    setIsLoading(true);
    setError("");
    try {
      const data = await listFiles(applicationId);
      const documents = Array.isArray(data) ? data : [];
      setItems(documents);

      // NEW: Notify parent of document count change
      if (onDocumentCountChange) {
        onDocumentCountChange(documents.length);
      }
    } catch (e) {
      setError("Failed to load files");
      console.error("Load files error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  // NEW: Notify parent when items change (for real-time updates)
  useEffect(() => {
    if (onDocumentCountChange) {
      onDocumentCountChange(items.length);
    }
  }, [items.length, onDocumentCountChange]);

  const onPickFile = () => fileInputRef.current?.click();

  const onFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      e.target.value = "";
      return;
    }
    setIsUploading(true);
    try {
      await uploadPdfForApplication(applicationId, defaultDocumentType, file);
      await load(); // This will trigger the document count update via load()
    } catch (err) {
      setError("Upload failed");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const onReplaceClick = (fileId) => {
    // programmatically create a file input to avoid cluttering DOM
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.onchange = async (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;

      // basic client-side validation
      if (file.type !== "application/pdf") {
        setError("Only PDF files are allowed");
        return;
      }

      try {
        setReplacingMap((m) => ({ ...m, [fileId]: true }));
        setError("");

        // Call replace endpoint which returns the replaced file DTO
        const replaced = await replaceFileById(fileId, file);

        // After successful replace, do NOT auto-submit. Inform user to manually submit.
        toast.success(
          "Document replaced successfully. Please use Edit & Resubmit to send the application for review."
        );

        // Update local items in-place: replace the existing file entry with the returned DTO
        setItems((prev) => {
          // If server returned the same id, replace in-place
          if (!replaced) return prev;

          const idx = prev.findIndex((x) => String(x.id) === String(fileId));
          if (idx !== -1) {
            const next = [...prev];
            // If server returned a DTO with a different id, remove old entry and insert returned at same index
            next[idx] = replaced;
            // Notify parent of possible count change (usually unchanged)
            if (onDocumentCountChange) onDocumentCountChange(next.length);
            return next;
          }

          // Fallback: if old id not found, ensure replaced is included (avoid duplicates)
          const exists = prev.find((x) => String(x.id) === String(replaced.id));
          if (exists)
            return prev.map((x) =>
              String(x.id) === String(replaced.id) ? replaced : x
            );

          const next = [...prev, replaced];
          if (onDocumentCountChange) onDocumentCountChange(next.length);
          return next;
        });
      } catch (err) {
        console.error("Replace error:", err);
        setError(err.message || "Replace failed");
      } finally {
        setReplacingMap((m) => ({ ...m, [fileId]: false }));
        // cleanup input
        try {
          ev.target.value = "";
        } catch (e) {}
      }
    };

    // trigger file picker
    input.click();
  };

  const onDelete = async (fileId) => {
    // open confirm modal
    setFileToDelete(fileId);
  };

  const confirmDeleteFile = async () => {
    const fileId = fileToDelete;
    if (!fileId) return;
    try {
      await deleteFileById(fileId);
      setItems((prev) => {
        const newItems = prev.filter((x) => x.id !== fileId);
        // NEW: Notify parent of count change immediately
        if (onDocumentCountChange) {
          onDocumentCountChange(newItems.length);
        }
        return newItems;
      });
    } catch (e) {
      setError("Delete failed");
      console.error("Delete error:", e);
    } finally {
      setFileToDelete(null);
    }
  };

  const cancelDeleteFile = () => setFileToDelete(null);

  if (!canUse) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
        Application must be created first before uploading documents.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" /> Documents
          {items.length > 0 && (
            <span className="bg-[#A8C045] text-white text-xs px-2 py-1 rounded-full">
              {items.length}
            </span>
          )}
        </h4>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={onFileSelected}
            className="hidden"
          />
          <button
            onClick={onPickFile}
            disabled={isUploading}
            className="inline-flex items-center gap-2 bg-[#A8C045] text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-green-600 disabled:opacity-60"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Upload PDF
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="p-4 text-gray-500 text-sm flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading documents...
        </div>
      ) : items.length === 0 ? (
        <div className="p-4 text-gray-500 text-sm">
          No documents uploaded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {doc.fileName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {doc.documentType} • {bytesToReadable(doc.fileSize)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Determine allowed actions based on application status (backend-driven) */}
                {["rejected"].includes(
                  (doc.status || applicationStatus || "").toLowerCase()
                ) && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                    Rejected
                  </span>
                )}

                {/* Replace allowed when either the document itself is rejected, or the application requires attention (returned/rejected) */}
                {(doc.status || "").toLowerCase() === "rejected" ||
                ["returned", "rejected"].includes(
                  (applicationStatus || "").toLowerCase()
                ) ? (
                  <button
                    onClick={() => onReplaceClick(doc.id)}
                    className="inline-flex items-center gap-2 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-100"
                    title="Replace"
                    disabled={!!replacingMap[doc.id]}
                  >
                    {replacingMap[doc.id] ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />{" "}
                        Replacing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" /> Replace
                      </>
                    )}
                  </button>
                ) : // Delete allowed when application is in draft or rejected (backend rule)
                ["draft", "rejected"].includes(
                    (applicationStatus || "").toLowerCase()
                  ) ? (
                  <button
                    onClick={() => onDelete(doc.id)}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : (
                  // If delete not allowed, show disabled trash with tooltip
                  <button
                    disabled
                    className="text-gray-400 p-1 rounded"
                    title="Cannot delete in current application status"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                {/* Download button always available if id exists */}
                {doc.id && (
                  <button
                    onClick={async () => {
                      try {
                        const blob = await downloadFile(doc.id);
                        triggerFileDownload(
                          blob,
                          doc.fileName || `file_${doc.id}.pdf`
                        );
                      } catch (err) {
                        console.error("Download failed", err);
                        setError(err.message || "Download failed");
                      }
                    }}
                    className="ml-2 px-2 py-1 bg-white border rounded text-sm hover:bg-gray-50"
                    title="Download"
                  >
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmModal
        isOpen={!!fileToDelete}
        title={fileToDelete ? `Delete file` : "Confirm Delete"}
        message={
          fileToDelete
            ? `Are you sure you want to delete this file? This action cannot be undone.`
            : "Are you sure?"
        }
        loading={false}
        onCancel={cancelDeleteFile}
        onConfirm={confirmDeleteFile}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default ApplicationDocuments;
