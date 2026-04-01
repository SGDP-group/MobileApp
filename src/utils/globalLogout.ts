// utils/globalLogout.ts
// Utility to trigger global logout from anywhere in the app

let logoutHandler: (() => void) | null = null;
let alertHandler: ((title: string, message: string) => void) | null = null;

interface AlertConfig {
  title: string;
  message: string;
  buttons: Array<{ text: string; onPress: () => void; style?: "default" | "cancel" | "destructive" }>;
  type?: "info" | "success" | "warning" | "error";
}

let alertCallbackHandler: ((config: AlertConfig) => void) | null = null;

export function setGlobalLogoutHandler(fn: () => void) {
  logoutHandler = fn;
}

export function setGlobalAlertHandler(fn: (config: AlertConfig) => void) {
  alertCallbackHandler = fn;
}

export function triggerGlobalLogout(reason?: string) {
  if (logoutHandler) {
    if (reason) {
      if (alertCallbackHandler) {
        alertCallbackHandler({
          title: 'Session Expired',
          message: reason,
          buttons: [{ text: 'OK', onPress: () => logoutHandler && logoutHandler() }],
          type: 'warning',
        });
      } else {
        // Fallback if no alert handler is set
        logoutHandler();
      }
    } else {
      logoutHandler();
    }
  }
}
