# Security Implementation Guide

## Overview

This document outlines the comprehensive security improvements implemented in the FocusFrame mobile application, including rate limiting, certificate pinning, and encryption at rest.

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
- Clears encrypted calendar cache
- Removes encryption keys from device
- Ensures no tokens or sensitive data remain after logout

**Implementation in `RootNavigator.tsx`:**

```typescript
const handleLogout = async () => {
  await tokenManager.clearAllTokens(); // Clear tokens
  await googleCalendarService.clearCache(); // Clear encrypted cache
  await clearEncryptionKey(); // Clear encryption keys
  await GoogleSignin.revokeAccess(); // Revoke Google access
  await GoogleSignin.signOut(); // Sign out
  setUserInfo(null);
  setIsLoggedIn(false);
};
```

---

### 7. ✅ API Rate Limiting

**Status:** IMPLEMENTED

**New File:** `src/utils/rateLimiter.ts`

**Features:**

- Prevents API abuse with configurable request limits (default: 30 requests/min)
- Exponential backoff for repeated violations
- Per-endpoint rate limiting tracking
- Automatic request throttling
- Clear error messages with retry-after times

**Implementation:**

```typescript
// Integrated into googleCalendarService.ts
const rateLimitCheck = await apiRateLimiter.checkLimit("google-calendar-api");

if (!rateLimitCheck.allowed) {
  throw new Error(
    `Rate limit exceeded. Please try again in ${rateLimitCheck.retryAfter} seconds.`,
  );
}
```

**Configuration:**

- Max Requests: 30 per minute (configurable)
- Backoff Strategy: Exponential (2^attempts × 1s, max 5 minutes)
- Scope: Global per API service

**Benefits:**

- Prevents accidental API abuse/spam
- Protects against DoS attacks
- Reduces unnecessary API costs
- Improves user experience with clear feedback

---

### 8. ✅ Encryption at Rest

**Status:** IMPLEMENTED

**New File:** `src/utils/encryption.ts`

**Features:**

- AES-based encryption for sensitive data stored locally
- Automatic encryption key generation and secure storage
- Calendar event caching with encryption
- 5-minute cache expiry
- Key rotation support

**Implementation:**

```typescript
// Encrypting calendar data
const encrypted = await encryptData(calendarEvents);
await SecureStore.setItemAsync("calendar_cache", encrypted);

// Decrypting calendar data
const encrypted = await SecureStore.getItemAsync("calendar_cache");
const events = await decryptData<CalendarEvent[]>(encrypted);
```

**What's Encrypted:**

- Cached calendar events
- Temporary API responses
- Any locally stored sensitive data

**Key Management:**

- Keys stored in expo-secure-store (hardware-backed on supported devices)
- Keys automatically cleared on logout
- Keys regenerated on first app launch

**Benefits:**

- Protects calendar data if device is compromised
- Secure offline event caching
- Compliance with data protection regulations

---

### 9. ✅ SSL Certificate Pinning

**Status:** IMPLEMENTED (Configuration Ready)

- [ ] **Test rate limiting with rapid requests**
- [ ] **Verify encrypted cache works correctly**
- [ ] **Test cache cleared on logout**
- [ ] **Verify certificate pinning blocks MITM (Android)**
- [ ] **Test cache expiry (after 5 minutes)**

### Automated Testing (TODO)

Consider adding unit tests for:

- Input validation functions
- Error message sanitization
- Token manager caching behavior
- Date range validation edge cases
- **Rate limiter behavior**
- **Encryption/decryption functions**
- **Cache expiry logic**

### Security Testing Tools

**For Rate Limiting:**

```bash
# Test rapid requests
for i in {1..50}; do
  echo "Request $i"
  # Make API call here
done
# Should see rate limit errors after 30 requests
```

**For Certificate Pinning:**

- Use Charles Proxy or mitmproxy
- Install self-signed certificate
- Try to intercept app traffic
- App should reject connections

