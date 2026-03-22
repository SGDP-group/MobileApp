// utils/globalLogout.ts
// Utility to trigger global logout from anywhere in the app
import { Alert } from 'react-native';

let logoutHandler: (() => void) | null = null;

export function setGlobalLogoutHandler(fn: () => void) {
  logoutHandler = fn;
}

export function triggerGlobalLogout(reason?: string) {
  if (logoutHandler) {
    if (reason) {
      Alert.alert('Session Expired', reason, [{ text: 'OK', onPress: () => logoutHandler && logoutHandler() }]);
    } else {
      logoutHandler();
    }
  }
}
