import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { AuthProvider } from './auth-context';
import { UserProvider } from './UserContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider } from './ThemeContext'; // 👈 تم خودت
import UpdateChecker from './UpdateChecker'; // 👈 آپدیت اوتومات

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    // در رندر:
    <AuthProvider>
      <ThemeProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
          <UpdateChecker />
        </NavigationThemeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}