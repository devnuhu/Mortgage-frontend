import React, { useEffect, useMemo, useRef, useState } from "react";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";
import {
  listFiles,
  deleteFileById,
  uploadPdfForApplication,
} from "../../services/api";

const bytesToReadable = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const ApplicationDocuments = ({
  applicationId,
  defaultDocumentType = "identity_document",
  onDocumentCountChange, // NEW: Callback to notify parent of document count changes
}) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

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

  const onDelete = async (fileId) => {
    if (!window.confirm("Delete this file?")) return;
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
    }
  };

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
              <button
                onClick={() => onDelete(doc.id)}
                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationDocuments;
