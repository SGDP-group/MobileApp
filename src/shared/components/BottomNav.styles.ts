import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#151F24",
    borderRadius: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#22323A",
  },
  bottomItem: {
    alignItems: "center",
    gap: 4,
  },
  bottomItemActive: {
    alignItems: "center",
    gap: 4,
  },
  bottomLabel: {
    fontSize: 10,
    color: "#6E808A",
  },
  bottomLabelActive: {
    fontSize: 10,
    color: "#54D2FF",
    fontWeight: "600",
  },
});
