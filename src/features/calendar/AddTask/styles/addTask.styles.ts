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
    fontSize: 40,
    fontWeight: "700",
    marginRight: 44,
  },
  headerSpacer: {
    width: 44,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 10,
  },
  content: {
    marginTop: 24,
    gap: 14,
  },
  label: {
    color: colors.secondaryText,
    fontSize: 22,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 20,
    fontWeight: "500",
  },
  optionCard: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  aiCard: {
    backgroundColor: colors.dot,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  optionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  aiIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0, 0, 0, 0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 33,
    fontWeight: "700",
  },
  optionSubtitle: {
    color: colors.secondaryText,
    fontSize: 19,
    marginTop: 2,
  },
  aiTitle: {
    color: colors.text,
    fontSize: 33,
    fontWeight: "700",
  },
  aiSubtitle: {
    color: colors.text,
    fontSize: 19,
    opacity: 0.86,
    marginTop: 2,
  },
});