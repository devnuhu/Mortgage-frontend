// Application Status Constants
export const ApplicationStatus = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  RETURNED: "returned",
  COMPLETED: "completed",
};

// Application Priority Constants
export const ApplicationPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

// Property Types
export const PropertyType = {
  RESIDENTIAL: "residential",
  COMMERCIAL: "commercial",
  INDUSTRIAL: "industrial",
  LAND: "land",
};

// Loan Types
export const LoanType = {
  PURCHASE: "purchase",
  REFINANCE: "refinance",
  CONSTRUCTION: "construction",
  EQUITY: "equity",
};

// Default Application Structure
export const defaultApplication = {
  id: "",
  applicationNumber: "",

  // Borrower Information
  borrower: {
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    nationalId: "",
    occupation: "",
    employer: "",
    monthlyIncome: 0,
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Nigeria",
    },
  },

  // Co-borrower Information (optional)
  coBorrower: {
    hasCoApplicant: false,
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    nationalId: "",
    occupation: "",
    employer: "",
    monthlyIncome: 0,
    relationship: "",
  },

  // Loan Details
  loan: {
    amount: 0,
    purpose: "",
    term: 0, // in years
    type: LoanType.PURCHASE,
    interestRate: 0,
    downPayment: 0,
    monthlyPayment: 0,
  },

  // Property Information
  property: {
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Nigeria",
    },
    type: PropertyType.RESIDENTIAL,
    value: 0,
    description: "",
    yearBuilt: "",
    squareFootage: 0,
    bedrooms: 0,
    bathrooms: 0,
  },

  // Application Meta
  status: ApplicationStatus.DRAFT,
  priority: ApplicationPriority.MEDIUM,
  submittedDate: null,
  lastUpdated: new Date().toISOString(),
  reviewedBy: null,
  reviewDate: null,
  completedDate: null,

  // PMI Information
  pmiCompanyId: "",
  pmiCompanyName: "",
  submittedBy: "",

  // Documents
  documents: [],

  // Comments and Notes
  comments: [],
  adminNotes: "",

  // Processing Information
  processingTime: 0, // in days
  estimatedCompletion: null,
};

