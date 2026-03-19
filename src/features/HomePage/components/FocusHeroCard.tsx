import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Text, View } from "react-native";
import { styles } from "../styles/home.styles";

export function FocusHeroCard() {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroGlow} />
      <Text style={styles.heroTitle}>Ready to Focus</Text>

      <View style={styles.heroMetaRow}>
        <Ionicons name="time-outline" size={16} color="#54D2FF" />
        <Text style={styles.heroMetaText}>Clock: Connected</Text>
      </View>

      <View style={styles.heroMetaRow}>
        <Ionicons name="home-outline" size={16} color="#54D2FF" />
        <Text style={styles.heroMetaText}>Door: Connected</Text>
      </View>
    </View>
  );
}
