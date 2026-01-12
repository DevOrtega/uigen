import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "../use-auth";

// Mock Next.js navigation
const mockPush = vi.fn();
const mockRouter = vi.fn(() => ({ push: mockPush }));

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter(),
}));

// Mock auth actions
const mockSignInAction = vi.fn();
const mockSignUpAction = vi.fn();

vi.mock("@/actions", () => ({
  signIn: (...args: any[]) => mockSignInAction(...args),
  signUp: (...args: any[]) => mockSignUpAction(...args),
}));

// Mock anon work tracker
const mockGetAnonWorkData = vi.fn();
const mockClearAnonWork = vi.fn();

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: () => mockGetAnonWorkData(),
  clearAnonWork: () => mockClearAnonWork(),
}));

// Mock project actions
const mockGetProjects = vi.fn();
const mockCreateProject = vi.fn();

vi.mock("@/actions/get-projects", () => ({
  getProjects: () => mockGetProjects(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: (...args: any[]) => mockCreateProject(...args),
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("initial state", () => {
    test("returns initial state with isLoading false", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.signIn).toBeTypeOf("function");
      expect(result.current.signUp).toBeTypeOf("function");
    });
  });

  describe("signIn", () => {
    test("sets isLoading to true during sign in", async () => {
      mockSignInAction.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ success: false }), 100);
        });
      });

      const { result } = renderHook(() => useAuth());

      const signInPromise = result.current.signIn("test@example.com", "password123");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await signInPromise;
    });

    test("sets isLoading to false after sign in completes", async () => {
      mockSignInAction.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      expect(result.current.isLoading).toBe(false);
    });

    test("calls signInAction with correct credentials", async () => {
      mockSignInAction.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      expect(mockSignInAction).toHaveBeenCalledWith("test@example.com", "password123");
      expect(mockSignInAction).toHaveBeenCalledOnce();
    });

    test("returns error result when sign in fails", async () => {
      const errorResult = { success: false, error: "Invalid credentials" };
      mockSignInAction.mockResolvedValue(errorResult);

      const { result } = renderHook(() => useAuth());

      const response = await result.current.signIn("test@example.com", "wrongpassword");

      expect(response).toEqual(errorResult);
    });

    test("does not call handlePostSignIn when sign in fails", async () => {
      mockSignInAction.mockResolvedValue({ success: false });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "wrongpassword");

      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockGetProjects).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    test("handles post sign-in flow when sign in succeeds", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "new-project-123" });

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      expect(mockGetAnonWorkData).toHaveBeenCalled();
      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockCreateProject).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/new-project-123");
    });

    test("sets isLoading to false even when sign in throws error", async () => {
      mockSignInAction.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await expect(
        result.current.signIn("test@example.com", "password123")
      ).rejects.toThrow("Network error");

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    test("sets isLoading to true during sign up", async () => {
      mockSignUpAction.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ success: false }), 100);
        });
      });

      const { result } = renderHook(() => useAuth());

      const signUpPromise = result.current.signUp("test@example.com", "password123");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await signUpPromise;
    });

    test("sets isLoading to false after sign up completes", async () => {
      mockSignUpAction.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await result.current.signUp("test@example.com", "password123");

      expect(result.current.isLoading).toBe(false);
    });

    test("calls signUpAction with correct credentials", async () => {
      mockSignUpAction.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await result.current.signUp("new@example.com", "newpassword123");

      expect(mockSignUpAction).toHaveBeenCalledWith("new@example.com", "newpassword123");
      expect(mockSignUpAction).toHaveBeenCalledOnce();
    });

    test("returns error result when sign up fails", async () => {
      const errorResult = { success: false, error: "Email already registered" };
      mockSignUpAction.mockResolvedValue(errorResult);

      const { result } = renderHook(() => useAuth());

      const response = await result.current.signUp("test@example.com", "password123");

      expect(response).toEqual(errorResult);
    });

    test("does not call handlePostSignIn when sign up fails", async () => {
      mockSignUpAction.mockResolvedValue({ success: false });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);

      const { result } = renderHook(() => useAuth());

      await result.current.signUp("test@example.com", "password123");

      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockGetProjects).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    test("handles post sign-in flow when sign up succeeds", async () => {
      mockSignUpAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "new-project-456" });

      const { result } = renderHook(() => useAuth());

      await result.current.signUp("new@example.com", "password123");

      expect(mockGetAnonWorkData).toHaveBeenCalled();
      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockCreateProject).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/new-project-456");
    });

    test("sets isLoading to false even when sign up throws error", async () => {
      mockSignUpAction.mockRejectedValue(new Error("Database error"));

      const { result } = renderHook(() => useAuth());

      await expect(
        result.current.signUp("test@example.com", "password123")
      ).rejects.toThrow("Database error");

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("handlePostSignIn - anonymous work flow", () => {
    test("creates project with anonymous work when available", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "Create a button" }],
        fileSystemData: { "/": {}, "/App.jsx": { content: "code" } },
      };

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ id: "anon-project-789" });

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });
    });

    test("clears anonymous work after creating project", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "Test" }],
        fileSystemData: { "/": {} },
      };

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ id: "project-123" });

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      expect(mockClearAnonWork).toHaveBeenCalled();
    });

    test("redirects to anonymous work project", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "Test" }],
        fileSystemData: { "/": {} },
      };

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ id: "anon-project-999" });

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      expect(mockPush).toHaveBeenCalledWith("/anon-project-999");
    });

    test("does not check for existing projects when anonymous work exists", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "Test" }],
        fileSystemData: { "/": {} },
      };

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ id: "project-123" });

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      expect(mockGetProjects).not.toHaveBeenCalled();
    });

    test("ignores anonymous work with empty messages array", async () => {
      const anonWork = {
        messages: [],
        fileSystemData: { "/": {} },
      };

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockGetProjects.mockResolvedValue([{ id: "existing-project" }]);

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/existing-project");
    });

    test("creates project name with timestamp when anonymous work exists", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "Test" }],
        fileSystemData: { "/": {} },
      };

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ id: "project-123" });

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      const createProjectCall = mockCreateProject.mock.calls[0][0];
      expect(createProjectCall.name).toMatch(/^Design from \d{1,2}:\d{2}:\d{2}/);
    });
  });

  describe("handlePostSignIn - existing projects flow", () => {
    test("redirects to most recent project when projects exist", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([
        { id: "project-1", updatedAt: "2025-01-02" },
        { id: "project-2", updatedAt: "2025-01-01" },
      ]);

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      expect(mockPush).toHaveBeenCalledWith("/project-1");
      expect(mockCreateProject).not.toHaveBeenCalled();
    });

    test("does not create new project when existing projects found", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([{ id: "existing-project" }]);

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      expect(mockCreateProject).not.toHaveBeenCalled();
    });
  });

  describe("handlePostSignIn - new project flow", () => {
    test("creates new project when no anonymous work and no existing projects", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "new-project-555" });

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
    });

    test("creates project with random number in name", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "project-123" });

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      const createProjectCall = mockCreateProject.mock.calls[0][0];
      expect(createProjectCall.name).toMatch(/^New Design #\d+$/);

      const numberMatch = createProjectCall.name.match(/#(\d+)$/);
      expect(numberMatch).toBeTruthy();
      const randomNumber = parseInt(numberMatch![1]);
      expect(randomNumber).toBeGreaterThanOrEqual(0);
      expect(randomNumber).toBeLessThan(100000);
    });

    test("redirects to newly created project", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "brand-new-project" });

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      expect(mockPush).toHaveBeenCalledWith("/brand-new-project");
    });

    test("creates project with empty messages and data", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "project-123" });

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      const createProjectCall = mockCreateProject.mock.calls[0][0];
      expect(createProjectCall.messages).toEqual([]);
      expect(createProjectCall.data).toEqual({});
    });
  });

  describe("edge cases", () => {
    test("handles null from getAnonWorkData", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "project-123" });

      const { result } = renderHook(() => useAuth());

      await expect(
        result.current.signIn("test@example.com", "password123")
      ).resolves.toEqual({ success: true });
    });

    test("handles empty projects array from getProjects", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "project-123" });

      const { result } = renderHook(() => useAuth());

      await result.current.signIn("test@example.com", "password123");

      expect(mockCreateProject).toHaveBeenCalled();
    });

    test("handles concurrent sign in calls", async () => {
      mockSignInAction.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      const [result1, result2] = await Promise.all([
        result.current.signIn("user1@example.com", "password1"),
        result.current.signIn("user2@example.com", "password2"),
      ]);

      expect(mockSignInAction).toHaveBeenCalledTimes(2);
      expect(result1).toEqual({ success: false });
      expect(result2).toEqual({ success: false });
    });

    test("handles concurrent sign up calls", async () => {
      mockSignUpAction.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      const [result1, result2] = await Promise.all([
        result.current.signUp("user1@example.com", "password1"),
        result.current.signUp("user2@example.com", "password2"),
      ]);

      expect(mockSignUpAction).toHaveBeenCalledTimes(2);
      expect(result1).toEqual({ success: false });
      expect(result2).toEqual({ success: false });
    });

    test("maintains isLoading state across multiple operations", async () => {
      mockSignInAction.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ success: false }), 50);
        });
      });

      const { result } = renderHook(() => useAuth());

      const promise1 = result.current.signIn("test1@example.com", "password1");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await promise1;

      expect(result.current.isLoading).toBe(false);

      const promise2 = result.current.signIn("test2@example.com", "password2");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await promise2;

      expect(result.current.isLoading).toBe(false);
    });

    test("handles error during project creation after successful auth", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockRejectedValue(new Error("Database error"));

      const { result } = renderHook(() => useAuth());

      await expect(
        result.current.signIn("test@example.com", "password123")
      ).rejects.toThrow("Database error");

      expect(result.current.isLoading).toBe(false);
    });

    test("handles error during getProjects after successful auth", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockRejectedValue(new Error("Database error"));

      const { result } = renderHook(() => useAuth());

      await expect(
        result.current.signIn("test@example.com", "password123")
      ).rejects.toThrow("Database error");

      expect(result.current.isLoading).toBe(false);
    });

    test("works correctly for signUp with all post-signin flows", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "Button" }],
        fileSystemData: { "/": {} },
      };

      mockSignUpAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ id: "signup-project" });

      const { result } = renderHook(() => useAuth());

      await result.current.signUp("new@example.com", "password123");

      expect(mockCreateProject).toHaveBeenCalled();
      expect(mockClearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/signup-project");
    });
  });

  describe("return value structure", () => {
    test("returns object with signIn, signUp, and isLoading", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toHaveProperty("signIn");
      expect(result.current).toHaveProperty("signUp");
      expect(result.current).toHaveProperty("isLoading");
      expect(Object.keys(result.current)).toHaveLength(3);
    });
  });
});
