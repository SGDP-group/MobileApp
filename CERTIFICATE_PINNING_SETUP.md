# Certificate Pinning Setup Guide

## Overview

This guide explains how to implement SSL certificate pinning to prevent Man-in-the-Middle (MITM) attacks in the FocusFrame app.

---

## Part 1: Get Certificate Pins

### Method 1: Using OpenSSL (Recommended)

```bash
# 1. Get the certificate from googleapis.com
echo | openssl s_client -connect www.googleapis.com:443 -showcerts 2>/dev/null | \
  openssl x509 -outform PEM > googleapis.pem

# 2. Extract the public key hash (SHA-256)
openssl x509 -in googleapis.pem -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64

# Output will be something like:
# r/mIkG3xVJR4l+9YJLKh4tl6KFYC9r1Y5q7K0TXp9M0=
```

### Method 2: Using Node.js Script

```javascript
const tls = require('tls');
const crypto = require('crypto');

const hostname = 'www.googleapis.com';
const socket = tls.connect(443, hostname, () => {
  const cert = socket.getPeerCertificate();
  const pubkey = cert.pubkey;
  const hash = crypto.createHash('sha256').update(pubkey).digest('base64');
  console.log(`sha256/${hash}`);
  socket.end();
});
```

### Method 3: Using Chrome DevTools

1. Visit `https://www.googleapis.com` in Chrome
2. Click the 🔒 padlock icon → "Connection is secure"
3. Click "Certificate is valid"
4. Go to "Details" tab → Export certificate
5. Use OpenSSL to extract the pin (see Method 1)

---

## Part 2: Android Setup (✅ Already Configured)

The Android configuration is already set up in:
- `android/app/src/main/res/xml/network_security_config.xml`
- `android/app/src/main/AndroidManifest.xml`

**You just need to update the certificate pins with real values:**

```xml
<!-- Replace these placeholder pins -->
<pin digest="SHA-256">AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=</pin>
<pin digest="SHA-256">BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=</pin>

<!-- With actual pins from Google -->
<pin digest="SHA-256">r/mIkG3xVJR4l+9YJLKh4tl6KFYC9r1Y5q7K0TXp9M0=</pin>
<pin digest="SHA-256">YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=</pin>
```

---

## Part 3: iOS Setup

### Option A: Using TrustKit (Recommended)

1. **Install TrustKit via CocoaPods**

Add to `ios/Podfile`:
```ruby
pod 'TrustKit'
```

Run:
```bash
cd ios && pod install
```

2. **Configure TrustKit in AppDelegate**

Edit `ios/FocusFrame/AppDelegate.mm`:

```objc
#import <TrustKit/TrustKit.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Initialize TrustKit
  NSDictionary *trustKitConfig = @{
    kTSKSwizzleNetworkDelegates: @YES,
    kTSKPinnedDomains: @{
      @"googleapis.com": @{
        kTSKIncludeSubdomains: @YES,
        kTSKEnforcePinning: @YES,
        kTSKPublicKeyHashes: @[
          @"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=", // Replace with actual pin
          @"BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=", // Backup pin
          @"CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC="  // Root CA pin
        ],
        kTSKExpirationDate: @"2027-12-31"
      },
      @"accounts.google.com": @{
        kTSKIncludeSubdomains: @YES,
        kTSKEnforcePinning: @YES,
        kTSKPublicKeyHashes: @[
          @"DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD=",
          @"EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE="
        ]
      }
    }
  };
  
  [TrustKit initSharedInstanceWithConfiguration:trustKitConfig];
  
  // ... rest of your code
  return YES;
}

@end
```

### Option B: Using Info.plist

Add to `ios/FocusFrame/Info.plist`:

```xml
<key>TSKConfiguration</key>
<dict>
  <key>TSKSwizzleNetworkDelegates</key>
  <true/>
  <key>TSKPinnedDomains</key>
  <dict>
    <key>googleapis.com</key>
    <dict>
      <key>TSKIncludeSubdomains</key>
      <true/>
      <key>TSKEnforcePinning</key>
      <true/>
      <key>TSKPublicKeyHashes</key>
      <array>
        <string>AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=</string>
        <string>BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=</string>
      </array>
      <key>TSKExpirationDate</key>
      <string>2027-12-31</string>
    </dict>
  </dict>
</dict>
```

---

## Part 4: Testing Certificate Pinning

### Test on Android

1. Build the app:
```bash
npx expo run:android
```

2. Try to intercept traffic using a proxy (e.g., Charles Proxy, mitmproxy)
3. The app should **reject** connections with invalid certificates

### Test on iOS

1. Build the app:
```bash
npx expo run:ios
```

2. Install a self-signed certificate on the device
3. Try to make API calls - they should fail with certificate validation error

### Expected Behavior

✅ **Valid Certificate**: API calls succeed  
❌ **Invalid/MITM Certificate**: Connection fails with error:
```
SSL certificate validation failed: Pin verification failed
```

---

## Part 5: Maintenance

### Important: Update Pins Before Expiration!

Google certificates typically expire every 1-2 years.

**Set calendar reminders:**
- 3 months before expiration: Get new pins
- 1 month before: Deploy app update with new pins
- Always maintain 2+ pins (current + backup)

### How to Update Pins

1. Get new certificate pins (see Part 1)
2. Update both:
   - `android/app/src/main/res/xml/network_security_config.xml`
   - `ios/FocusFrame/AppDelegate.mm` (or Info.plist)
   - `src/utils/certificatePinning.ts`
3. Test thoroughly before release
4. Deploy app update

### Monitoring

Log certificate validation failures:
```typescript
// In src/utils/certificatePinning.ts
export async function secureFetch(url: string, options?: RequestInit) {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (error.message.includes('certificate')) {
      // Log to monitoring service (e.g., Sentry)
      console.error('Certificate pinning failure:', {
        url,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    throw error;
  }
}
```

---

## Part 6: Troubleshooting

### Issue: "Pin verification failed" in development

**Solution**: Disable pinning in development
```typescript
// src/utils/certificatePinning.ts
export const ENABLE_CERTIFICATE_PINNING = process.env.NODE_ENV === 'production';
```

### Issue: Pins don't match

**Cause**: You may have pinned the leaf certificate instead of the public key

**Solution**: Ensure you're hashing the **public key**, not the certificate:
```bash
# Correct: Extract public key first
openssl x509 -in cert.pem -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64
```

### Issue: Certificate expired

**Solution**: Update your pins (see Part 5)

---

## References

- [OWASP Certificate Pinning](https://owasp.org/www-community/controls/Certificate_and_Public_Key_Pinning)
- [Android Network Security Config](https://developer.android.com/training/articles/security-config)
- [TrustKit iOS Documentation](https://github.com/datatheorem/TrustKit)
- [Google Certificate Transparency](https://certificate.transparency.dev/)

---

**Last Updated**: February 6, 2026  
**Review Date**: November 6, 2026 (Before certificate expiration)
