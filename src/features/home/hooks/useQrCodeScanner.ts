import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { authenticateToken } from "../../../services/authTokenService";
import { parseQrPayload } from "../utils/qrPayloadParser";

interface UseQrCodeScannerResult {
  isScannerVisible: boolean;
  isProcessingScan: boolean;
  scannedQrPayload: string | null;
  openScanner: () => void;
  closeScanner: () => void;
  handleScan: (rawPayload: string) => Promise<void>;
}

const INVALID_SCAN_COOLDOWN_MS = 1000;

const getScanErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Unable to read this QR code.";
};

const triggerSuccessHaptic = async (): Promise<void> => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptics support varies by platform/device; scanning should still succeed.
  }
};

export const useQrCodeScanner = (email: string): UseQrCodeScannerResult => {
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [scannedQrPayload, setScannedQrPayload] = useState<string | null>(
    null,
  );
  const scanLockRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCooldownTimer = useCallback(() => {
    if (!cooldownTimerRef.current) {
      return;
    }

    clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = null;
  }, []);

  const unlockScanAfterCooldown = useCallback(() => {
    clearCooldownTimer();

    cooldownTimerRef.current = setTimeout(() => {
      scanLockRef.current = false;
      setIsProcessingScan(false);
      cooldownTimerRef.current = null;
    }, INVALID_SCAN_COOLDOWN_MS);
  }, [clearCooldownTimer]);

  const openScanner = useCallback(() => {
    clearCooldownTimer();
    scanLockRef.current = false;
    setIsProcessingScan(false);
    setIsScannerVisible(true);
  }, [clearCooldownTimer]);

  const closeScanner = useCallback(() => {
    clearCooldownTimer();
    scanLockRef.current = false;
    setIsProcessingScan(false);
    setIsScannerVisible(false);
  }, [clearCooldownTimer]);

  const showInvalidQrAlert = useCallback(
    (error: unknown) => {
      let handled = false;

      const handleDismiss = () => {
        if (handled) {
          return;
        }

        handled = true;
        unlockScanAfterCooldown();
      };

      Alert.alert(
        "Invalid QR Code",
        getScanErrorMessage(error),
        [{ text: "OK", onPress: handleDismiss }],
        { cancelable: false, onDismiss: handleDismiss },
      );
    },
    [unlockScanAfterCooldown],
  );

  useEffect(() => {
    return () => {
      clearCooldownTimer();
    };
  }, [clearCooldownTimer]);

  const handleScan = useCallback(async (rawPayload: string) => {
    if (scanLockRef.current) {
      return;
    }

    scanLockRef.current = true;
    setIsProcessingScan(true);

    try {
      const token = parseQrPayload(rawPayload);
      const authenticated = await authenticateToken(token, email);

      if (!authenticated) {
        throw new Error("Authentication failed. Please try again.");
      }

      setScannedQrPayload(token);
      await triggerSuccessHaptic();
      clearCooldownTimer();
      setIsScannerVisible(false);
      setIsProcessingScan(false);
    } catch (error) {
      showInvalidQrAlert(error);
    }
  }, [clearCooldownTimer, email, showInvalidQrAlert]);

  return {
    isScannerVisible,
    isProcessingScan,
    scannedQrPayload,
    openScanner,
    closeScanner,
    handleScan,
  };
};
