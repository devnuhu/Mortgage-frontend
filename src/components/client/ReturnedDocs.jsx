import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  X,
  CheckCircle,
  Loader,
  Download,
  ArrowRight,
} from "lucide-react";
import {
  getMyApplications,
  getApplicationDocuments,
  getApplicationReviewHistory,
  getApplicationById,
} from "../../services/application-api";
import {
  replaceFileById,
  downloadFile,
  triggerFileDownload,
  submitApplicationById,
} from "../../services/api";
import toast from "react-hot-toast";

const ReturnedDocs = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applications, setApplications] = useState([]);
  const [documentsMap, setDocumentsMap] = useState({});
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [replacingMap, setReplacingMap] = useState({});
  const [reviewHistoryMap, setReviewHistoryMap] = useState({});
  const historyRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await getMyApplications();
      setApplications(data || []);

      // Preload documents for each application in parallel (keeps UI snappy)
      const docsPromises = (data || []).map((app) =>
        getApplicationDocuments(app.id).then((docs) => ({ id: app.id, docs }))
      );

      const docsResults = await Promise.allSettled(docsPromises);
      const map = {};
      docsResults.forEach((r) => {
        if (r.status === "fulfilled") {
          map[r.value.id] = r.value.docs || [];
          console.debug("Loaded docs for app", r.value.id, map[r.value.id]);
        }
      });
      setDocumentsMap(map);
    } catch (err) {
      console.error("Failed to load returned docs apps:", err);
      setError("Failed to load returned documents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRejectedCount = (app) => {
    const docs = documentsMap[app.id] || [];
    const byDocStatus = docs.filter(
      (d) => (d.status || "").toLowerCase() === "rejected"
    ).length;
    if (byDocStatus > 0) return byDocStatus;
    // fallback: inspect review history for rejected entries
    const history = reviewHistoryMap[app.id] || [];
    return history.filter((h) => (h.status || "").toLowerCase() === "rejected")
      .length;
  };

  const attentionApps = applications.filter((a) => {
    const st = (a.status || "").toLowerCase();
    return (
      st === "returned" ||
      st === "rejected" ||
      (documentsMap[a.id] || []).some(
        (d) => (d.status || "").toLowerCase() === "rejected"
      )
    );
  });

  const openModal = async (app) => {
    setSelectedApp(app);
    setShowModal(true);

    // ensure documents loaded
    if (!documentsMap[app.id]) {
      try {
        const docs = await getApplicationDocuments(app.id);
        console.debug("Loaded docs for modal open", app.id, docs);
        setDocumentsMap((prev) => ({ ...prev, [app.id]: docs }));
      } catch (err) {
        console.error("Failed to load documents for app:", err);
        setDocumentsMap((prev) => ({ ...prev, [app.id]: [] }));
      }
    }

    // load review history for this application (if not already loaded)
    if (!reviewHistoryMap[app.id]) {
      try {
        const history = await getApplicationReviewHistory(app.id);
        setReviewHistoryMap((prev) => ({ ...prev, [app.id]: history }));
      } catch (err) {
        console.warn("No review history available for app", app.id, err);
        setReviewHistoryMap((prev) => ({ ...prev, [app.id]: [] }));
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedApp(null);
  };

  const onReplaceClick = (docId) => {
    // open file picker
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are allowed");
        return;
      }

      try {
        setReplacingMap((p) => ({ ...p, [docId]: true }));
        await replaceFileById(docId, file);
        toast.success("Document replaced successfully");

        // After successful replace, do NOT auto-submit. Let the user manually submit.
        toast.success(
          "Document replaced successfully. Please use Edit & Resubmit to send the application for review."
        );

        // reload documents for selected app
        if (selectedApp) {
          const docs = await getApplicationDocuments(selectedApp.id);
          setDocumentsMap((prev) => ({ ...prev, [selectedApp.id]: docs }));

          // refresh application status from backend in case server updated it
          try {
            const updated = await getApplicationById(selectedApp.id);
            if (updated) {
              setSelectedApp(updated);
              // refresh the overall applications list so counts/status update
              await loadApplications();
            }
          } catch (err) {
            console.warn("Could not refresh application after replace:", err);
          }
          // Explicitly reload review history and scroll the modal to the history section
          try {
            const history = await getApplicationReviewHistory(selectedApp.id);
            setReviewHistoryMap((prev) => ({
              ...prev,
              [selectedApp.id]: history || [],
            }));
            // scroll to history area so user sees the updated entry
            if (historyRef.current) {
              historyRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          } catch (err) {
            console.warn(
              "Could not refresh review history after replace:",
              err
            );
          }
        }
      } catch (err) {
        console.error("Replace failed:", err);
        toast.error(err.message || "Failed to replace document");
      } finally {
        setReplacingMap((p) => ({ ...p, [docId]: false }));
      }
    };

    input.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader className="animate-spin w-8 h-8 text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold">Returned Documents</h1>
        <p className="text-gray-600 mt-1">
          Applications that require your attention due to missing or rejected
          documents.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        {attentionApps.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto w-16 h-16 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mt-4">
              No returned documents
            </h3>
            <p className="text-gray-500 mt-2">You're all caught up.</p>
          </div>
        ) : (
          <div className="p-4">
            <ul className="space-y-3">
              {attentionApps.map((app) => (
                <li
                  key={app.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium">
                        {app.applicationNumber || app.id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {app.firstName} {app.lastName}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Status: {app.status}
                      {getRejectedCount(app) > 0 && (
                        <span className="ml-3 text-red-600">
                          {getRejectedCount(app)} rejected document(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => openModal(app)}
                      className="px-3 py-2 bg-white border rounded-md text-sm hover:bg-gray-50"
                    >
                      View
                    </button>
                    <button
                      onClick={() =>
                        navigate("/client/submit-application", {
                          state: { appId: app.id },
                        })
                      }
                      className="px-3 py-2 bg-[#A8C045] text-white rounded-md text-sm hover:bg-green-600"
                    >
                      Edit & Resubmit
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 z-10">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">
                  Application {selectedApp.applicationNumber || selectedApp.id}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedApp.firstName} {selectedApp.lastName}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X />
              </button>
            </div>

            <div className="mt-4">
              <h4 className="font-medium">Documents</h4>
              <div className="mt-2 space-y-2">
                {(documentsMap[selectedApp.id] || []).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <div className="font-medium">
                        {doc.fileName || doc.name || doc.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Status: {doc.status || "available"}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {((doc.status || "").toLowerCase() === "rejected" ||
                        (selectedApp &&
                          ["returned", "rejected"].includes(
                            (selectedApp.status || "").toLowerCase()
                          ))) && (
                        <>
                          <button
                            onClick={() => onReplaceClick(doc.id)}
                            className="px-3 py-2 bg-white border rounded-md text-sm hover:bg-gray-50"
                          >
                            {replacingMap[doc.id] ? "Replacing..." : "Replace"}
                          </button>
                        </>
                      )}
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
                              console.error("Download failed:", err);
                              toast.error(
                                err.message || "Download not available"
                              );
                            }
                          }}
                          className="px-3 py-2 bg-white border rounded-md text-sm hover:bg-gray-50"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium">Review History</h4>
              <div
                ref={historyRef}
                className="mt-2 space-y-2 text-sm text-gray-700"
              >
                {(reviewHistoryMap[selectedApp.id] || []).length === 0 && (
                  <div className="text-gray-500">
                    No review history available.
                  </div>
                )}
                {(reviewHistoryMap[selectedApp.id] || []).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border rounded-md bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">
                          {item.reviewerName || item.reviewer || "Reviewer"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(
                            item.createdAt || item.timestamp || item.date
                          ).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-xs text-right">
                        <div className="font-semibold">
                          {(item.status || "").replace(/_/g, " ")}
                        </div>
                      </div>
                    </div>
                    {item.comments && (
                      <div className="mt-2 text-sm text-gray-700">
                        {item.comments}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-md border"
              >
                Close
              </button>
              <a
                href="/client/pending-applications"
                className="ml-3 px-4 py-2 rounded-md bg-[#A8C045] text-white"
              >
                Edit & Resubmit
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnedDocs;
