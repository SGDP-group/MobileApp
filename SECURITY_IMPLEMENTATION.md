# Security Implementation Guide

## Overview

This document outlines the security improvements implemented in the FocusFrame mobile application.

## Security Improvements Made

### 1. ✅ Environment Variables for Credentials

**Status:** IMPLEMENTED

**What Changed:**

- Google OAuth Client IDs moved from hardcoded strings to environment variables
- Created `.env.example` template file with required environment variables
- Updated `RootNavigator.tsx` to read credentials from `process.env`

**Files Modified:**

- `.env.example` - Template for environment variables
- `src/shared/navigation/RootNavigator.tsx` - Uses `EXPO_PUBLIC_GOOGLE_CLIENT_ID_*` variables

**How to Use:**

1. Copy `.env.example` to `.env` (for local development)
2. Add actual Client IDs from your Google Cloud Console:
   ```bash
   EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=YOUR_WEB_CLIENT_ID
   EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=YOUR_IOS_CLIENT_ID
   EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=YOUR_ANDROID_CLIENT_ID
   EXPO_PUBLIC_API_LOG_LEVEL=production
   ```

**Why It Matters:**

- Prevents accidental exposure of OAuth credentials in version control
- Allows different credentials per environment (dev, staging, production)
- Follows 12-factor app methodology

---

### 2. ✅ Removed Sensitive Logging

**Status:** IMPLEMENTED

**What Changed:**

- Removed `console.log("User Info:", response.data)` from login flow
- All API errors now only log in development mode via `isDevelopment()` check
- User information no longer logged to console

**Files Modified:**

- `src/features/auth/screens/WelcomeScreen.tsx` - Removed user data logging
- `src/services/googleCalendarService.ts` - Conditional error logging
- `src/features/HomePage/HomeScreen.tsx` - Improved error handling

**Why It Matters:**

- Prevents exposure of sensitive user data in app logs
- Reduces attack surface if logs are captured or shared
- Production logs won't contain identifying information

---

### 3. ✅ Secure Token Management

**Status:** IMPLEMENTED

**New File:** `src/utils/tokenManager.ts`

**Features:**

- Token caching (5-minute cache to reduce API calls)
- Secure storage using `expo-secure-store` for token persistence
- Automatic fallback if secure store unavailable
- Tokens cleared on logout

**Implementation:**

```typescript
// Usage in API calls
const accessToken = await tokenManager.getAccessToken();
```

**Benefits:**

- Reduces unnecessary token refresh calls
- Tokens stored securely on device
- Cache prevents excessive Google API calls
- Proper cleanup on logout

---

### 4. ✅ Input Validation & Sanitization

**Status:** IMPLEMENTED

**New File:** `src/utils/securityUtils.ts`

**Validation Functions:**

- `sanitizeString()` - Validates and limits string input length
- `validateEventId()` - Ensures event IDs match expected format
- `validateDateRange()` - Validates date inputs (prevents past/future extremes)
- `getSafeErrorMessage()` - Returns user-friendly error messages without API details

**Files Using Validation:**

- `src/services/googleCalendarService.ts`:
  - `getEvent(eventId)` - Validates event ID format
  - `deleteEvent(eventId)` - Validates event ID format
  - `getEventsByDateRange(startDate, endDate)` - Validates date range
  - `searchEvents(query)` - Sanitizes search query (max 256 chars)
  - `quickAddEvent(text)` - Sanitizes text input (max 500 chars)

**Prevents:**

- Parameter injection attacks
- Malformed API calls
- Buffer overflow from large inputs
- Invalid date queries

---

### 5. ✅ Improved Error Handling

**Status:** IMPLEMENTED

**What Changed:**

- Generic error messages shown to users (no API details exposed)
- Different safe messages for different error types (401, 403, 404, rate limits)
- Detailed errors only logged in development mode
- Error responses sanitized before display

**Error Message Mappings:**

- `401/Unauthorized` → "Your session has expired. Please sign in again."
- `403/Forbidden` → "Permission denied. Please check your calendar permissions."
- `404/Not Found` → "Event not found."
- `rate limit` → "Too many requests. Please try again later."
- Generic errors → "An error occurred. Please try again."

