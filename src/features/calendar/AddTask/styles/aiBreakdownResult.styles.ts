import { colors } from "@shared/theme/colors";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border || "#E0E0E0",
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.secondaryText,
  },

  // Main Task
  mainTaskContainer: {
    backgroundColor: colors.primary + "15",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  mainTaskHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  mainStatusCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  mainTaskInfo: {
    flex: 1,
  },
  mainTaskTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  mainTaskStatus: {
    fontSize: 12,
    color: colors.secondaryText,
    textTransform: "capitalize",
  },

  // Stats
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingVertical: 12,
  },
  statItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border || "#E0E0E0",
  },

  // Subtasks Section
  subtasksSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  subtasksContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border || "#E0E0E0",
    overflow: "hidden",
  },

  // Subtask Item
  subtaskItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingRight: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || "#F0F0F0",
  },
  subtaskLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  expandIcon: {
    marginRight: 8,
  },
  expandIconPlaceholder: {
    width: 20,
    marginRight: 8,
  },
  statusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  subtaskContent: {
    flex: 1,
  },
  subtaskDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  completedText: {
    color: colors.secondaryText,
    textDecorationLine: "line-through",
  },
  subtaskRight: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginLeft: 8,
  },
  estimatedTime: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },

  // Footer
  footer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.background,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
});
