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
  subtaskItem: {
    backgroundColor: "transparent",
    borderRadius: 0,
    marginBottom: 0,
    paddingVertical: 8,
    paddingHorizontal: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  subtaskContent: {
    flex: 1,
    marginRight: 12,
  },
  subtaskTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 4,
  },
  subtaskNotes: {
    fontSize: 12,
    color: colors.secondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: "#8DA7B5",
    fontWeight: "500",
    marginLeft: 4,
  },
  metaValue: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "400",
  },
  checkboxContainerRight: {
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  completedCard: {
    // Keep same design, no opacity or background change
  },
  completedText: {
    textDecorationLine: "line-through",
  },
});
