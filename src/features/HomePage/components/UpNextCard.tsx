import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { formatTaskLead, formatTaskTimestamp } from "../home.helpers";
import type { HomeUpNextItem } from "../home.tasks";
import { styles } from "../styles/home.styles";

interface UpNextCardProps {
  item: HomeUpNextItem;
}

export function UpNextCard({ item }: UpNextCardProps) {
  const navigation = useNavigation<RootNavigationProp>();

  if (item.type === "loading") {
    return (
      <View style={styles.eventCard}>
        <Text style={styles.eventLead}>LOADING</Text>
        <Text style={styles.eventTitle}>Fetching tasks...</Text>
        <View style={styles.eventMeta}>
          <Ionicons name="time-outline" size={14} color="#8DA7B5" />
          <Text style={styles.eventMetaText}>Please wait</Text>
        </View>
      </View>
    );
  }

  if (item.type === "empty") {
    return (
      <View style={styles.eventCard}>
        <Text style={styles.eventLead}>NO TASKS</Text>
        <Text style={styles.eventTitle}>No tasks in your queue</Text>
        <View style={styles.eventMeta}>
          <Ionicons name="checkmark-circle-outline" size={14} color="#8DA7B5" />
          <Text style={styles.eventMetaText}>Create your first task</Text>
        </View>
        <TouchableOpacity
          style={styles.eventActionButton}
          onPress={() => navigation.navigate("Calendar")}
        >
          <Text style={styles.eventActionText}>Open Task Queue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.eventCard}>
      <Text style={styles.eventLead}>{formatTaskLead(item.task)}</Text>
      <Text style={styles.eventTitle}>{item.task.name}</Text>
      <View style={styles.eventMeta}>
        <Ionicons name="document-text-outline" size={14} color="#8DA7B5" />
        <Text style={styles.eventMetaText}>
          Updated {formatTaskTimestamp(item.task.updatedAt)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.eventActionButton}
        onPress={() => navigation.navigate("Calendar")}
      >
        <Text style={styles.eventActionText}>Open Task Queue</Text>
      </TouchableOpacity>
    </View>
  );
}
