import { StyleSheet } from "react-native";
import { colors } from "@shared/theme/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  userInfo: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cardAction: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4285F4",
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: "center",
  },
  logoutButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    backgroundColor: colors.error,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
