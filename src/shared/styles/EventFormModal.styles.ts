import { colors } from "@shared/theme/colors";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  cancelButton: {
    color: "#8DA7B5",
    fontWeight: "500",
    fontSize: 16,
  },
  saveButton: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#23343C",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: "#1A2429",
  },
  pickerRow: {
    flexDirection: "row",
    gap: 8,
  },
  pickerInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
  },
  textArea: {
    textAlignVertical: "top",
    minHeight: 100,
    paddingTop: 10,
  },
  hint: {
    fontSize: 12,
    color: "#8DA7B5",
    marginTop: 6,
  },
});
