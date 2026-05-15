import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../../context/AppContext';

export default function TabLayout() {
  const { theme } = useAppContext();

  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 12, 
        },
        tabBarStyle: { 
          backgroundColor: '#1a924e', 
          borderTopWidth: 0, 
          height: Platform.OS === 'ios' ? 100 : 85, 
          paddingTop: 12,
          elevation: 25, 
          shadowColor: '#000', 
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.3, 
          shadowRadius: 12,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
      }}
    >
      {/* 1. HOME (Scanner) */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home', 
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              // 🏠 Swapped to professional Home icons
              name={focused ? "home-variant" : "home-variant-outline"} 
              size={28} 
              color={color} 
            />
          ) 
        }} 
      />

      {/* 2. CHAT */}
      <Tabs.Screen 
        name="chat" 
        options={{ 
          title: 'AgriBot', 
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "chat-processing" : "chat-processing-outline"} 
              size={26} 
              color={color} 
            />
          ) 
        }} 
      />

      {/* 3. WIKI */}
      <Tabs.Screen 
        name="wiki" 
        options={{ 
          title: 'Wiki', 
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "sprout" : "sprout-outline"} 
              size={26} 
              color={color} 
            />
          ) 
        }} 
      />

      {/* 4. PROFILE */}
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Account', 
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "account" : "account-outline"} 
              size={28} 
              color={color} 
            />
          ) 
        }} 
      />
    </Tabs>
  );
}