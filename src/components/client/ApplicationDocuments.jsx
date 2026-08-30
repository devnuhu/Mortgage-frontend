import React, { useEffect, useMemo, useRef, useState } from "react";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";
import {
  listFiles,
  deleteFileById,
  uploadPdfForApplication,
  replaceFileById,
  downloadFile,
  triggerFileDownload,
  getDocumentTypes,
} from "../../services/api";
import {
  getApplicationById,
  getApplicationDocuments,
} from "../../services/application-api";
import toast from "react-hot-toast";
import ConfirmModal from "../ui/ConfirmModal";
import {
  getDocumentMaxFileSizeBytes,
  getDocumentMaxFileSizeLabel,
} from "../../services/documentSize";

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
  onDocumentCountChange, // Callback to notify parent of document count changes
  onMandatoryDocumentsChange, // NEW: Callback to report mandatory doc upload status
}) => {
  const [items, setItems] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [replacingMap, setReplacingMap] = useState({}); // { [fileId]: boolean }

  const canUse = useMemo(() => Boolean(applicationId), [applicationId]);
  const normalizedStatus = useMemo(
    () => (applicationStatus || "").toLowerCase(),
    [applicationStatus],
  );
  const isEditable = useMemo(
    () => ["draft", "rejected"].includes(normalizedStatus),
    [normalizedStatus],
  );

  const isRejectedApp = useMemo(
    () => normalizedStatus === "rejected",
    [normalizedStatus],
  );

  const isDraft = useMemo(
    () => normalizedStatus === "draft",
    [normalizedStatus],
  );

  const load = async () => {
    if (!canUse) return;
    setIsLoading(true);
    setError("");
    try {
      const [typesData, filesData] = await Promise.all([
        getDocumentTypes(),
        listFiles(applicationId),
      ]);

      const documentTypeList = Array.isArray(typesData) ? typesData : [];
      const documents = Array.isArray(filesData) ? filesData : [];

      const normalizedDocumentTypes = [...documentTypeList]
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map((type) => ({
          ...type,
          maxFileSizeKB: Math.round(
            getDocumentMaxFileSizeBytes(type.code) / 1024,
          ),
        }));

      setDocumentTypes(normalizedDocumentTypes);
      setItems(documents);

      if (onDocumentCountChange) {
        onDocumentCountChange(documents.length);
      }
    } catch (e) {
      setError("Failed to load document types or files. Please refresh.");
      console.error("Load documents error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  // Notify parent when items change
  useEffect(() => {
    if (onDocumentCountChange) {
      onDocumentCountChange(items.length);
    }
  }, [items.length, onDocumentCountChange]);

  const onPickFile = (documentType) => {
    if (!isEditable) return;
    setSelectedDocumentType(documentType);
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      e.target.value = "";
      return;
    }

    const selectedType = documentTypes.find(
      (docType) => docType.code === selectedDocumentType,
    );
    if (!selectedType) {
      setError("Please choose a document type before selecting a file.");
      e.target.value = "";
      return;
    }

    const maxFileSizeBytes = getDocumentMaxFileSizeBytes(selectedType.code);
    if (file.size > maxFileSizeBytes) {
      setError(
        `File exceeds maximum size of ${getDocumentMaxFileSizeLabel(selectedType.code)} for ${selectedType.name}.`,
      );
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      await uploadPdfForApplication(applicationId, selectedDocumentType, file);
      await load(); // Reload doc list and types
    } catch (err) {
      setError(err.message || "Upload failed");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      setSelectedDocumentType("");
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

      const replacementDocumentType =
        items.find((item) => String(item.id) === String(fileId))
          ?.documentType ||
        selectedDocumentType ||
        "";
      const maxFileSizeBytes = getDocumentMaxFileSizeBytes(
        replacementDocumentType,
      );
      if (file.size > maxFileSizeBytes) {
        setError(
          `File exceeds maximum size of ${getDocumentMaxFileSizeLabel(replacementDocumentType)} for this document.`,
        );
        return;
      }

      try {
        setReplacingMap((m) => ({ ...m, [fileId]: true }));
        setError("");

        // Call replace endpoint which returns the replaced file DTO
        const replaced = await replaceFileById(
          fileId,
          file,
          replacementDocumentType,
        );

        // After successful replace, do NOT auto-submit. Inform user to manually submit.
        toast.success(
          "Your document has been re-uploaded and is pending review. Your application status remains rejected until all documents are approved.",
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
              String(x.id) === String(replaced.id) ? replaced : x,
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

  const confirmDeleteFile = async () => {
    const fileId = fileToDelete;
    if (!fileId) return;
    setError("");
    try {
      const response = await deleteFileById(fileId);
      setItems((prev) => {
        const newItems = prev.filter((x) => x.id !== fileId);
        if (onDocumentCountChange) {
          onDocumentCountChange(newItems.length);
        }
        return newItems;
      });
      toast.success(response?.message || "File deleted successfully.");
    } catch (e) {
      const message = e?.message || "Delete failed";
      setError(message);
      toast.error(message);
      console.error("Delete error:", e);
    } finally {
      setFileToDelete(null);
    }
  };

  const cancelDeleteFile = () => setFileToDelete(null);

  const documentsByType = useMemo(
    () =>
      items.reduce((map, file) => {
        if (file.documentType) {
          map[file.documentType] = file;
        }
        return map;
      }, {}),
    [items],
  );

  const getDocumentReviewStatus = (doc) => {
    if (!doc) return "";
    return (
      doc.reviewStatusName ||
      doc.reviewStatus ||
      doc.documentStatus ||
      doc.status ||
      ""
    )
      .toString()
      .trim();
  };

  const getDocumentStatusDisplay = (doc) => {
    const statusText = getDocumentReviewStatus(doc);
    if (!statusText) {
      return { label: "Uploaded", reason: "" };
    }

    const normalized = statusText.toLowerCase();
    const reason =
      doc?.rejectionReason ||
      doc?.reviewComment ||
      doc?.reviewComments ||
      doc?.reason ||
      doc?.rejectedReason ||
      doc?.comments ||
      "";

    if (normalized === "rejected") {
      return { label: "Rejected", reason };
    }
    if (normalized === "approved") {
      return { label: "Approved", reason };
    }
    if (normalized === "returned") {
      return { label: "Returned", reason };
    }
    if (normalized === "pending" || normalized === "pendingreview") {
      return { label: "Pending review", reason };
    }

    return { label: statusText, reason };
  };

  // Ensure `identity_document` is always treated as optional in the UI
  const mandatoryTypes = documentTypes.filter(
    (type) => type.isMandatory && String(type.code) !== "identity_document",
  );
  const optionalTypes = documentTypes.filter(
    (type) => !type.isMandatory || String(type.code) === "identity_document",
  );
  const mandatoryUploadedCount = mandatoryTypes.filter(
    (type) => documentsByType[type.code],
  ).length;
  const optionalUploadedCount = optionalTypes.filter(
    (type) => documentsByType[type.code],
  ).length;

  // NEW: Notify parent of mandatory document upload status
  useEffect(() => {
    if (onMandatoryDocumentsChange) {
      onMandatoryDocumentsChange(mandatoryUploadedCount, mandatoryTypes.length);
    }
  }, [
    mandatoryUploadedCount,
    mandatoryTypes.length,
    onMandatoryDocumentsChange,
  ]);

  if (!canUse) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
        Application must be created first before uploading documents.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={onFileSelected}
        className="hidden"
      />

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#A8C045]" />
              Document Upload
            </h4>
            <p className="text-sm text-slate-500 mt-1">
              Upload required PDF documents for this application. Draft or
              Rejected applications can upload and replace files.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm text-slate-700">
            <div className="rounded-md bg-slate-50 p-3 border border-slate-200">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Mandatory
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {mandatoryUploadedCount} / {mandatoryTypes.length}
              </div>
            </div>
            <div className="rounded-md bg-slate-50 p-3 border border-slate-200">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Optional
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {optionalUploadedCount} / {optionalTypes.length}
              </div>
            </div>
          </div>
        </div>

        {!isEditable && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Uploads are disabled for this application status. Only Draft or
            Rejected applications may upload documents.
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="p-4 text-gray-500 text-sm flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading document types and uploads...
        </div>
      ) : (
        <div className="space-y-4">
          {documentTypes.length === 0 ? (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
              No document types are available. Please refresh the page or
              contact support.
            </div>
          ) : (
            <>
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900">
                      Required Documents
                    </h5>
                    <p className="text-xs text-gray-500 mt-1">
                      Upload all mandatory documents before submitting your
                      application.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                    {mandatoryTypes.length} required
                  </span>
                </div>
                <div className="space-y-3">
                  {mandatoryTypes.map((docType) => {
                    const uploadedDoc = documentsByType[docType.code];
                    const statusDisplay = getDocumentStatusDisplay(uploadedDoc);
                    return (
                      <div
                        key={docType.code}
                        className={`rounded-lg border p-4 ${uploadedDoc ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"}`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {docType.name}
                              </span>
                              <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-[0.2em] rounded-sm bg-red-600 px-2 py-0.5 text-white">
                                Mandatory
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {docType.description}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Max size:{" "}
                              {getDocumentMaxFileSizeLabel(docType.code)} · PDF
                              only
                            </p>
                          </div>
                          <div className="flex flex-col items-start gap-2 sm:items-end">
                            {uploadedDoc ? (
                              <div className="space-y-2 text-sm">
                                <div className="text-slate-700">
                                  Uploaded:{" "}
                                  {bytesToReadable(uploadedDoc.fileSize)}
                                </div>
                                <div
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    statusDisplay.label.toLowerCase() ===
                                    "rejected"
                                      ? "bg-red-100 text-red-700"
                                      : statusDisplay.label.toLowerCase() ===
                                          "approved"
                                        ? "bg-green-100 text-green-700"
                                        : statusDisplay.label.toLowerCase() ===
                                            "returned"
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  Status: {statusDisplay.label}
                                </div>
                                {statusDisplay.reason && (
                                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    <span className="font-semibold">
                                      Rejection reason:
                                    </span>{" "}
                                    {statusDisplay.reason}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-slate-500">
                                Not uploaded
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {(() => {
                                // In a rejected application we only allow re-uploads (replacements)
                                // for files that were themselves marked as rejected. New uploads
                                // (for types without an existing file) remain allowed. For
                                // draft apps everything is allowed.
                                const documentReviewStatus =
                                  getDocumentReviewStatus(uploadedDoc);
                                const canUploadForType =
                                  !isUploading &&
                                  isEditable &&
                                  (!isRejectedApp ||
                                    !uploadedDoc ||
                                    documentReviewStatus.toLowerCase() ===
                                      "rejected" ||
                                    documentReviewStatus.toLowerCase() ===
                                      "returned");

                                return (
                                  <>
                                    {uploadedDoc && isDraft ? (
                                      <button
                                        onClick={() =>
                                          setFileToDelete(uploadedDoc.id)
                                        }
                                        className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => onPickFile(docType.code)}
                                        disabled={!canUploadForType}
                                        className="inline-flex items-center gap-2 rounded-md bg-[#A8C045] px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                        <Upload className="h-4 w-4" />
                                        {uploadedDoc ? "Replace" : "Upload"}
                                      </button>
                                    )}
                                  </>
                                );
                              })()}
                              {uploadedDoc && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const blob = await downloadFile(
                                        uploadedDoc.id,
                                      );
                                      triggerFileDownload(
                                        blob,
                                        uploadedDoc.fileName ||
                                          `${docType.code}.pdf`,
                                      );
                                    } catch (err) {
                                      console.error("Download failed", err);
                                      setError(
                                        err.message || "Download failed",
                                      );
                                    }
                                  }}
                                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  Download
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {optionalTypes.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900">
                        Optional Documents
                      </h5>
                      <p className="text-xs text-gray-500 mt-1">
                        Upload these if applicable to you.
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-slate-700 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                      {optionalTypes.length} optional
                    </span>
                  </div>
                  <div className="space-y-3">
                    {optionalTypes.map((docType) => {
                      const uploadedDoc = documentsByType[docType.code];
                      const statusDisplay =
                        getDocumentStatusDisplay(uploadedDoc);
                      return (
                        <div
                          key={docType.code}
                          className={`rounded-lg border p-4 ${uploadedDoc ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"}`}
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  {docType.name}
                                </span>
                                <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-[0.2em] rounded-sm bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-700">
                                  If Applicable
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {docType.description}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Max size:{" "}
                                {getDocumentMaxFileSizeLabel(docType.code)}· PDF
                                only
                              </p>
                            </div>
                            <div className="flex flex-col items-start gap-2 sm:items-end">
                              {uploadedDoc ? (
                                <div className="space-y-2 text-sm">
                                  <div className="text-slate-700">
                                    Uploaded:{" "}
                                    {bytesToReadable(uploadedDoc.fileSize)}
                                  </div>
                                  <div
                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                      statusDisplay.label.toLowerCase() ===
                                      "rejected"
                                        ? "bg-red-100 text-red-700"
                                        : statusDisplay.label.toLowerCase() ===
                                            "approved"
                                          ? "bg-green-100 text-green-700"
                                          : statusDisplay.label.toLowerCase() ===
                                              "returned"
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    Status: {statusDisplay.label}
                                  </div>
                                  {statusDisplay.reason && (
                                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                      <span className="font-semibold">
                                        Rejection reason:
                                      </span>{" "}
                                      {statusDisplay.reason}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-slate-500">
                                  Not uploaded
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2">
                                {(() => {
                                  const documentReviewStatus =
                                    getDocumentReviewStatus(uploadedDoc);
                                  const canUploadForType =
                                    !isUploading &&
                                    isEditable &&
                                    (!isRejectedApp ||
                                      !uploadedDoc ||
                                      documentReviewStatus.toLowerCase() ===
                                        "rejected" ||
                                      documentReviewStatus.toLowerCase() ===
                                        "returned");

                                  return (
                                    <>
                                      {uploadedDoc && isDraft ? (
                                        <button
                                          onClick={() =>
                                            setFileToDelete(uploadedDoc.id)
                                          }
                                          className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          Delete
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            onPickFile(docType.code)
                                          }
                                          disabled={!canUploadForType}
                                          className="inline-flex items-center gap-2 rounded-md bg-[#A8C045] px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                          <Upload className="h-4 w-4" />
                                          {uploadedDoc ? "Replace" : "Upload"}
                                        </button>
                                      )}
                                    </>
                                  );
                                })()}
                                {uploadedDoc && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const blob = await downloadFile(
                                          uploadedDoc.id,
                                        );
                                        triggerFileDownload(
                                          blob,
                                          uploadedDoc.fileName ||
                                            `${docType.code}.pdf`,
                                        );
                                      } catch (err) {
                                        console.error("Download failed", err);
                                        setError(
                                          err.message || "Download failed",
                                        );
                                      }
                                    }}
                                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    Download
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
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
