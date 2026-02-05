import { StyleSheet } from "react-native";
import { Colors } from "@shared/theme/colors";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
    height: 55,
    borderRadius: 30,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    position: "relative",
  },
  primaryBg: {
    backgroundColor: Colors.primary,
  },
  secondaryBg: {
    backgroundColor: Colors.secondary,
    marginBottom: 24,
  },
  textPrimary: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  textSecondary: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  iconContainer: {
    position: "absolute",
    left: 20,
  },
});
