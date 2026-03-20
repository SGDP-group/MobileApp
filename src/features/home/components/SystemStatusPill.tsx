import React from "react";
import { Text, View } from "react-native";
import { styles } from "../styles/home.styles";

export function SystemStatusPill() {
  return (
    <View style={styles.statusPill}>
      <View style={styles.statusDot} />
      <Text style={styles.statusText}>SYSTEM ONLINE</Text>
    </View>
  );
}
