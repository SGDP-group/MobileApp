import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { RootNavigationProp } from "@shared/navigation/RootNavigator";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./styles/home.styles";

interface HomeScreenProps {
  userInfo?: any;
  onLogout?: () => void;
}

export default function HomeScreen({ userInfo, onLogout }: HomeScreenProps) {
  const navigation = useNavigation<RootNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to FocusFrame</Text>
      </View>

      <View style={styles.content}>
        {userInfo && (
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Hello, {userInfo.user.name}!</Text>
            <Text style={styles.email}>{userInfo.user.email}</Text>
          </View>
        )}

        <Text style={styles.subtitle}>Your Dashboard</Text>

        {/* Calendar Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Calendar")}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color="#4285F4" />
            <Text style={styles.cardTitle}>Google Calendar</Text>
          </View>
          <Text style={styles.cardDescription}>
            Manage your events and schedule
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardAction}>View Calendar →</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            More features coming soon...
          </Text>
        </View>
      </View>

      {onLogout && (
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
