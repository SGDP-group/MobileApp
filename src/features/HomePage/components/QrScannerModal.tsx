import Ionicons from "@expo/vector-icons/Ionicons";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface QrScannerModalProps {
  visible: boolean;
  isProcessingScan: boolean;
  onClose: () => void;
  onScan: (rawPayload: string) => void;
}

export default function QrScannerModal({
  visible,
  isProcessingScan,
  onClose,
  onScan,
}: QrScannerModalProps) {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [effectivePermission, setEffectivePermission] = useState(permission);
  const [isPermissionChecking, setIsPermissionChecking] = useState(false);

  useEffect(() => {
    setEffectivePermission(permission);
  }, [permission]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let isCancelled = false;

    const refreshAndRequestPermission = async () => {
      setIsPermissionChecking(true);

      try {
        const currentPermission = await getPermission();

        if (isCancelled) {
          return;
        }

        setEffectivePermission(currentPermission);

        if (!currentPermission.granted && currentPermission.canAskAgain) {
          const requestedPermission = await requestPermission();

          if (isCancelled) {
            return;
          }

          setEffectivePermission(requestedPermission);
        }
      } finally {
        if (!isCancelled) {
          setIsPermissionChecking(false);
        }
      }
    };

    void refreshAndRequestPermission();

    return () => {
      isCancelled = true;
    };
  }, [getPermission, requestPermission, visible]);

  const handleGrantPermission = useCallback(async () => {
    setIsPermissionChecking(true);

    try {
      const requestedPermission = await requestPermission();
      setEffectivePermission(requestedPermission);
    } finally {
      setIsPermissionChecking(false);
    }
  }, [requestPermission]);

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (isProcessingScan) {
        return;
      }

      onScan(result.data);
    },
    [isProcessingScan, onScan],
  );

  const isPermissionPending = isPermissionChecking || effectivePermission === null;
  const isPermissionDenied =
    !isPermissionPending && effectivePermission?.granted === false;
  const cannotAskAgain = effectivePermission?.canAskAgain === false;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Scan QR Code</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#E5F7FF" />
            </TouchableOpacity>
          </View>

          {isPermissionPending && (
            <View style={styles.centeredState}>
              <ActivityIndicator size="large" color="#54D2FF" />
              <Text style={styles.helperText}>Requesting camera permission...</Text>
            </View>
          )}

          {isPermissionDenied && (
            <View style={styles.centeredState}>
              <Ionicons name="warning-outline" size={24} color="#FFB080" />
              <Text style={styles.helperText}>
                Camera permission is required to scan QR codes.
              </Text>
              {!cannotAskAgain && (
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={() => {
                    void handleGrantPermission();
                  }}
                >
                  <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
              )}
              {cannotAskAgain && (
                <Text style={styles.secondaryText}>
                  Enable camera access in device settings and reopen the scanner.
                </Text>
              )}
            </View>
          )}

          {!isPermissionPending && !isPermissionDenied && (
            <>
              <CameraView
                style={styles.cameraView}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={
                  isProcessingScan ? undefined : handleBarcodeScanned
                }
              />
              <Text style={styles.helperText}>
                Align the QR code inside the camera frame.
              </Text>
              {isProcessingScan && (
                <Text style={styles.secondaryText}>Processing scan...</Text>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 18,
    backgroundColor: "#0F1F27",
    borderWidth: 1,
    borderColor: "#23404D",
    padding: 16,
    minHeight: 300,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: "#E5F7FF",
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1B2A30",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraView: {
    height: 320,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
  },
  centeredState: {
    minHeight: 260,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  helperText: {
    color: "#B8D7E6",
    textAlign: "center",
    fontSize: 14,
  },
  secondaryText: {
    color: "#8DA7B5",
    textAlign: "center",
    fontSize: 13,
  },
  permissionButton: {
    marginTop: 6,
    backgroundColor: "#12313C",
    borderWidth: 1,
    borderColor: "#1E3E4A",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  permissionButtonText: {
    color: "#70E1FF",
    fontSize: 13,
    fontWeight: "600",
  },
});
