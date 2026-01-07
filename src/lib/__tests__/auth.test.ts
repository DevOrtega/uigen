import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server-only module first (must be before importing auth)
vi.mock("server-only", () => ({}));

// Mock Next.js cookies
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Mock jose library
vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
  SignJWT: vi.fn(),
}));

import { getSession } from "../auth";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";

describe("getSession", () => {
  const mockCookieStore = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (cookies as any).mockResolvedValue(mockCookieStore);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test("returns null when no token is present", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const result = await getSession();

    expect(result).toBeNull();
    expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  });

  test("returns null when token value is empty", async () => {
    mockCookieStore.get.mockReturnValue({ value: "" });

    const result = await getSession();

    expect(result).toBeNull();
  });

  test("returns session payload when valid token exists", async () => {
    const mockToken = "valid.jwt.token";
    const mockPayload = {
      userId: "user-123",
      email: "test@example.com",
      expiresAt: new Date("2025-12-31"),
    };

    mockCookieStore.get.mockReturnValue({ value: mockToken });
    (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

    const result = await getSession();

    expect(result).toEqual(mockPayload);
    expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
    expect(jwtVerify).toHaveBeenCalled();
    expect((jwtVerify as any).mock.calls[0][0]).toBe(mockToken);
    expect((jwtVerify as any).mock.calls[0][1]).toBeTruthy();
  });

  test("returns null when token verification fails", async () => {
    const mockToken = "invalid.jwt.token";

    mockCookieStore.get.mockReturnValue({ value: mockToken });
    (jwtVerify as any).mockRejectedValue(new Error("Invalid token"));

    const result = await getSession();

    expect(result).toBeNull();
    expect(jwtVerify).toHaveBeenCalled();
    expect((jwtVerify as any).mock.calls[0][0]).toBe(mockToken);
  });

  test("returns null when token is expired", async () => {
    const mockToken = "expired.jwt.token";

    mockCookieStore.get.mockReturnValue({ value: mockToken });
    (jwtVerify as any).mockRejectedValue(new Error("Token expired"));

    const result = await getSession();

    expect(result).toBeNull();
  });

  test("returns null when token signature is invalid", async () => {
    const mockToken = "tampered.jwt.token";

    mockCookieStore.get.mockReturnValue({ value: mockToken });
    (jwtVerify as any).mockRejectedValue(new Error("Signature verification failed"));

    const result = await getSession();

    expect(result).toBeNull();
  });

  test("handles malformed token gracefully", async () => {
    const mockToken = "malformed-token";

    mockCookieStore.get.mockReturnValue({ value: mockToken });
    (jwtVerify as any).mockRejectedValue(new Error("Malformed JWT"));

    const result = await getSession();

    expect(result).toBeNull();
  });

  test("returns correct session data structure", async () => {
    const mockToken = "valid.jwt.token";
    const expirationDate = new Date("2025-12-31T23:59:59Z");
    const mockPayload = {
      userId: "user-456",
      email: "user@test.com",
      expiresAt: expirationDate,
    };

    mockCookieStore.get.mockReturnValue({ value: mockToken });
    (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

    const result = await getSession();

    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("email");
    expect(result).toHaveProperty("expiresAt");
    expect(result?.userId).toBe("user-456");
    expect(result?.email).toBe("user@test.com");
    expect(result?.expiresAt).toEqual(expirationDate);
  });

  test("calls cookies function once per invocation", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    await getSession();

    expect(cookies).toHaveBeenCalledOnce();
  });

  test("does not call jwtVerify when no token present", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    await getSession();

    expect(jwtVerify).not.toHaveBeenCalled();
  });

  test("handles concurrent getSession calls", async () => {
    const mockToken1 = "token1";
    const mockToken2 = "token2";
    const mockPayload1 = {
      userId: "user-1",
      email: "user1@test.com",
      expiresAt: new Date(),
    };
    const mockPayload2 = {
      userId: "user-2",
      email: "user2@test.com",
      expiresAt: new Date(),
    };

    mockCookieStore.get
      .mockReturnValueOnce({ value: mockToken1 })
      .mockReturnValueOnce({ value: mockToken2 });

    (jwtVerify as any)
      .mockResolvedValueOnce({ payload: mockPayload1 })
      .mockResolvedValueOnce({ payload: mockPayload2 });

    const [result1, result2] = await Promise.all([
      getSession(),
      getSession(),
    ]);

    expect(result1).toEqual(mockPayload1);
    expect(result2).toEqual(mockPayload2);
  });
});
