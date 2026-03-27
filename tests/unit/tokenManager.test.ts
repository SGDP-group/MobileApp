jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    getTokens: jest.fn(),
    signInSilently: jest.fn(),
  },
}));

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as SecureStore from "expo-secure-store";

import { tokenManager } from "../../src/utils/tokenManager";

describe("tokenManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenManager.clearCache();
  });

  it("returns a fresh token and then uses cache", async () => {
    (GoogleSignin.getTokens as jest.Mock).mockResolvedValue({
      accessToken: "token-a",
    });

    const first = await tokenManager.getAccessToken();
    const second = await tokenManager.getAccessToken();

    expect(first).toBe("token-a");
    expect(second).toBe("token-a");
    expect(GoogleSignin.getTokens).toHaveBeenCalledTimes(1);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "google_access_token",
      "token-a",
    );
  });

  it("retries silently when initial token fetch fails", async () => {
    (GoogleSignin.getTokens as jest.Mock)
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({ accessToken: "token-b" });
    (GoogleSignin.signInSilently as jest.Mock).mockResolvedValue(undefined);

    const token = await tokenManager.getAccessToken();

    expect(token).toBe("token-b");
    expect(GoogleSignin.signInSilently).toHaveBeenCalledTimes(1);
    expect(GoogleSignin.getTokens).toHaveBeenCalledTimes(2);
  });

  it("throws a user-friendly error when all attempts fail", async () => {
    (GoogleSignin.getTokens as jest.Mock).mockRejectedValue(
      new Error("fatal"),
    );
    (GoogleSignin.signInSilently as jest.Mock).mockRejectedValue(
      new Error("silent fail"),
    );

    await expect(tokenManager.getAccessToken()).rejects.toThrow(
      "Failed to get access token. Please sign in again.",
    );
  });

  it("clears all stored tokens", async () => {
    await tokenManager.clearAllTokens();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      "google_access_token",
    );
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      "google_refresh_token",
    );
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      "google_token_expiry",
    );
  });
});
