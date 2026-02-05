import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./home.styles";

interface HomeScreenProps {
  userInfo?: any;
  onLogout?: () => void;
}

export default function HomeScreen({ userInfo, onLogout }: HomeScreenProps) {
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
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Dashboard content coming soon...
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
