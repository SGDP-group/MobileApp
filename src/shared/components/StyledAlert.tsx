import { colors } from "@/src/shared/theme/colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface AlertButton {
  text: string;
  onPress: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface StyledAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  type?: "info" | "success" | "warning" | "error";
}

const StyledAlert: React.FC<StyledAlertProps> = ({
  visible,
  title,
  message,
  buttons,
  type = "info",
}) => {
  const getIconName = (): React.ComponentProps<typeof Ionicons>['name'] => {
    switch (type) {
      case "success":
        return "checkmark";
      case "error":
        return "close";
      case "warning":
        return "alert-circle";
      case "info":
      default:
        return "information-circle";
    }
  };

  const getIconColor = (): string => {
    switch (type) {
      case "success":
        return "#4CAF50";
      case "error":
        return colors.error;
      case "warning":
        return "#FF9800";
      case "info":
      default:
        return colors.primary;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name={getIconName()} size={48} color={getIconColor()} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === "cancel" && styles.buttonCancel,
                  button.style === "destructive" && styles.buttonDestructive,
                ]}
                onPress={button.onPress}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === "cancel" && styles.buttonTextCancel,
                    button.style === "destructive" && styles.buttonTextDestructive,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertContainer: {
    width: "85%",
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  buttonCancel: {
    backgroundColor: colors.border,
  },
  buttonDestructive: {
    backgroundColor: colors.error,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  buttonTextCancel: {
    color: colors.secondaryText,
  },
  buttonTextDestructive: {
    color: colors.secondary,
  },
});

export default StyledAlert;
