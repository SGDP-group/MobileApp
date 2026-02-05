import { NavigationProp } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useState } from "react";
import WelcomeScreen from "../../features/auth/screens/WelcomeScreen";
import HomeScreen from "../../features/HomePage/HomeScreen";

export type RootStackParamList = {
  Welcome: undefined;
  Home: { userInfo?: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export type RootNavigationProp = NavigationProp<RootStackParamList>;

export function RootNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  const handleLoginSuccess = (info: any) => {
    setUserInfo(info);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setUserInfo(null);
    setIsLoggedIn(false);
  };

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
