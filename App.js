import React from 'react';
import { AuthProvider } from './src/auth/AuthContext';  // adjust path if needed
import AppNavigator from './src/navigation/AppNavigator'; // your navigation stack
import Toast from 'react-native-toast-message';
import Config from 'react-native-config';

export default function App() {
  return (  
    <AuthProvider>
      <AppNavigator />
      {console.log("App Loaded")}
      {console.log("Config.NEXT_PUBLIC_BACKEND_URL:", Config.AUTH_URL)}
      <Toast />
    </AuthProvider>
  );
}
