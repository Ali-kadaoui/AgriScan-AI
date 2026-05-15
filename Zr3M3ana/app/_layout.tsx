import { Stack } from 'expo-router';
import { AppProvider } from '../context/AppContext';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Main tabs container */}
        <Stack.Screen name="(tabs)" />

        {/* 🌟 The Transparent Scanner Window */}
        <Stack.Screen 
      name="scanner" 
         options={{ 
          presentation: 'transparentModal', 
          animation: 'slide_from_bottom', // 👈 Change to 'fade' so the backdrop doesn't slide
          animationDuration: 200, // 👈 Increase speed (Lower = Faster)
          headerShown: false 
        }}
/>

        {/* Auth & Other Screens */}
        <Stack.Screen name="index" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="result" />
        <Stack.Screen name="plant_detail" />
      </Stack>
    </AppProvider>
  );
}