import React, { useEffect, useMemo, useState } from "react";
import { FileText, Loader, Search, ArrowLeft, ArrowRight } from "lucide-react";
import { getMyRejectedApplications } from "../../services/application-api";

const ReturnedDocs = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applications, setApplications] = useState([]);
  const [allRejectedApplications, setAllRejectedApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(50);
  const [paginationInfo, setPaginationInfo] = useState({
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  useEffect(() => {
    if (!searchTerm.trim()) {
      loadApplications(pageNumber);
    }
  }, [pageNumber, searchTerm]);

  useEffect(() => {
    if (searchTerm.trim()) {
      if (allRejectedApplications.length === 0) {
        loadAllRejectedApplications();
      }
      setPageNumber(1);
    }
  }, [searchTerm]);

  const loadApplications = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyRejectedApplications(page, pageSize);
      const pagePayload = response?.data || response;
      const data = Array.isArray(pagePayload)
        ? pagePayload
        : pagePayload.data || [];

      const normalizedApps = (data || []).map((app) => ({
        ...app,
        documents: Array.isArray(app.documents) ? app.documents : [],
      }));

      setApplications(normalizedApps);
      setPaginationInfo({
        totalPages: pagePayload.totalPages || 1,
        totalCount: pagePayload.totalCount || normalizedApps.length,
        hasNextPage: pagePayload.hasNextPage || false,
        hasPreviousPage: pagePayload.hasPreviousPage || false,
      });
    } catch (err) {
      console.error("Failed to load returned docs apps:", err);
      setError("Failed to load returned documents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadAllRejectedApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyRejectedApplications(1, 1000);
      const pagePayload = response?.data || response;
      const data = Array.isArray(pagePayload)
        ? pagePayload
        : pagePayload.data || [];
      const normalizedApps = (data || []).map((app) => ({
        ...app,
        documents: Array.isArray(app.documents) ? app.documents : [],
      }));
      setAllRejectedApplications(normalizedApps);
    } catch (err) {
      console.error("Failed to load all rejected applications:", err);
      setError("Failed to search rejected applications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRejectedCount = (app) => {
    const docs = Array.isArray(app.documents) ? app.documents : [];
    return docs.filter(
      (d) => (d.reviewStatus || "").toLowerCase() === "rejected",
    ).length;
  };

  const filteredRejectedApplications = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();
    if (!lowerSearch) return [];

    return (allRejectedApplications || []).filter((app) => {
      const fullName =
        `${app.firstName || ""} ${app.lastName || ""}`.toLowerCase();
      const rsaPin = (app.rsaPin || "").toString().toLowerCase();
      const appNumber = (app.applicationNumber || app.id || "")
        .toString()
        .toLowerCase();

      return (
        appNumber.includes(lowerSearch) ||
        fullName.includes(lowerSearch) ||
        rsaPin.includes(lowerSearch)
      );
    });
  }, [allRejectedApplications, searchTerm]);

  const totalSearchPages = Math.max(
    1,
    Math.ceil(filteredRejectedApplications.length / pageSize),
  );

  const currentPageApplications = useMemo(() => {
    if (!searchTerm.trim()) return applications;
    const start = (pageNumber - 1) * pageSize;
    return filteredRejectedApplications.slice(start, start + pageSize);
  }, [
    applications,
    filteredRejectedApplications,
    pageNumber,
    pageSize,
    searchTerm,
  ]);

  const currentTotalCount = searchTerm.trim()
    ? filteredRejectedApplications.length
    : paginationInfo.totalCount;

  const currentTotalPages = searchTerm.trim()
    ? totalSearchPages
    : paginationInfo.totalPages;

  const hasNextPage = searchTerm.trim()
    ? pageNumber < totalSearchPages
    : paginationInfo.hasNextPage;

  const hasPreviousPage = pageNumber > 1;

  const attentionApps = currentPageApplications;

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

  const handlePreviousPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setPageNumber((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold">Returned Documents</h1>
        <p className="text-gray-600 mt-1">
          Applications that require your attention due to missing or rejected
          documents.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-full md:w-96">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by application no. or name"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadApplications(pageNumber)}
              className="px-4 py-2 rounded-lg bg-[#A8C045] text-white text-sm hover:bg-green-600"
            >
              Refresh
            </button>
          </div>
        </div>
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
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-medium">
                        {app.applicationNumber || app.id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {app.firstName} {app.lastName}
                      </div>
                      {app.rsaPin && (
                        <div className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-1">
                          RSA PIN: {app.rsaPin}
                        </div>
                      )}
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

                  <div className="text-sm text-gray-500">
                    {getRejectedCount(app) > 0 && (
                      <span>{getRejectedCount(app)} rejected document(s)</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-600">
            Showing {attentionApps.length} returned/rejected app(s) on this
            page.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={!hasPreviousPage}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {pageNumber} of {currentTotalPages}
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={!hasNextPage}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnedDocs;
