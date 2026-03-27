import {
    pingProvisioningServer,
    submitProvisioning,
} from "@services/deviceProvisioningService";
import { getStoredUserId } from "@services/focusFrameUserService";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DeviceProvisioningScreen() {
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckConnection = useCallback(async () => {
    setIsChecking(true);

    try {
      const reachable = await pingProvisioningServer();
      if (!reachable) {
        Alert.alert(
          "Device Not Reachable",
          "Connect your phone to PiSetup-XXXX and try again.",
        );
        return;
      }

      Alert.alert("Connected", "Pi provisioning server is reachable.");
    } catch {
      Alert.alert(
        "Connection Failed",
        "Could not reach the device. Join PiSetup-XXXX and retry.",
      );
    } finally {
      setIsChecking(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const userId = await getStoredUserId();
      if (!userId) {
        Alert.alert("Sign In Required", "Please sign in again before setup.");
        return;
      }

      const response = await submitProvisioning({
        userId,
        wifiSsid,
        wifiPassword,
      });

      if (response.status === "error") {
        Alert.alert("Provisioning Failed", response.message || "Please retry.");
        return;
      }

      Alert.alert(
        "Setup Submitted",
        "The device is applying your Wi-Fi settings. It will switch off SoftAP when done.",
      );
      setWifiPassword("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Provisioning request failed.";
      Alert.alert("Provisioning Failed", message);
    } finally {
      setIsSubmitting(false);
    }
  }, [wifiPassword, wifiSsid]);

  const isBusy = isChecking || isSubmitting;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.title}>Device Setup</Text>
        <Text style={styles.subtitle}>
          1. Open Wi-Fi Settings and connect to PiSetup-XXXX. {"\n"}
          2. Return here and submit your home Wi-Fi.
        </Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            void handleCheckConnection();
          }}
          disabled={isBusy}
        >
          <Text style={styles.secondaryButtonText}>Check Device Connection</Text>
        </TouchableOpacity>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Home Wi-Fi Name (SSID)</Text>
          <TextInput
            value={wifiSsid}
            onChangeText={setWifiSsid}
            placeholder="Enter SSID"
            placeholderTextColor="#78909C"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Home Wi-Fi Password</Text>
          <TextInput
            value={wifiPassword}
            onChangeText={setWifiPassword}
            placeholder="Enter password"
            placeholderTextColor="#78909C"
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, isBusy ? styles.primaryButtonDisabled : null]}
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isBusy}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#06222E" />
          ) : (
            <Text style={styles.primaryButtonText}>Send To Device</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09161E",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#E9F7FF",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "#B3CBD6",
    marginBottom: 18,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    color: "#CFE6F0",
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#21404F",
    backgroundColor: "#0F222D",
    color: "#EAF8FF",
    paddingHorizontal: 12,
  },
  secondaryButton: {
    backgroundColor: "#123142",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#255067",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: "#9FDEF7",
    textAlign: "center",
    fontWeight: "600",
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: "#79D7FF",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#06222E",
    fontWeight: "700",
  },
});
