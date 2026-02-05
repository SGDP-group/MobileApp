import WelcomeScreen from "@features/auth/screens/WelcomeScreen";
import HomeScreen from "@features/HomePage/HomeScreen";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { NavigationProp } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoadingScreen } from "@shared/components/LoadingScreen";
import React, { useEffect, useState } from "react";

export type RootStackParamList = {
  Welcome: undefined;
  Home: { userInfo?: any };
  Loading: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export type RootNavigationProp = NavigationProp<RootStackParamList>;

export function RootNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSignInStatus = async () => {
      try {
        const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser) {
          handleLoginSuccess(currentUser);
        }
      if(!currentUser){
        setIsLoggedIn(false);
      }
      } catch (error) {
        console.error("Error checking sign-in status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSignInStatus();
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
        <Stack.Screen name="Home">
          {(props) => (
            <HomeScreen
              {...props}
              userInfo={userInfo}
              onLogout={handleLogout}
            />
          )}
        </Stack.Screen>
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
