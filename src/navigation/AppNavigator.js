import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import RedirectHandlerScreen from '../screens/RedirectHandlerScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import SoulTestScreen from '../screens/SoultestScreen';
import SoulTestScreenAI from '../screens/SoulTestScreenAI';
import LyfariVirtualDashboard from '../screens/LyfariVirtualDashboard';

// Placeholder screens - you'll create these later
const LyfariMainScreen = () => null;

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="RedirectHandler" component={RedirectHandlerScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        <Stack.Screen name="SoulTest" component={SoulTestScreen} />
        <Stack.Screen name="LyfariMain" component={LyfariMainScreen} />
        <Stack.Screen name="Lyfari" component={LyfariMainScreen} />
        <Stack.Screen name="SoulTestAI" component={SoulTestScreenAI} />
        <Stack.Screen name="LyfariVirtualDashboard" component={LyfariVirtualDashboard} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
