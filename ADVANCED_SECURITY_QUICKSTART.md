# Advanced Security Features - Quick Start

## 🚀 Quick Setup Guide

### 1. Rate Limiting (✅ Already Active)

**Automatically protects all API calls** - No additional setup needed!

**How it works:**
- Max 30 requests per minute per API
- Exponential backoff on violations
- Clear error messages to users

**To customize:**
```typescript
// src/utils/rateLimiter.ts
export const apiRateLimiter = new RateLimiter({
  maxRequests: 50,        // Increase limit
  timeWindowMs: 60000,    // 1 minute window
  enableExponentialBackoff: true,
});
```

---

### 2. Encryption at Rest (✅ Already Active)

**Automatically encrypts cached calendar data** - No additional setup needed!

**Features:**
- 5-minute cache for calendar events
- Auto-encrypted before storage
- Keys cleared on logout

**Manual usage:**
```typescript
import { encryptData, decryptData } from '@utils/encryption';

// Encrypt any data
const encrypted = await encryptData({ sensitive: 'data' });
await SecureStore.setItemAsync('key', encrypted);

// Decrypt
const encrypted = await SecureStore.getItemAsync('key');
const data = await decryptData(encrypted);
```

---

### 3. Certificate Pinning (⚠️ Setup Required)

**Status:** Configuration ready, needs actual certificate pins

**Quick Setup (5 minutes):**

**Step 1:** Get Google certificate pin
```bash
# Run this command
echo | openssl s_client -connect www.googleapis.com:443 -showcerts 2>/dev/null | openssl x509 -outform PEM | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
```

**Step 2:** Update Android config
```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<pin digest="SHA-256">YOUR_PIN_FROM_STEP_1</pin>
```

**Step 3:** Add backup pin (get from backup certificate)

**Step 4:** Build and test
```bash
npx expo run:android
```

**For iOS:** See [CERTIFICATE_PINNING_SETUP.md](CERTIFICATE_PINNING_SETUP.md)

---

## 🔍 Testing Your Security

### Test Rate Limiting
```typescript
// Make rapid requests
for (let i = 0; i < 35; i++) {
  await googleCalendarService.listEvents();
  // After 30, you should see rate limit errors
}
```

### Test Encryption
```typescript
// Verify cache is encrypted
const events = await googleCalendarService.listEvents();
// Check SecureStore - data should be encrypted base64 string
```

### Test Certificate Pinning
1. Install Charles Proxy or mitmproxy
2. Install proxy certificate on device
3. Try to make API calls
4. App should reject invalid certificates ✅

---

## 📊 Monitoring

### Check Rate Limit Status
```typescript
import { apiRateLimiter } from '@utils/rateLimiter';

const status = apiRateLimiter.getStatus('google-calendar-api');
console.log(`Used: ${status.count}/${status.count + status.remaining}`);
```

### Clear Cache Manually
```typescript
import { googleCalendarService } from '@services/googleCalendarService';

await googleCalendarService.clearCache();
```

### Reset Rate Limits (development only)
```typescript
import { apiRateLimiter } from '@utils/rateLimiter';

apiRateLimiter.resetAll(); // Clear all rate limits
```

---

## 🛠️ Troubleshooting

### "Rate limit exceeded" error

**Cause:** Too many API requests in short time

**Solution:**
```typescript
// Increase limit for development
apiRateLimiter.reset('google-calendar-api');
```

### Encrypted cache not working

**Check:**
1. expo-secure-store installed? `npm list expo-secure-store`
2. Device supports secure storage? (iOS/Android only)
3. Check logs for encryption errors

**Fix:**
```bash
npm install expo-secure-store
npx expo prebuild --clean
```

### Certificate pinning blocking legitimate requests

**Cause:** Certificate pins may be outdated or incorrect

**Solution:**
1. Get fresh certificate pins (see Step 1 above)
2. Update pins in `network_security_config.xml`
3. Rebuild app

**Temporary workaround (development only):**
```typescript
// src/utils/certificatePinning.ts
export const ENABLE_CERTIFICATE_PINNING = false; // Disable temporarily
```

---

## 🔒 Security Best Practices

### DO:
✅ Keep certificate pins updated (check every 6 months)  
✅ Monitor rate limit violations in production  
✅ Test encryption/decryption regularly  
✅ Clear cache on logout (already implemented)  
✅ Use secure environments for real credentials  

### DON'T:
❌ Disable certificate pinning in production  
❌ Commit actual certificate pins to git  
❌ Store unencrypted sensitive data  
❌ Ignore rate limit warnings  
❌ Use production credentials in development  

---

## 📱 Production Checklist

Before releasing to production:

- [ ] Update certificate pins with actual Google pins
- [ ] Test certificate pinning on physical device
- [ ] Verify rate limiting works with real API calls
- [ ] Confirm encrypted cache persists across app restarts
- [ ] Test logout clears all cached data
- [ ] Verify no sensitive data in logs (set `EXPO_PUBLIC_API_LOG_LEVEL=production`)
- [ ] Set certificate expiration reminder (6 months before expiry)
- [ ] Test on both iOS and Android
- [ ] Verify `.env` file not committed to git
- [ ] Document any custom security configurations

---

## 📚 Documentation

- **Full Security Guide:** [SECURITY_IMPLEMENTATION.md](SECURITY_IMPLEMENTATION.md)
- **Certificate Pinning Setup:** [CERTIFICATE_PINNING_SETUP.md](CERTIFICATE_PINNING_SETUP.md)
- **Code Examples:** See individual utility files

---

## 🆘 Need Help?

**Rate Limiting:** See [src/utils/rateLimiter.ts](src/utils/rateLimiter.ts)  
**Encryption:** See [src/utils/encryption.ts](src/utils/encryption.ts)  
**Certificate Pinning:** See [src/utils/certificatePinning.ts](src/utils/certificatePinning.ts)  

**Issues?** Check [SECURITY_IMPLEMENTATION.md](SECURITY_IMPLEMENTATION.md) troubleshooting section

---

**Last Updated:** February 6, 2026
