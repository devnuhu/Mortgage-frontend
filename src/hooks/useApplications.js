// src/hooks/useApplications.js
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getAllApplications,
  getApplicationsByUser,
  getApplicationsByPMI,
  getApplicationById,
  createApplication,
  updateApplicationStatus,
  submitApplication,
  deleteApplication,
  calculateDashboardStats,
  filterApplicationsByStatus,
  sortApplications,
  ApplicationStatus,
} from "../services/application-service";

/**
 * Custom hook for managing application data
 * Provides state management, CRUD operations, and real-time updates
 */
export const useApplications = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    initialSort = { field: "updatedAt", order: "desc" },
    enableFiltering = true,
  } = options;

  // Auth context
  const { user, isAdmin, isClient } = useAuth();

  // State management
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Filter and sort state
  const [filters, setFilters] = useState({
    status: null,
    search: "",
    dateRange: null,
  });
  const [sortConfig, setSortConfig] = useState(initialSort);

  // Computed stats
  const stats = useMemo(() => {
    return calculateDashboardStats(filteredApplications);
  }, [filteredApplications]);

  // Fetch applications based on user role
  const fetchApplications = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        let fetchedApplications = [];

        if (isAdmin()) {
          fetchedApplications = await getAllApplications();
        } else if (isClient() && user?.id) {
          fetchedApplications = await getApplicationsByUser(user.id);
        } else if (user?.pmiCompanyId) {
          fetchedApplications = await getApplicationsByPMI(user.pmiCompanyId);
        }

        // Sort applications
        const sortedApplications = sortApplications(
          fetchedApplications,
          sortConfig.field,
          sortConfig.order
        );

        setApplications(sortedApplications);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Error fetching applications:", err);
        setError(err.message || "Failed to load applications");

        // Don't clear existing applications on refresh error
        if (!showRefreshIndicator) {
          setApplications([]);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user, isAdmin, isClient, sortConfig]
  );

  // Apply filters and search
  useEffect(() => {
    let filtered = [...applications];

    // Status filter
    if (filters.status) {
      filtered = filterApplicationsByStatus(filtered, filters.status);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.firstName?.toLowerCase().includes(searchLower) ||
          app.lastName?.toLowerCase().includes(searchLower) ||
          app.applicationNumber?.toLowerCase().includes(searchLower) ||
          app.rsaPin?.toLowerCase().includes(searchLower) ||
          app.pmiCompanyName?.toLowerCase().includes(searchLower)
      );
    }

    // Date range filter
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter((app) => {
        const appDate = new Date(app.createdAt);
        return appDate >= start && appDate <= end;
      });
    }

    setFilteredApplications(filtered);
  }, [applications, filters]);

  // Auto-refresh setup
  useEffect(() => {
    fetchApplications();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchApplications(true); // Show refresh indicator
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [fetchApplications, autoRefresh, refreshInterval]);

  // CRUD Operations
  const createNewApplication = useCallback(
    async (applicationData) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      setIsLoading(true);
      try {
        const newApplication = await createApplication(
          user.id,
          applicationData
        );

        // Add to local state immediately
        setApplications((prev) => [newApplication, ...prev]);

        return newApplication;
      } catch (err) {
        console.error("Error creating application:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const updateStatus = useCallback(
    async (applicationId, statusData) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      try {
        const updatedApplication = await updateApplicationStatus(
          applicationId,
          user.id,
          statusData
        );

        // Update local state
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? updatedApplication : app
          )
        );

        return updatedApplication;
      } catch (err) {
        console.error("Error updating application status:", err);
        throw err;
      }
    },
    [user]
  );

  const submitApp = useCallback(async (applicationId) => {
    try {
      await submitApplication(applicationId);

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? {
                ...app,
                status: ApplicationStatus.SUBMITTED,
                submittedAt: new Date().toISOString(),
              }
            : app
        )
      );

      return true;
    } catch (err) {
      console.error("Error submitting application:", err);
      throw err;
    }
  }, []);

  const deleteApp = useCallback(async (applicationId) => {
    try {
      await deleteApplication(applicationId);

      // Remove from local state
      setApplications((prev) => prev.filter((app) => app.id !== applicationId));

      return true;
    } catch (err) {
      console.error("Error deleting application:", err);
      throw err;
    }
  }, []);

  const getApplication = useCallback(async (applicationId) => {
    try {
      return await getApplicationById(applicationId);
    } catch (err) {
      console.error("Error fetching application:", err);
      throw err;
    }
  }, []);

  // Filter management
  const setStatusFilter = useCallback((status) => {
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  const setSearchFilter = useCallback((search) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const setDateRangeFilter = useCallback((dateRange) => {
    setFilters((prev) => ({ ...prev, dateRange }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      status: null,
      search: "",
      dateRange: null,
    });
  }, []);

  // Sort management
  const setSorting = useCallback((field, order = "desc") => {
    setSortConfig({ field, order });
  }, []);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchApplications(true);
  }, [fetchApplications]);

  // Get application by ID from cache
  const getApplicationFromCache = useCallback(
    (applicationId) => {
      return applications.find((app) => app.id === applicationId);
    },
    [applications]
  );

  // Get applications by status from cache
  const getApplicationsByStatus = useCallback(
    (status) => {
      return filterApplicationsByStatus(applications, status);
    },
    [applications]
  );

  return {
    // Data
    applications: filteredApplications,
    allApplications: applications,
    stats,

    // State
    isLoading,
    isRefreshing,
    error,
    lastUpdated,

    // Filters
    filters,
    setStatusFilter,
    setSearchFilter,
    setDateRangeFilter,
    clearFilters,

    // Sorting
    sortConfig,
    setSorting,

    // CRUD operations
    createApplication: createNewApplication,
    updateApplicationStatus: updateStatus,
    submitApplication: submitApp,
    deleteApplication: deleteApp,
    getApplication,

    // Utility functions
    refresh,
    getApplicationFromCache,
    getApplicationsByStatus,

    // Helpers
    hasApplications: applications.length > 0,
    isEmpty: applications.length === 0 && !isLoading,
    hasError: !!error,
    canCreateApplication: isClient() || isAdmin(),
    canUpdateStatus: isAdmin(),
    canDeleteApplication: (applicationId) => {
      const app = getApplicationFromCache(applicationId);
      return (
        app?.status === ApplicationStatus.DRAFT &&
        (isAdmin() || app.userId === user?.id)
      );
    },
  };
};

