import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/home.styles";
import { getFormattedDate, getGreeting } from "../utils/home.helpers";

interface HomeHeaderProps {
  currentDate: Date;
  userName: string;
  avatarUri?: string;
  onOpenScanner: () => void;
  // onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export function HomeHeader({
  currentDate,
  userName,
  avatarUri,
  onOpenScanner,
  // onOpenNotifications,
  onOpenProfile,
}: HomeHeaderProps) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.dateText}>{getFormattedDate(currentDate)}</Text>
        <Text style={styles.title}>
          {getGreeting(currentDate)}, {userName}
        </Text>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.iconButton} onPress={onOpenScanner}>
  {/* Changed icon name to reflect 'Add Device' or 'Setup' */}
  <Ionicons name="wifi" size={22} color="#E5F7FF" />
</TouchableOpacity>
{/* 
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onOpenNotifications}
        >
          <Ionicons name="notifications-outline" size={20} color="#E5F7FF" />
        </TouchableOpacity> */}

        <TouchableOpacity style={styles.avatarCircle} onPress={onOpenProfile}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={18} color="#0B1A20" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