**Files Modified:**

- `src/services/googleCalendarService.ts` - Safe error handling
- `src/features/HomePage/HomeScreen.tsx` - Uses safe error messages

---

### 6. ✅ Enhanced Logout Process

**Status:** IMPLEMENTED

**What Changed:**

- Logout now calls `tokenManager.clearAllTokens()` before signing out
- Clears both memory cache and secure storage
- Ensures no tokens remain on device after logout

**Implementation in `RootNavigator.tsx`:**

```typescript
const handleLogout = async () => {
  await tokenManager.clearAllTokens(); // Clear tokens
  await GoogleSignin.revokeAccess(); // Revoke Google access
  await GoogleSignin.signOut(); // Sign out
  setUserInfo(null);
  setIsLoggedIn(false);
};
```

---

## Security Best Practices Checklist

- [x] No hardcoded credentials in source code
- [x] Environment variables for configuration
- [x] Secure token storage (expo-secure-store)
- [x] Token caching to reduce API calls
- [x] Input validation and sanitization
- [x] Safe error messages (no API details exposed)
- [x] Sensitive data not logged to console
- [x] Development-only verbose logging
- [x] Proper logout with token cleanup
- [x] Date range validation
- [x] Event ID format validation

---

## Additional Security Recommendations

### 1. **API Rate Limiting (TODO)**

- Consider implementing exponential backoff for failed requests
- Add request queuing to prevent burst API calls

### 2. **Two-Factor Authentication (TODO)**

- Implement additional auth layer for sensitive operations
- Consider requiring Google 2FA for users

### 3. **Certificate Pinning (TODO)**

- Pin Google API certificates on mobile apps
- Prevents man-in-the-middle attacks

### 4. **Encryption at Rest (TODO)**

- Encrypt event data stored locally on device
- Use encryption for any cached calendar data

### 5. **Security Monitoring (TODO)**

- Log failed auth attempts
- Monitor for unusual API usage patterns
- Set up alerts for security events

### 6. **Regular Security Audits (TODO)**

- Perform code security reviews quarterly
- Run SAST (Static Application Security Testing) tools
- Keep dependencies up to date

---

## Environment Variables Reference

### Required Variables

```
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=          # For web platform
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=          # For iOS platform
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=      # For Android platform
```

### Optional Variables

```
EXPO_PUBLIC_API_LOG_LEVEL=production       # Set to 'development' for verbose logs
```

### How to Set Environment Variables

**For Expo/React Native:**

- File: `.env` (create in project root)
- Variables must start with `EXPO_PUBLIC_` to be accessible from code
- Use `.env.example` as template

**For Different Environments:**

- Local dev: `.env`
- Staging: `.env.staging`
- Production: Configure in build system or GitHub Secrets

---

## Testing Security

### Manual Testing Checklist

- [ ] Verify credentials not logged in console
- [ ] Check that sensitive data not printed to console
- [ ] Confirm error messages don't expose API details
- [ ] Test logout properly clears tokens
- [ ] Verify invalid inputs are rejected
- [ ] Test date range validation
- [ ] Confirm rate limit messages display correctly

### Automated Testing (TODO)

Consider adding unit tests for:

- Input validation functions
- Error message sanitization
- Token manager caching behavior
- Date range validation edge cases

---

## Incident Response

If credentials are exposed:

1. Immediately revoke the compromised credentials in Google Cloud Console
2. Generate new client IDs
3. Update `.env` files across all environments
4. Notify affected users
5. Review logs for unauthorized access

---

## References

- [Google ID Security Best Practices](https://developers.google.com/identity/protocols/oauth2/security)
- [OWASP Mobile App Security](https://owasp.org/www-project-mobile-app-security/)
- [Expo Security Documentation](https://docs.expo.dev/security/credentials/)
- [React Native SecureStore](https://github.com/expo/expo/tree/main/packages/expo-secure-store)

---

**Last Updated:** February 6, 2026  
**Version:** 1.0.0
