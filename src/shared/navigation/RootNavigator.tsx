import AIBreakdownResultScreen from "@/src/features/calendar/AddTask/components/AIBreakdownResultScreen";
import { GoogleSignin, User } from "@react-native-google-signin/google-signin";
import { NavigationProp } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import AllAnalyticsScreen from "../../features/analytics/AllAnalyticsScreen";
import AnalyticsScreen from "../../features/analytics/AnalyticsScreen";
import WelcomeScreen from "../../features/auth/screens/WelcomeScreen";
import AddTaskDetailsScreen from "../../features/calendar/AddTask/components/AddTaskDetailsScreen";
import AddTaskScreen from "../../features/calendar/AddTask/components/AddTaskScreen";
import AIBreakdownScreen from "../../features/calendar/AddTask/components/AIBreakdownScreen";
import CalendarScreen from "../../features/calendar/CalendarScreen";
import HomeScreen from "../../features/home/HomeScreen";
import DeviceProvisioningScreen from "../../features/provisioning/screens/DeviceProvisioningScreen";
import { SessionData, SessionStatistics } from "../../services/analyticsService";
import { clearStoredUser, createAnalyticsUser, findOrCreateUser, getUserByEmail } from "../../services/focusFrameUserService";
import { tokenManager } from "../../utils/tokenManager";

import { setGlobalLogoutHandler } from "@utils/globalLogout";

export type RootStackParamList = {
  Welcome: undefined;
  Home: { userInfo?: any };
  Calendar: undefined;
  Analytics: undefined;
  AllMetrics: { sessionData: SessionData; sessionStatistics: SessionStatistics };
  Focus: undefined;
  AddTask: undefined;
  AddTaskDetails: undefined;
  AIBreakdownDetails: undefined;
  AIBreakdownResult: { result: any };
  DeviceProvisioning: { prefilledSsid?: string } | undefined;
  Loading: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export type RootNavigationProp = NavigationProp<RootStackParamList>;

export function RootNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoginSuccess = async (currentUser: User) => {
    try {
      const email = currentUser.user?.email;
      if (email) {
        await findOrCreateUser(email);
      }
      if (currentUser) {
        const analyticsUser = await getUserByEmail(email);
        await createAnalyticsUser(String(analyticsUser.id));
      }
      setUserInfo(currentUser);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Error during login success handler:", error);
      setUserInfo(currentUser);
      setIsLoggedIn(true);
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
            "profile",
            "email",
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/tasks",
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
    setGlobalLogoutHandler(handleLogout);
  }, []);

  const handleLogout = async () => {
    try {
      await tokenManager.clearAllTokens();
      await clearStoredUser();
      await GoogleSignin.revokeAccess();
      // await GoogleSignin.signOut();
      setUserInfo(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  

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
          <Stack.Screen name="Analytics" component={AnalyticsScreen} />
          <Stack.Screen name="AllMetrics" component={AllAnalyticsScreen} />
          <Stack.Screen name="AddTask" component={AddTaskScreen} />
          <Stack.Screen
            name="AddTaskDetails"
            component={AddTaskDetailsScreen}
          />
          <Stack.Screen
            name="AIBreakdownDetails"
            component={AIBreakdownScreen}
          />
          <Stack.Screen
            name="AIBreakdownResult"
            component={AIBreakdownResultScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DeviceProvisioning"
            options={{ headerShown: false }}
          >
            {(props) => {
              // Extract prefilledSsid from route params
              const prefilledSsid = props.route.params?.prefilledSsid;
              return (
                <DeviceProvisioningScreen
                  visible={true}
                  onClose={() => props.navigation.goBack()}
                  initialSsid={prefilledSsid}
                />
              );
            }}
          </Stack.Screen>
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
