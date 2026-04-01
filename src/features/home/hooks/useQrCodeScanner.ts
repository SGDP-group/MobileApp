import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseQrPayload, QrPayload } from "../utils/qrPayloadParser";

interface AlertConfig {
  title: string;
  message: string;
  buttons: Array<{ text: string; onPress: () => void; style?: "default" | "cancel" | "destructive" }>;
  type?: "info" | "success" | "warning" | "error";
}

interface UseQrCodeScannerResult {
  isScannerVisible: boolean;
  isProcessingScan: boolean;
  scannedQrPayload: QrPayload | null;
  clearScannedQrPayload: () => void;
  openScanner: () => void;
  closeScanner: () => void;
  handleScan: (rawPayload: string) => Promise<void>;
  alertConfig: AlertConfig | null;
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

export const useQrCodeScanner = (): UseQrCodeScannerResult => {
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [scannedQrPayload, setScannedQrPayload] = useState<QrPayload | null>(
    null,
  );
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
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

  const clearScannedQrPayload = useCallback(() => {
    setScannedQrPayload(null);
  }, []);

  const showInvalidQrAlert = useCallback(
    (error: unknown) => {
      let handled = false;

      const handleDismiss = () => {
        if (handled) {
          return;
        }

        handled = true;
        unlockScanAfterCooldown();
        setAlertConfig(null);
      };

      setAlertConfig({
        title: "Invalid QR Code",
        message: getScanErrorMessage(error),
        buttons: [{ text: "OK", onPress: handleDismiss }],
        type: "error",
      });
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
      const parsedPayload = parseQrPayload(rawPayload);
      setScannedQrPayload(parsedPayload);
      await triggerSuccessHaptic();
      clearCooldownTimer();
      setIsScannerVisible(false);
      setIsProcessingScan(false);
    } catch (error) {
      showInvalidQrAlert(error);
    }
  }, [clearCooldownTimer, showInvalidQrAlert]);

  return {
    isScannerVisible,
    isProcessingScan,
    scannedQrPayload,
    clearScannedQrPayload,
    openScanner,
    closeScanner,
    handleScan,
    alertConfig,
  };
};
