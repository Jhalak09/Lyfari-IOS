import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/auth/AuthContext';
import { NotificationsProvider } from './src/contexts/NotificationsContext';
import Config from 'react-native-config';
import { Buffer } from 'buffer';

// import { usePushNotifications } from './src/hooks/usePushNotifications';

console.log('🚀 App.tsx loaded');
console.log('✅ NotificationsProvider:', NotificationsProvider);
console.log('✅ AuthProvider:', AuthProvider);
console.log('✅ AppNavigator:', AppNavigator);
console.log('🔧 Backend URL:', Config.NEXT_PUBLIC_BACKEND_URL);
console.log('🔧 Auth URL:', Config.AUTH_URL);
if (typeof global.atob === 'undefined') {
  // @ts-ignore
  global.atob = (data: string) => Buffer.from(data, 'base64').toString('binary');
}

function App() {
  // usePushNotifications();

  console.log('🎨 App component rendering');
  
  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000" 
        translucent 
      />
      
      {/* Notifications Context - Must be outermost for WebSocket */}
      <NotificationsProvider>
        {/* Auth Context - Handles authentication */}
        <AuthProvider>
          {/* Navigation Stack - All screens */}
          <AppNavigator />

          
          {/* Toast Notifications - Global */}
          <Toast />
        </AuthProvider>
      </NotificationsProvider>
    </SafeAreaProvider>
  );
}

export default App;
