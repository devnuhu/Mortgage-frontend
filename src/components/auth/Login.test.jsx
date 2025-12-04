import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import Login from "./Login";

// jsx

// Mock react-router-dom hooks used in the component
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: {} }),
  };
});

// Mock toast to avoid side effects
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

// Mock AuthContext and its useAuth hook
const useAuthMock = vi.fn();
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

// Import component after mocks are defined

describe("Login component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders login form with email, password and sign in button", () => {
    // Provide default useAuth return values for this render
    useAuthMock.mockReturnValue({
      login: vi.fn(),
      isLoading: false,
      user: null,
      requiresPasswordChange: false,
    });

    render(<Login />);

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  test("shows validation errors on empty submit", async () => {
    useAuthMock.mockReturnValue({
      login: vi.fn(),
      isLoading: false,
      user: null,
      requiresPasswordChange: false,
    });

    render(<Login />);

    const signInButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(signInButton);

    // validation runs synchronously
    expect(await screen.findByText(/Email is required/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/Password is required/i)
    ).toBeInTheDocument();
  });

  test("calls login with provided credentials", async () => {
    const loginMock = vi.fn().mockResolvedValue({});
    useAuthMock.mockReturnValue({
      login: loginMock,
      isLoading: false,
      user: null,
      requiresPasswordChange: false,
    });

    render(<Login />);

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const signInButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@mmgt.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledTimes(1);
      expect(loginMock).toHaveBeenCalledWith("test@mmgt.com", "password123");
    });
  });

  test("shows friendly error message when login fails with invalid credentials", async () => {
    const loginMock = vi
      .fn()
      .mockRejectedValue(new Error("Invalid credentials")); // simulate API error
    useAuthMock.mockReturnValue({
      login: loginMock,
      isLoading: false,
      user: null,
      requiresPasswordChange: false,
    });

    render(<Login />);

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const signInButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "bad@mmgt.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpass" } });
    fireEvent.click(signInButton);

    // Wait for the friendly error mapping to be set in component state
    const friendlyMessage =
      "Invalid email or password. Please check your credentials.";

    await waitFor(() => {
      expect(screen.getByText(friendlyMessage)).toBeInTheDocument();
    });
  });

  test("shows first-login flow when user requires password change", async () => {
    useAuthMock.mockReturnValue({
      login: vi.fn(),
      isLoading: false,
      user: { firstName: "Jane", id: "user-1" },
      requiresPasswordChange: true,
    });

    render(<Login />);

    // The component's useEffect should switch to first-login flow on mount
    expect(
      await screen.findByText(/First Login Detected/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Set Your New Password/i) ||
        screen.getByText(/Please create a secure password/i)
    ).toBeInTheDocument();
  });
});