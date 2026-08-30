// User roles in the system
export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN", // PFA Super Admin
  ADMIN: "ADMIN", // PFA Admin
  LEAD_REVIEWER: "LEAD_REVIEWER", // Lead Reviewer
  CLIENT: "CLIENT", // PMI Company
  SERVICE_MANAGER: "SERVICE_MANAGER", // Service Manager
};

// Default user structure (for reference and validation)
export const defaultUser = {
  id: "",
  email: "",
  role: "",
  firstName: "",
  lastName: "",
  isFirstLogin: false,
  pmiCompanyId: null, // Only for CLIENT role
  pmiCompanyName: null, // Only for CLIENT role
};

// Default auth context structure
export const defaultAuthContext = {
  user: null,
  token: null,
  isLoading: false,
  login: async () => {},
  logout: () => {},
  changePassword: async () => {},
  updateUser: () => {},
};

// Helper function to create a user object
export const createUser = (userData) => ({
  ...defaultUser,
  ...userData,
});

// Helper function to validate user role
export const isValidRole = (role) => {
  return Object.values(UserRole).includes(role);
};

// Helper function to check if user is admin
export const isAdmin = (user) => {
  return (
    user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN)
  );
};

// Helper function to check if user is lead reviewer
export const isLeadReviewer = (user) => {
  return user && user.role === UserRole.LEAD_REVIEWER;
};

// Helper function to check if user is client (PMI)
export const isClient = (user) => {
  return user && user.role === UserRole.CLIENT;
};

// Helper to check if user is service manager
export const isServiceManager = (user) => {
  return user && user.role === UserRole.SERVICE_MANAGER;
};

// Helper to check if user is super admin
export const isSuperAdmin = (user) => {
  return user && user.role === UserRole.SUPER_ADMIN;
};
