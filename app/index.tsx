import { NavigationContainer } from '@react-navigation/native';
import { LoadingProvider } from '@shared/contexts/LoadingContext';
import { RootNavigator } from "@shared/navigation/RootNavigator";

export default function App() {
  return (
    <LoadingProvider>
        <RootNavigator />
    </LoadingProvider>
  );
}