**For Encryption:**

```typescript
// Test encryption roundtrip
const original = { id: "123", summary: "Test Event" };
const encrypted = await encryptData(original);
const decrypted = await decryptData(encrypted);
console.assert(JSON.stringify(original) === JSON.stringify(decrypted));
```

- Certificate pinning for googleapis.com domains
- Android Network Security Config pre-configured
- iOS TrustKit setup guide provided
- Pin expiration tracking (2027-12-31)
- Development mode bypass

**What's Protected:**

- All Google API requests (Calendar, Auth, etc.)
- OAuth token endpoints
- User data endpoints

**Setup Required:**

⚠️ **Action Needed:** Replace placeholder certificate pins with actual Google certificate pins.

**Steps:**

1. Extract Google API certificates:

```bash
openssl s_client -connect www.googleapis.com:443 -showcerts < /dev/null 2>/dev/null | \
  openssl x509 -outform PEM > googleapis.pem

openssl x509 -in googleapis.pem -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64
```

2. Update pins in:
   - `android/app/src/main/res/xml/network_security_config.xml`
   - `src/utils/certificatePinning.ts`

3. For iOS, follow instructions in `CERTIFICATE_PINNING_SETUP.md`

**Benefits:**

- Prevents Man-in-the-Middle (MITM) attacks
- Protects against compromised Certificate Authorities
- Ensures API communications are secure
- Industry-standard security practice

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
- [x] **API rate limiting with exponential backoff**
- [x] **Encryption at rest for cached data**
- [x] **SSL certificate pinning (configuration ready)**
- [x] **Encrypted cache cleared on logout**
- [x] **Secure encryption key management**

---

## Additional Security Recommendations

### 1. **Two-Factor Authentication (TODO)**

- Implement additional auth layer for sensitive operations
- Consider requiring Google 2FA for users

### 2. **Security Monitoring (TODO)**

- Log failed auth attempts
- Monitor for unusual API usage patterns
- Set up alerts for security events
- Track rate limit violations

### 3. **Regular Security Audits (TODO)**

- Perform code security reviews quarterly
- Run SAST (Static Application Security Testing) tools
- Keep dependencies up to date
- Review certificate expiration dates (set alerts)

### 4. **Biometric Authentication (TODO)**

- Add Face ID / Touch ID / Fingerprint auth
- Require biometric confirmation for sensitive actions

### 5. **Certificate Pin Updates (CRITICAL)**

⚠️ **Set calendar reminders:**

- **August 2027**: Get new Google certificate pins
- **October 2027**: Deploy app update with new pins
- Always maintain 2+ pins (current + backup)

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

If certificate pinning fails in production:

1. Check if Google certificates have been rotated
2. Extract new certificate pins
3. Release emergency app update with new pins
4. Communicate with users about required update

If rate limiting is being bypassed:

- [OWASP Certificate Pinning](https://owasp.org/www-community/controls/Certificate_and_Public_Key_Pinning)
- [Android Network Security Config](https://developer.android.com/training/articles/security-config)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

## New Security Files Added

| File                                                       | Purpose                                    |
| ---------------------------------------------------------- | ------------------------------------------ |
| `src/utils/rateLimiter.ts`                                 | API rate limiting with exponential backoff |
| `src/utils/encryption.ts`                                  | Data encryption at rest utilities          |
| `src/utils/certificatePinning.ts`                          | Certificate pin definitions                |
| `android/app/src/main/res/xml/network_security_config.xml` | Android certificate pinning config         |
| `CERTIFICATE_PINNING_SETUP.md`                             | Complete certificate pinning setup guide   |

---

**Last Updated:** February 6, 2026  
**Version:** 2.0.0  
**Next Review:** August 2026 (Before certificate expiration)authentication checks

If encrypted data is compromised:

1. Force logout all users
2. Clear all cached data
3. Rotate encryption keys
4. Investigate breach source
5. Notify users if personal data was exposed

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
