import { colors } from "@shared/theme/colors";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: "#8FA3AD",
    fontWeight: "500",
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  cardsRow: {
    paddingBottom: 10,
    paddingRight: 10,
  },
  analyticsCard: {
    width: 260,
    borderRadius: 20,
    padding: 20,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#16303A",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 12,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#8FA3AD",
    marginBottom: 8,
  },
  cardExtraInfo: {
    fontSize: 12,
    color: "#54D2FF",
    fontWeight: "500",
  },
  scrollIndicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24,
    gap: 8,
  },
  scrollDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2A3B43",
  },
  scrollDotActive: {
    width: 20,
    backgroundColor: "#54D2FF",
  },
  insightsContainer: {
    gap: 12,
  },
  insightWrapper: {
    marginBottom: 8,
  },
  insightCard: {
    backgroundColor: "#1A2429",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#23343C",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
});