/**
 * Hook for managing a single application
 * Useful for application detail views
 */
export const useApplication = (applicationId) => {
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user, isAdmin } = useAuth();

  const fetchApplication = useCallback(async () => {
    if (!applicationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const app = await getApplicationById(applicationId);
      setApplication(app);
    } catch (err) {
      console.error("Error fetching application:", err);
      setError(err.message || "Failed to load application");
      setApplication(null);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const updateStatus = useCallback(
    async (statusData) => {
      if (!application || !user?.id) {
        throw new Error("Cannot update status");
      }

      try {
        const updatedApp = await updateApplicationStatus(
          application.id,
          user.id,
          statusData
        );
        setApplication(updatedApp);
        return updatedApp;
      } catch (err) {
        console.error("Error updating application:", err);
        throw err;
      }
    },
    [application, user]
  );

  const submitApp = useCallback(async () => {
    if (!application) {
      throw new Error("No application to submit");
    }

    try {
      await submitApplication(application.id);
      setApplication((prev) => ({
        ...prev,
        status: ApplicationStatus.SUBMITTED,
        submittedAt: new Date().toISOString(),
      }));
      return true;
    } catch (err) {
      console.error("Error submitting application:", err);
      throw err;
    }
  }, [application]);

  return {
    application,
    isLoading,
    error,
    refresh: fetchApplication,
    updateStatus,
    submitApplication: submitApp,
    canEdit:
      application?.status === ApplicationStatus.DRAFT &&
      (isAdmin() || application?.userId === user?.id),
    canSubmit: application?.status === ApplicationStatus.DRAFT,
    canUpdateStatus: isAdmin(),
  };
};

/**
 * Hook for application statistics
 * Can be used independently for dashboard widgets
 */
export const useApplicationStats = (applications = []) => {
  const stats = useMemo(() => {
    return calculateDashboardStats(applications);
  }, [applications]);

  const percentages = useMemo(() => {
    const total = stats.total || 0;
    if (total === 0) return {};

    return {
      approved: Math.round(((stats.approved || 0) / total) * 100),
      pending: Math.round(
        (((stats.submitted || 0) + (stats.under_review || 0)) / total) * 100
      ),
      returned: Math.round(((stats.returned || 0) / total) * 100),
      draft: Math.round(((stats.draft || 0) / total) * 100),
    };
  }, [stats]);

  const trends = useMemo(() => {
    // This would typically compare with previous period data
    // For now, we'll return placeholder trends
    return {
      totalChange: 0,
      approvedChange: 0,
      pendingChange: 0,
      returnedChange: 0,
    };
  }, []);

  return {
    stats,
    percentages,
    trends,
    hasData: stats.total > 0,
  };
};

/**
 * Hook for real-time application updates
 * This can be extended with WebSocket connections for live updates
 */
export const useRealTimeApplications = (options = {}) => {
  const { enableRealTime = false } = options;
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // This would typically connect to a WebSocket or Server-Sent Events
  // For now, we'll just provide the structure
  useEffect(() => {
    if (!enableRealTime) return;

    // TODO: Implement WebSocket connection
    // const ws = new WebSocket('ws://localhost:5062/applications');
    //
    // ws.onmessage = (event) => {
    //   const update = JSON.parse(event.data);
    //   handleApplicationUpdate(update);
    //   setLastUpdate(new Date());
    // };
    //
    // return () => ws.close();
  }, [enableRealTime]);

  return {
    lastUpdate,
    isConnected: false, // Would be true when WebSocket is connected
  };
};

// Export commonly used application statuses for easy access
export { ApplicationStatus } from "../services/application-service";