// Mock Applications Data
export const mockApplications = [
  {
    id: "APP-2024-001",
    applicationNumber: "MRT-240801-001",
    borrower: {
      firstName: "John",
      lastName: "Smith",
      middleName: "Michael",
      email: "john.smith@email.com",
      phoneNumber: "+234-801-234-5678",
      dateOfBirth: "1985-03-15",
      nationalId: "12345678901",
      occupation: "Software Engineer",
      employer: "Tech Solutions Ltd",
      monthlyIncome: 850000,
      address: {
        street: "123 Victoria Island",
        city: "Lagos",
        state: "Lagos",
        postalCode: "101241",
        country: "Nigeria",
      },
    },
    coBorrower: {
      hasCoApplicant: true,
      firstName: "Jane",
      lastName: "Smith",
      middleName: "Ann",
      email: "jane.smith@email.com",
      phoneNumber: "+234-802-345-6789",
      dateOfBirth: "1987-07-22",
      nationalId: "10987654321",
      occupation: "Marketing Manager",
      employer: "Brand Masters Agency",
      monthlyIncome: 650000,
      relationship: "Spouse",
    },
    loan: {
      amount: 45000000,
      purpose: "Home Purchase",
      term: 20,
      type: LoanType.PURCHASE,
      interestRate: 12.5,
      downPayment: 9000000,
      monthlyPayment: 495000,
    },
    property: {
      address: {
        street: "456 Lekki Phase 1",
        city: "Lagos",
        state: "Lagos",
        postalCode: "105102",
        country: "Nigeria",
      },
      type: PropertyType.RESIDENTIAL,
      value: 54000000,
      description: "4-bedroom duplex with BQ",
      yearBuilt: "2020",
      squareFootage: 2800,
      bedrooms: 4,
      bathrooms: 5,
    },
    status: ApplicationStatus.UNDER_REVIEW,
    priority: ApplicationPriority.HIGH,
    submittedDate: "2024-08-01T10:30:00Z",
    lastUpdated: "2024-08-05T14:20:00Z",
    reviewedBy: "Admin User",
    reviewDate: "2024-08-02T09:15:00Z",
    pmiCompanyId: "PMI-001",
    pmiCompanyName: "Premium Mortgage Insurance Ltd",
    submittedBy: "Sarah Johnson",
    documents: [
      { id: 1, name: "ID Card", type: "identity", status: "approved" },
      { id: 2, name: "Salary Certificate", type: "income", status: "approved" },
      { id: 3, name: "Bank Statement", type: "financial", status: "pending" },
    ],
    comments: [
      {
        id: 1,
        author: "Admin User",
        message:
          "Income verification looks good. Waiting for updated bank statement.",
        date: "2024-08-02T09:15:00Z",
        type: "admin",
      },
      {
        id: 2,
        author: "Sarah Johnson",
        message: "Updated bank statement uploaded.",
        date: "2024-08-03T11:30:00Z",
        type: "pmi",
      },
    ],
    processingTime: 4,
    estimatedCompletion: "2024-08-10T00:00:00Z",
  },
  {
    id: "APP-2024-002",
    applicationNumber: "MRT-240728-002",
    borrower: {
      firstName: "Michael",
      lastName: "Adebayo",
      middleName: "Olumide",
      email: "michael.adebayo@email.com",
      phoneNumber: "+234-803-456-7890",
      dateOfBirth: "1982-11-08",
      nationalId: "23456789012",
      occupation: "Doctor",
      employer: "Lagos University Teaching Hospital",
      monthlyIncome: 1200000,
      address: {
        street: "789 Ikeja GRA",
        city: "Lagos",
        state: "Lagos",
        postalCode: "100271",
        country: "Nigeria",
      },
    },
    coBorrower: {
      hasCoApplicant: false,
    },
    loan: {
      amount: 32000000,
      purpose: "Home Refinancing",
      term: 15,
      type: LoanType.REFINANCE,
      interestRate: 11.8,
      downPayment: 0,
      monthlyPayment: 385000,
    },
    property: {
      address: {
        street: "321 Magodo Phase 2",
        city: "Lagos",
        state: "Lagos",
        postalCode: "100218",
        country: "Nigeria",
      },
      type: PropertyType.RESIDENTIAL,
      value: 38000000,
      description: "3-bedroom bungalow",
      yearBuilt: "2018",
      squareFootage: 2200,
      bedrooms: 3,
      bathrooms: 3,
    },
    status: ApplicationStatus.APPROVED,
    priority: ApplicationPriority.MEDIUM,
    submittedDate: "2024-07-28T14:45:00Z",
    lastUpdated: "2024-08-03T16:30:00Z",
    reviewedBy: "Admin User",
    reviewDate: "2024-07-30T10:20:00Z",
    completedDate: "2024-08-03T16:30:00Z",
    pmiCompanyId: "PMI-002",
    pmiCompanyName: "Secure Home Insurance Co",
    submittedBy: "David Wilson",
    documents: [
      { id: 1, name: "Medical License", type: "identity", status: "approved" },
      {
        id: 2,
        name: "Employment Letter",
        type: "employment",
        status: "approved",
      },
      {
        id: 3,
        name: "Property Valuation",
        type: "property",
        status: "approved",
      },
    ],
    comments: [
      {
        id: 1,
        author: "Admin User",
        message: "Application approved. All documents verified.",
        date: "2024-08-03T16:30:00Z",
        type: "admin",
      },
    ],
    processingTime: 6,
    estimatedCompletion: "2024-08-03T16:30:00Z",
  },
  {
    id: "APP-2024-003",
    applicationNumber: "MRT-240725-003",
    borrower: {
      firstName: "Fatima",
      lastName: "Usman",
      middleName: "Aisha",
      email: "fatima.usman@email.com",
      phoneNumber: "+234-805-678-9012",
      dateOfBirth: "1990-05-12",
      nationalId: "34567890123",
      occupation: "Business Owner",
      employer: "Usman Trading Company",
      monthlyIncome: 750000,
      address: {
        street: "456 Wuse District",
        city: "Abuja",
        state: "FCT",
        postalCode: "900001",
        country: "Nigeria",
      },
    },
    coBorrower: {
      hasCoApplicant: false,
    },
    loan: {
      amount: 27500000,
      purpose: "Property Development",
      term: 25,
      type: LoanType.CONSTRUCTION,
      interestRate: 13.2,
      downPayment: 8000000,
      monthlyPayment: 315000,
    },
    property: {
      address: {
        street: "654 Gwarinpa Estate",
        city: "Abuja",
        state: "FCT",
        postalCode: "900108",
        country: "Nigeria",
      },
      type: PropertyType.RESIDENTIAL,
      value: 35000000,
      description: "Land for residential development",
      yearBuilt: "New Construction",
      squareFootage: 0,
      bedrooms: 0,
      bathrooms: 0,
    },
    status: ApplicationStatus.RETURNED,
    priority: ApplicationPriority.MEDIUM,
    submittedDate: "2024-07-25T11:20:00Z",
    lastUpdated: "2024-08-02T13:45:00Z",
    reviewedBy: "Admin User",
    reviewDate: "2024-07-28T15:10:00Z",
    pmiCompanyId: "PMI-003",
    pmiCompanyName: "Capital Mortgage Protection",
    submittedBy: "Emma Davis",
    documents: [
      {
        id: 1,
        name: "Business Registration",
        type: "business",
        status: "approved",
      },
      { id: 2, name: "Tax Returns", type: "financial", status: "rejected" },
      { id: 3, name: "Land Survey", type: "property", status: "pending" },
    ],
    comments: [
      {
        id: 1,
        author: "Admin User",
        message:
          "Tax returns need to be more recent. Please provide last 2 years.",
        date: "2024-08-02T13:45:00Z",
        type: "admin",
      },
    ],
    adminNotes:
      "Requires updated tax documentation and land survey completion.",
    processingTime: 8,
    estimatedCompletion: null,
  },
];

