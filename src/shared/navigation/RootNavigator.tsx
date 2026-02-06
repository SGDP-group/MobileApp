import WelcomeScreen from "@features/auth/screens/WelcomeScreen";
import CalendarScreen from "@features/calendar/CalendarScreen";
import HomeScreen from "@features/HomePage/HomeScreen";
import { GoogleSignin, User } from "@react-native-google-signin/google-signin";
import { NavigationProp } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoadingScreen } from "@shared/components/LoadingScreen";
import { tokenManager } from "@utils/tokenManager";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";

export type RootStackParamList = {
  Welcome: undefined;
  Home: { userInfo?: any };
  Calendar: undefined;
  Loading: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export type RootNavigationProp = NavigationProp<RootStackParamList>;

export function RootNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoginSuccess = (currentUser: User) => {
    try {
      setUserInfo(currentUser);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Error during login success handler:", error);
    }
  };

  useEffect(() => {
    const configureGoogleSignin = async () => {
      if (Platform.OS === "web") {
        return;
      }

      try {
        const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;
        const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS;

        if (!webClientId && !iosClientId) {
          console.error(
            "Google Client IDs not configured. Please set EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB and EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS in your .env file",
          );
          return;
        }

        GoogleSignin.configure({
          webClientId: webClientId || undefined,
          iosClientId: iosClientId || undefined,
          scopes: [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events",
          ],
          offlineAccess: true,
          forceCodeForRefreshToken: true,
          profileImageSize: 120,
        });
      } catch (error) {
        console.error("Google Sign-In Config Error:", error);
      }
    };

    const checkSignInStatus = async () => {
      try {
        const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser) {
          handleLoginSuccess(currentUser);
        }
      } catch (error) {
        console.error("Error checking sign-in status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const initializeAuth = async () => {
      await configureGoogleSignin();
      await checkSignInStatus();
    };

    initializeAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await tokenManager.clearAllTokens();
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      setUserInfo(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {isLoggedIn ? (
        <>
          <Stack.Screen name="Home">
            {(props) => (
              <HomeScreen
                {...props}
                userInfo={userInfo}
                onLogout={handleLogout}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Calendar" component={CalendarScreen} />
        </>
      ) : (
        <Stack.Screen name="Welcome">
          {(props) => (
            <WelcomeScreen {...props} onLoginSuccess={handleLoginSuccess} />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
