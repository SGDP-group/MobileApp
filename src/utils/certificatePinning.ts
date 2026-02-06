/**
 * Certificate Pinning Configuration for Android & iOS
 * 
 * This file contains SSL certificate fingerprints for Google APIs
 * to prevent Man-in-the-Middle (MITM) attacks
 */

/**
 * Google API SSL Certificate Fingerprints (SHA-256)
 * Updated: February 2026
 * 
 * IMPORTANT: Update these fingerprints before they expire!
 * Check expiration: openssl s_client -connect www.googleapis.com:443 | openssl x509 -noout -dates
 */
export const CERTIFICATE_PINS = {
  'www.googleapis.com': [
    // Primary certificate (expires ~2027)
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // Replace with actual pin
    // Backup certificate
    'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=', // Replace with actual pin
  ],
  'accounts.google.com': [
    // Primary certificate
    'sha256/CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=', // Replace with actual pin
    // Backup certificate
    'sha256/DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD=', // Replace with actual pin
  ],
  'oauth2.googleapis.com': [
    // Primary certificate
    'sha256/EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE=', // Replace with actual pin
    // Backup certificate
    'sha256/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF=', // Replace with actual pin
  ],
};

/**
 * How to get actual certificate pins:
 * 
 * METHOD 1: Using OpenSSL (recommended)
 * ```bash
 * # Get certificate
 * openssl s_client -connect www.googleapis.com:443 -showcerts < /dev/null 2>/dev/null | openssl x509 -outform PEM > googleapis.pem
 * 
 * # Get SHA-256 fingerprint
 * openssl x509 -in googleapis.pem -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
 * ```
 * 
 * METHOD 2: Using Chrome DevTools
 * 1. Open https://www.googleapis.com in Chrome
 * 2. Click the padlock icon → Connection is secure → Certificate is valid
 * 3. Go to Details tab → Copy the certificate
 * 4. Use openssl to extract the public key hash
 * 
 * METHOD 3: Using online tools
 * - https://www.ssllabs.com/ssltest/ (for public domains)
 * - Extract SPKI Fingerprint (SHA-256)
 */

/**
 * Certificate pinning implementation notes:
 * 
 * For React Native / Expo managed workflow:
 * - Use `react-native-ssl-pinning` or `@appmattus/certificatetransparency` library
 * - Requires custom dev client (cannot use Expo Go)
 * - Need to eject to bare workflow OR use EAS Build with config plugin
 * 
 * For Android (NetworkSecurityConfig):
 * - Create `android/app/src/main/res/xml/network_security_config.xml`
 * - Add pins to AndroidManifest.xml
 * 
 * For iOS (TrustKit):
 * - Add TrustKit via CocoaPods
 * - Configure in Info.plist or AppDelegate
 */

/**
 * Enable/disable certificate pinning (for testing)
 * Set to false during development, true in production
 */
export const ENABLE_CERTIFICATE_PINNING = process.env.NODE_ENV === 'production';

/**
 * Custom fetch wrapper with certificate pinning validation
 * Note: This is a placeholder - actual implementation requires native modules
 */
export async function secureFetch(url: string, options?: RequestInit): Promise<Response> {
  // In production with native modules, this would validate certificates
  // For now, this is a standard fetch with logging
  
  if (ENABLE_CERTIFICATE_PINNING) {
    // TODO: Implement native certificate validation
    console.warn('Certificate pinning enabled but not yet implemented with native modules');
  }
  
  return fetch(url, options);
}

export default {
  CERTIFICATE_PINS,
  ENABLE_CERTIFICATE_PINNING,
  secureFetch,
};
