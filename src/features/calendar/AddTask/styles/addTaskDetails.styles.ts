import { colors } from "@shared/theme/colors";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginRight: 44,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 10,
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    color: colors.secondaryText,
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 16,
  },
  pickerInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerInputText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  textArea: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timeInput: {
    flex: 1,
  },
  subtaskCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: colors.cardBackground,
  },
  subtaskHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  subtaskTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  subtaskDescriptionInput: {
    minHeight: 74,
    marginTop: 8,
  },
  subtaskEstimatedTimeInput: {
    marginTop: 8,
  },
  removeSubtaskButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  removeSubtaskText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  addSubtaskButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addSubtaskText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  helperText: {
    color: colors.secondaryText,
    fontSize: 12,
    marginTop: 6,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 12,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: colors.dot,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
});
