import * as Haptics from "expo-haptics";
import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import { parseQrPayload, QrPayload } from "../utils/qrPayloadParser";

interface UseQrCodeScannerResult {
  isScannerVisible: boolean;
  isProcessingScan: boolean;
  scannedQrPayload: QrPayload | null;
  openScanner: () => void;
  closeScanner: () => void;
  handleScan: (rawPayload: string) => Promise<void>;
}

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
  const scanLockRef = useRef(false);

  const openScanner = useCallback(() => {
    scanLockRef.current = false;
    setIsProcessingScan(false);
    setIsScannerVisible(true);
  }, []);

  const closeScanner = useCallback(() => {
    scanLockRef.current = false;
    setIsProcessingScan(false);
    setIsScannerVisible(false);
  }, []);

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
      setIsScannerVisible(false);
      setIsProcessingScan(false);
      console.log("Scanned QR Payload:", parsedPayload);
    } catch (error) {
      scanLockRef.current = false;
      setIsProcessingScan(false);
      Alert.alert("Invalid QR Code", getScanErrorMessage(error));
    }
  }, []);

  return {
    isScannerVisible,
    isProcessingScan,
    scannedQrPayload,
    openScanner,
    closeScanner,
    handleScan,
  };
};
