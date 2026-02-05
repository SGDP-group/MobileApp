import { StyleSheet, Platform } from "react-native";
import { Colors } from "@shared/theme/colors";

export const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: Colors.background },
  backgroundImage: { flex: 1, width: "100%", height: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  safeArea: { flex: 1 },

  header: {
    alignItems: "center",
    marginTop: Platform.OS === "android" ? 40 : 10,
  },
  appName: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: -40,
  },
  heroTextContainer: {
    marginBottom: 50,
    alignItems: "center",
  },
  heroTitle: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "justify",
    lineHeight: 38,
    fontFamily: Platform.OS === "ios" ? "Arial Rounded MT Bold" : "Roboto",
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
    width: "100%",
  },
  legalText: {
    color: Colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "500",
  },
  linkText: {
    color: "#aaa",
    textDecorationLine: "underline",
  },
});
