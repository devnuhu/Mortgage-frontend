import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  UserPlus,
  Search,
  Shield,
  Mail,
  User,
  CheckCircle,
  XCircle,
  RefreshCw,
  Lock,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Users,
  Crown,
  Building2,
  AlertCircle,
  Calendar,
  Filter,
} from "lucide-react";

// Import your API service functions
import {
  getAllUsers,
  createUser,
  deleteUser,
  getAllPMICompanies,
  validateUserData,
  generateTemporaryPassword,
  formatUserForDisplay,
  formatPMIForDisplay,
  getRoleDisplayInfo,
  calculateUserStats,
  filterUsers,
  formatDate,
} from "../../services/user-management-api";

const ManagerUsers = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [pmiCompanies, setPmiCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "",
    pmiCompanyId: "",
    temporaryPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const inputRefsTemp = useRef(null);

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const [usersResponse, pmiResponse] = await Promise.all([
        getAllUsers(),
        getAllPMICompanies(),
      ]);

      setUsers(usersResponse.map(formatUserForDisplay).filter(Boolean));
      setPmiCompanies(pmiResponse.map(formatPMIForDisplay).filter(Boolean));
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load users and PMI companies. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let filtered = filterUsers(users, searchTerm);

    if (selectedRole) {
      filtered = filtered.filter((user) => user.role === selectedRole);
    }

    return filtered;
  }, [users, searchTerm, selectedRole]);

  // Calculate statistics
  const userStats = useMemo(() => calculateUserStats(users), [users]);

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generateTemporaryPassword();
    setFormData((prev) => ({
      ...prev,
      temporaryPassword: newPassword,
    }));
    setShowPassword(true);
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(formData.temporaryPassword);
      setSuccess("Password copied to clipboard!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to copy password:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setFormErrors({});

    try {
      // Validate form data
      const validation = validateUserData(formData);
      if (!validation.isValid) {
        setFormErrors(validation.errors);
        return;
      }

      // Create user
      const newUser = await createUser(formData);
      const formattedUser = formatUserForDisplay(newUser);

      if (formattedUser) {
        setUsers((prev) => [...prev, formattedUser]);
        setSuccess(`User ${formattedUser.fullName} created successfully!`);

        // Reset form
        setFormData({
          email: "",
          firstName: "",
          lastName: "",
          role: "",
          pmiCompanyId: "",
          temporaryPassword: "",
        });
        setShowCreateForm(false);
        setShowPassword(false);

        setTimeout(() => setSuccess(""), 5000);
      }
    } catch (err) {
      console.error("Failed to create user:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create user. Please try again."
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${userName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      setSuccess(`User ${userName} deleted successfully!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to delete user:", err);
      setError("Failed to delete user. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      role: "",
      pmiCompanyId: "",
      temporaryPassword: "",
    });
    setFormErrors({});
    setShowCreateForm(false);
    setShowPassword(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading users and PMI companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-7 h-7 text-blue-600" />
                Manager Users
              </h1>
              <p className="text-gray-600 mt-1">
                Create and manage user accounts across all PMI companies
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Create User
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {userStats.total}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">
                    Active Users
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {userStats.active}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">
                    First Login
                  </p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {userStats.firstLogin}
                  </p>
                </div>
                <Lock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">
                    Super Admins
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {userStats.byRole.SUPER_ADMIN}
                  </p>
                </div>
                <Crown className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or PMI company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="CLIENT">Client</option>
              </select>
            </div>
            <button
              onClick={loadInitialData}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Users List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PMI Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      {searchTerm || selectedRole
                        ? "No users match your search criteria."
                        : "No users found."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const roleInfo = getRoleDisplayInfo(user.role);
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.fullName}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleInfo.color}`}
                          >
                            {roleInfo.icon} {roleInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                            {user.pmiCompanyName || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {user.isActive ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </span>
                            {user.isFirstLogin && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                <Lock className="w-3 h-3 mr-1" />
                                First Login
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(user.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() =>
                              handleDeleteUser(user.id, user.fullName)
                            }
                            className="text-red-600 hover:text-red-900 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Create New User
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.email ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="user@example.com"
                  />
                  {formErrors.email && (
                    <p className="text-red-600 text-sm mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Names */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.firstName
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                    />
                    {formErrors.firstName && (
                      <p className="text-red-600 text-sm mt-1">
                        {formErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.lastName
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                    />
                    {formErrors.lastName && (
                      <p className="text-red-600 text-sm mt-1">
                        {formErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.role ? "border-red-300" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select a role...</option>
                    <option value="CLIENT">👤 Client</option>
                    <option value="ADMIN">🛡️ Admin</option>
                    <option value="SUPER_ADMIN">👑 Super Admin</option>
                  </select>
                  {formErrors.role && (
                    <p className="text-red-600 text-sm mt-1">
                      {formErrors.role}
                    </p>
                  )}
                </div>

                {/* PMI Company - Only show for CLIENT role */}
                {formData.role === "CLIENT" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PMI Company *
                    </label>
                    <select
                      name="pmiCompanyId"
                      value={formData.pmiCompanyId}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.pmiCompanyId
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Select PMI Company...</option>
                      {pmiCompanies.map((pmi) => (
                        <option key={pmi.id} value={pmi.id}>
                          {pmi.pmiName}
                        </option>
                      ))}
                    </select>
                    {formErrors.pmiCompanyId && (
                      <p className="text-red-600 text-sm mt-1">
                        {formErrors.pmiCompanyId}
                      </p>
                    )}
                  </div>
                )}

                {/* Temporary Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temporary Password *
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                          <input
                            ref={(el) => (inputRefsTemp.current = el)}
                            type={showPassword ? "text" : "password"}
                            name="temporaryPassword"
                            value={formData.temporaryPassword}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                              formErrors.temporaryPassword
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                            placeholder="Enter or generate password"
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onMouseDown={(e) => e.preventDefault()}
                            onPointerDown={(e) => e.preventDefault()}
                            onTouchStart={(e) => e.preventDefault()}
                            onKeyDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={() => {
                              setShowPassword(!showPassword);
                              const inputEl = inputRefsTemp.current;
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
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                      title="Generate Password"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    {formData.temporaryPassword && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                        title="Copy Password"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {formErrors.temporaryPassword && (
                    <p className="text-red-600 text-sm mt-1">
                      {formErrors.temporaryPassword}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Share this password with the user. They will be prompted to
                    change it on first login.
                  </p>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={formLoading}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {formLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create User
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerUsers;
