// src/navigation/AppNavigator.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import RedirectHandlerScreen from '../screens/RedirectHandlerScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import SoulTestScreen from '../screens/SoultestScreen';
import SoulTestScreenAI from '../screens/SoulTestScreenAI';
import LyfariVirtualDashboard from '../screens/LyfariVirtualDashboard';
import ProfilePage from '../screens/ProfilePage'; 
import FeedPage from '../screens/FeedPage';
import ExplorePage from '../screens/ExplorePage';
import NotificationsPage from '../screens/NotificationsPage';
import WhispersPage from '../screens/WhispersPage';
import SoulChatPage from '../screens/SoulChatPage';

// ✅ Define all route parameter types
export type RootStackParamList = {
  Home: undefined;
  SignIn: undefined;
  SignUp: undefined;
  RedirectHandler: undefined;
  VerifyEmail: { email?: string };
  ProfileSetup: undefined;
  SoulTest: undefined;
  Lyfari: undefined;
  SoulTestAI: undefined;
  LyfariVirtualDashboard: undefined;
  Profile: { userId: string }; // ✅ Dynamic profile route
  Explore : undefined;
  Notifications : undefined;
  Whispers : undefined;
  SoulChat : undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { status } = useAuth();

  // ✅ NEW: Show loading while checking auth
  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={status === 'authenticated' ? 'Lyfari' : 'Home'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="RedirectHandler" component={RedirectHandlerScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="SoulTest" component={SoulTestScreen} />
        <Stack.Screen name="Lyfari" component={FeedPage} />
        <Stack.Screen name="SoulTestAI" component={SoulTestScreenAI} />
        <Stack.Screen name="LyfariVirtualDashboard" component={LyfariVirtualDashboard} />
        <Stack.Screen name="Explore" component={ExplorePage} />
        <Stack.Screen name="Notifications" component={NotificationsPage} />
        <Stack.Screen name="Whispers" component={WhispersPage} />
        <Stack.Screen name="SoulChat" component={SoulChatPage} />
        {/* ✅ Dynamic Profile Route */}
        <Stack.Screen 
          name="Profile" 
          component={ProfilePage}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
