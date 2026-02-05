import WelcomeScreen from "@features/auth/screens/WelcomeScreen";
import CalendarScreen from "@features/calendar/CalendarScreen";
import HomeScreen from "@features/HomePage/HomeScreen";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { NavigationProp } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoadingScreen } from "@shared/components/LoadingScreen";
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

  useEffect(() => {
    const configureGoogleSignin = async () => {
      if (Platform.OS === "web") {
        return;
      }

      try {
        GoogleSignin.configure({
          webClientId:
            "320294722121-aer10knc1tfkaqd7r6l4glan2l6t6er6.apps.googleusercontent.com",
          scopes: [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events",
            // "https://www.googleapis.com/auth/drive.readonly",
          ],
          offlineAccess: true,
          forceCodeForRefreshToken: true,
          iosClientId:
            "320294722121-16em0d7qgg1kjkui1dn6vdur3n0euelg.apps.googleusercontent.com",
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
        if (!currentUser) {
          setIsLoggedIn(false);
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

  const handleLoginSuccess = (info: any) => {
    setUserInfo(info);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
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
