import { StyleSheet } from "react-native";
import { colors } from "../../shared/theme/colors";

export const styles = StyleSheet.create({
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.logoBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.logoBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  logoDiamond: {
    width: 100,
    height: 100,
    backgroundColor: colors.diamond,
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
  },
  logoDot: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: colors.dot,
  },
});
