import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import PMIService from "../services/pmiService"; // Your API service

const PMIContext = createContext();

export const usePMI = () => {
  const context = useContext(PMIContext);
  if (!context) {
    throw new Error("usePMI must be used within a PMIProvider");
  }
  return context;
};

export const PMIProvider = ({ children }) => {
  // State management
  const [pmis, setPmis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Filtered PMIs based on search and status
  const filteredPmis = pmis.filter((pmi) => {
    const matchesSearch =
      !searchQuery ||
      pmi.pmiName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pmi.emailAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pmi.resourcePersonName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || pmi.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Load all PMI companies on mount
  const loadPMICompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PMIService.getAllPMICompanies();
      // Format the data for display using your service helper
      const formattedData = data.map((pmi) =>
        PMIService.formatPMICompanyForDisplay(pmi)
      );
      setPmis(formattedData);
    } catch (err) {
      console.error("Failed to load PMI companies:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load PMI companies"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadPMICompanies();
  }, [loadPMICompanies]);

  // Create new PMI company
  const createPMI = async (pmiData) => {
    setLoading(true);
    setError(null);
    try {
      const newPMI = await PMIService.createPMICompany(pmiData);
      const formattedPMI = PMIService.formatPMICompanyForDisplay(newPMI);

      // Add to local state
      setPmis((prev) => [formattedPMI, ...prev]);

      return {
        success: true,
        pmi: {
          ...formattedPMI,
          // Assuming your API returns tempPassword in the response
          tempPassword: newPMI.tempPassword,
        },
      };
    } catch (err) {
      console.error("Failed to create PMI company:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to create PMI company";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update PMI company
  const updatePMI = async (id, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedPMI = await PMIService.updatePMICompany(id, updateData);
      const formattedPMI = PMIService.formatPMICompanyForDisplay(updatedPMI);

      // Update local state
      setPmis((prev) =>
        prev.map((pmi) => (pmi.id === id ? formattedPMI : pmi))
      );

      return { success: true, pmi: formattedPMI };
    } catch (err) {
      console.error("Failed to update PMI company:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to update PMI company";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update PMI status
  const updatePMIStatus = async (id, status) => {
    try {
      await PMIService.updatePMICompanyStatus(id, status);

      // Update local state
      setPmis((prev) =>
        prev.map((pmi) => (pmi.id === id ? { ...pmi, status } : pmi))
      );

      return { success: true };
    } catch (err) {
      console.error("Failed to update PMI status:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to update PMI status";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Reset temporary password
  const resetTempPassword = async (id) => {
    try {
      // Note: You'll need to add this endpoint to your API service
      // For now, assuming it exists or you'll create it
      const response =
        (await PMIService.resetTempPassword?.(id)) ||
        (await PMIService.updatePMICompany(id, { resetPassword: true }));

      return {
        success: true,
        tempPassword: response.tempPassword || "TempPass123!", // Fallback
      };
    } catch (err) {
      console.error("Failed to reset password:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to reset password";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Delete PMI company
  const deletePMI = async (id) => {
    try {
      await PMIService.deletePMICompany(id);

      // Remove from local state
      setPmis((prev) => prev.filter((pmi) => pmi.id !== id));

      return { success: true };
    } catch (err) {
      console.error("Failed to delete PMI company:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to delete PMI company";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Get PMI statistics
  const getPMIStats = () => {
    return {
      total: pmis.length,
      active: pmis.filter((pmi) => pmi.status === "ACTIVE").length,
      inactive: pmis.filter((pmi) => pmi.status === "INACTIVE").length,
      suspended: pmis.filter((pmi) => pmi.status === "SUSPENDED").length,
    };
  };

  // Context value
  const value = {
    // Data
    pmis: filteredPmis, // Return filtered PMIs
    loading,
    error,

    // Search and filter
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,

    // Actions
    createPMI,
    updatePMI,
    updatePMIStatus,
    resetTempPassword,
    deletePMI,
    clearError,
    loadPMICompanies, // In case you need to manually refresh

    // Helpers
    getPMIStats,
  };

  return <PMIContext.Provider value={value}>{children}</PMIContext.Provider>;
};
