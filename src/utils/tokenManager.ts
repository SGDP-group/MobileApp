/**
 * Secure token management using expo-secure-store
 */

import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "google_access_token";
const REFRESH_TOKEN_KEY = "google_refresh_token";
const TOKEN_EXPIRY_KEY = "google_token_expiry";

class TokenManager {
  private tokenCache: string | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  private async fetchFreshAccessToken(): Promise<string> {
    const tokens = await GoogleSignin.getTokens();

    if (!tokens.accessToken) {
      throw new Error("No access token available");
    }

    this.tokenCache = tokens.accessToken;
    this.lastFetchTime = Date.now();

    try {
      await SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken);
    } catch (storageError) {
      console.warn("Could not store token securely:", storageError);
    }

    return tokens.accessToken;
  }

  /**
   * Get access token with caching to reduce API calls
   */
  async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid
    if (this.tokenCache && now - this.lastFetchTime < this.CACHE_DURATION_MS) {
      return this.tokenCache;
    }

    try {
      return await this.fetchFreshAccessToken();
    } catch {
      try {
        await GoogleSignin.signInSilently();
        return await this.fetchFreshAccessToken();
      } catch {
        throw new Error("Failed to get access token. Please sign in again.");
      }
    }
  }

  /**
   * Clear cached token
   */
  clearCache(): void {
    this.tokenCache = null;
    this.lastFetchTime = 0;
  }

  /**
   * Clear all stored tokens
   */
  async clearAllTokens(): Promise<void> {
    this.clearCache();
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.warn("Could not clear tokens from secure store:", error);
    }
  }
}

export const tokenManager = new TokenManager();
