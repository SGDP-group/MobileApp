import { Stack } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export function ErrorBoundary({ error }: { error: Error }) {
  useEffect(() => {
    console.error("Root Layout Error:", error);
    console.error("Error Stack:", error.stack);
  }, [error]);

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <Text style={styles.errorStack}>{error.stack}</Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  errorStack: {
    fontSize: 12,
    color: "#666",
    marginTop: 10,
  },
});
