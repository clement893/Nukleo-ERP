/**
 * Secure Token Storage
 * Uses sessionStorage instead of localStorage for better security
 * Tokens are cleared when browser tab is closed
 */

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * Secure token storage using sessionStorage
 * More secure than localStorage as tokens are cleared on tab close
 */
export class TokenStorage {
  /**
   * Set access token
   */
  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  }

  /**
   * Get access token
   */
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  /**
   * Set refresh token
   */
  static setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  }

  /**
   * Remove all tokens
   */
  static removeTokens(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  /**
   * Check if tokens exist
   */
  static hasTokens(): boolean {
    return this.getToken() !== null || this.getRefreshToken() !== null;
  }
}

