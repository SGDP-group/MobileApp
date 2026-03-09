import { colors } from "@shared/theme/colors";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  detailModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  detailModalContent: {
    backgroundColor: "#1A2429",
    borderRadius: 12,
    maxHeight: "80%",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#23343C",
  },
  detailModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  detailModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  detailModalBody: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  detailText: {
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 20,
  },
  detailLink: {
    fontSize: 14,
    color: "#54D2FF",
    textDecorationLine: "underline",
    lineHeight: 20,
  },
});
