import { Stack } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
// Import your LoadingProvider here
import { LoadingProvider } from "@shared/contexts/LoadingContext";

export function ErrorBoundary({ error }: { error: Error }) {
  useEffect(() => {
    console.error("Root Layout Error:", error);
  }, [error]);

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    // 1. Wrap the entire Stack with the LoadingProvider
    <LoadingProvider>
      {/* 2. Expo Router provides the NavigationContainer automatically */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </LoadingProvider>
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
    textAlign: "center",
  },
});