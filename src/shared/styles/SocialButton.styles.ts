import { colors } from "../../shared/theme/colors";
import { StyleSheet } from "react-native";

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
    backgroundColor: colors.primary,
  },
  secondaryBg: {
    backgroundColor: colors.secondary,
    marginBottom: 24,
  },
  textPrimary: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  textSecondary: {
    color: colors.secondaryText,
    fontSize: 16,
    fontWeight: "600",
  },
  iconContainer: {
    position: "absolute",
    left: 20,
  },
});
