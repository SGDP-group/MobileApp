import Ionicons from "@expo/vector-icons/Ionicons";
import {
    pingProvisioningServer,
    submitProvisioning,
} from "@services/deviceProvisioningService";
import { getStoredUserId } from "@services/focusFrameUserService";
import StyledAlert from "@shared/components/StyledAlert";

import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface DeviceProvisioningModalProps {
    visible: boolean;
    onClose: () => void;
    initialSsid?: string;
}

export default function DeviceProvisioningModal({
    visible,
    onClose,
    initialSsid = "",
}: DeviceProvisioningModalProps) {
    const [wifiSsid, setWifiSsid] = useState(initialSsid);
    const [wifiPassword, setWifiPassword] = useState("");
    const [isChecking, setIsChecking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        title: string;
        message: string;
        buttons: Array<{ text: string; onPress?: () => void }>;
        type?: "info" | "success" | "warning" | "error";
    }>({
        title: "",
        message: "",
        buttons: [],
        type: "info",
    });

    const showAlert = (
        title: string,
        message: string,
        buttons: Array<{ text: string; onPress?: () => void }> = [],
        type?: "info" | "success" | "warning" | "error"
    ) => {
        setAlertConfig({ title, message, buttons, type });
        setAlertVisible(true);
    };

    const handleCheckConnection = useCallback(async () => {
        setIsChecking(true);
        try {
            const reachable = await pingProvisioningServer();
            if (!reachable) {
                showAlert(
                    "Device Not Reachable",
                    "Connect your phone to PiSetup-XXXX and try again.",
                    undefined,
                    "warning"
                );
                return;
            }
            showAlert("Connected", "Pi provisioning server is reachable.", undefined, "success");
        } catch {
            showAlert("Connection Failed", "Could not reach the device.", undefined, "error");
        } finally {
            setIsChecking(false);
        }
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!wifiSsid || !wifiPassword) {
            showAlert("Missing Info", "Please enter both SSID and Password.", undefined, "warning");
            return;
        }

        setIsSubmitting(true);
        try {
            const userId = await getStoredUserId();
            if (!userId) {
                showAlert("Sign In Required", "Please sign in again.", undefined, "warning");
                return;
            }
            const response = await submitProvisioning({ userId, wifiSsid, wifiPassword });

            if (response.status === "error") {
                showAlert("Error", response.message || "Please retry.", undefined, "error");
                return;
            }

            showAlert("Success", "Settings sent! Device is rebooting.", undefined, "success");
            setWifiPassword("");
            onClose(); // Close modal on success
        } catch (error) {
            showAlert("Failed", "Provisioning request failed.", undefined, "error");
        } finally {
            setIsSubmitting(false);
        }
    }, [wifiPassword, wifiSsid, onClose]);

    const isBusy = isChecking || isSubmitting;

    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            transparent={false}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                {/* Header with Close Button */}
                <View style={styles.header}>
                    <Text style={styles.title}>Device Setup</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="#E9F7FF" />
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    style={styles.content}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <Text style={styles.subtitle}>
                        1. Connect your phone Wi-Fi to **PiSetup-XXXX**. {"\n"}
                        2. Enter your home Wi-Fi details below.
                    </Text>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => void handleCheckConnection()}
                        disabled={isBusy}
                    >
                        <Text style={styles.secondaryButtonText}>
                            {isChecking ? "Checking..." : "Check Device Connection"}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Home Wi-Fi Name (SSID)</Text>
                        <TextInput
                            value={wifiSsid}
                            onChangeText={setWifiSsid}
                            placeholder="e.g. MyHomeNetwork"
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
                        onPress={() => void handleSubmit()}
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

            <StyledAlert
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                type={alertConfig.type}
            />
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#09161E",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#123142",
    },
    closeButton: {
        padding: 5,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#E9F7FF",
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 22,
        color: "#B3CBD6",
        marginBottom: 20,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        color: "#CFE6F0",
        fontSize: 13,
        marginBottom: 6,
    },
    input: {
        height: 48,
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
        marginBottom: 20,
    },
    secondaryButtonText: {
        color: "#9FDEF7",
        textAlign: "center",
        fontWeight: "600",
    },
    primaryButton: {
        marginTop: 10,
        backgroundColor: "#79D7FF",
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: "center",
    },
    primaryButtonDisabled: {
        opacity: 0.5,
    },
    primaryButtonText: {
        color: "#06222E",
        fontWeight: "700",
    },
});