// Utility Functions
export const getStatusColor = (status) => {
  switch (status) {
    case ApplicationStatus.DRAFT:
      return "bg-gray-100 text-gray-800";
    case ApplicationStatus.SUBMITTED:
      return "bg-blue-100 text-blue-800";
    case ApplicationStatus.UNDER_REVIEW:
      return "bg-yellow-100 text-yellow-800";
    case ApplicationStatus.APPROVED:
      return "bg-green-100 text-green-800";
    case ApplicationStatus.REJECTED:
      return "bg-red-100 text-red-800";
    case ApplicationStatus.RETURNED:
      return "bg-orange-100 text-orange-800";
    case ApplicationStatus.COMPLETED:
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case ApplicationPriority.LOW:
      return "bg-gray-100 text-gray-800";
    case ApplicationPriority.MEDIUM:
      return "bg-blue-100 text-blue-800";
    case ApplicationPriority.HIGH:
      return "bg-yellow-100 text-yellow-800";
    case ApplicationPriority.URGENT:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const calculateDaysInProcess = (submittedDate) => {
  if (!submittedDate) return 0;
  const submitted = new Date(submittedDate);
  const now = new Date();
  const diffTime = Math.abs(now - submitted);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getStatusIcon = (status) => {
  switch (status) {
    case ApplicationStatus.DRAFT:
      return (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      );
    case ApplicationStatus.SUBMITTED:
      return (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      );
    case ApplicationStatus.UNDER_REVIEW:
      return (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case ApplicationStatus.APPROVED:
      return (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case ApplicationStatus.REJECTED:
      return (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case ApplicationStatus.RETURNED:
      return (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3"
          />
        </svg>
      );
    case ApplicationStatus.COMPLETED:
      return (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      );
    default:
      return null;
  }
};

// Validation Functions
export const validateBorrowerInfo = (borrower) => {
  const errors = {};

  if (!borrower.firstName?.trim()) errors.firstName = "First name is required";
  if (!borrower.lastName?.trim()) errors.lastName = "Last name is required";
  if (!borrower.email?.trim()) errors.email = "Email is required";
  else if (!/\S+@\S+\.\S+/.test(borrower.email))
    errors.email = "Invalid email format";
  if (!borrower.nationalId?.trim())
    errors.nationalId = "National ID is required";
  if (!borrower.occupation?.trim())
    errors.occupation = "Occupation is required";
  if (!borrower.monthlyIncome || borrower.monthlyIncome <= 0)
    errors.monthlyIncome = "Valid monthly income is required";

  return errors;
};

export const validateLoanInfo = (loan) => {
  const errors = {};

  if (!loan.amount || loan.amount <= 0)
    errors.amount = "Loan amount is required";
  if (!loan.purpose?.trim()) errors.purpose = "Loan purpose is required";
  if (!loan.term || loan.term <= 0) errors.term = "Loan term is required";
  if (!loan.downPayment && loan.downPayment !== 0)
    errors.downPayment = "Down payment is required";

  return errors;
};

export const validatePropertyInfo = (property) => {
  const errors = {};

  if (!property.address?.street?.trim())
    errors.street = "Property address is required";
  if (!property.address?.city?.trim()) errors.city = "City is required";
  if (!property.address?.state?.trim()) errors.state = "State is required";
  if (!property.value || property.value <= 0)
    errors.value = "Property value is required";
  if (!property.description?.trim())
    errors.description = "Property description is required";

  return errors;
};

// Search and Filter Functions
export const searchApplications = (applications, searchTerm) => {
  if (!searchTerm) return applications;

  const term = searchTerm.toLowerCase();
  return applications.filter(
    (app) =>
      app.applicationNumber.toLowerCase().includes(term) ||
      `${app.borrower.firstName} ${app.borrower.lastName}`
        .toLowerCase()
        .includes(term) ||
      app.property.address.street.toLowerCase().includes(term) ||
      app.property.address.city.toLowerCase().includes(term) ||
      app.loan.purpose.toLowerCase().includes(term)
  );
};

export const filterApplicationsByStatus = (applications, status) => {
  if (!status || status === "all") return applications;
  return applications.filter((app) => app.status === status);
};

export const sortApplications = (applications, sortBy, sortOrder = "desc") => {
  return [...applications].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case "date":
        aValue = new Date(a.submittedDate || 0);
        bValue = new Date(b.submittedDate || 0);
        break;
      case "amount":
        aValue = a.loan.amount;
        bValue = b.loan.amount;
        break;
      case "borrower":
        aValue = `${a.borrower.firstName} ${a.borrower.lastName}`.toLowerCase();
        bValue = `${b.borrower.firstName} ${b.borrower.lastName}`.toLowerCase();
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        aValue = a.lastUpdated;
        bValue = b.lastUpdated;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};
