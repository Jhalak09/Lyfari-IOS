// // src/services/PushNotificationService.ts
// import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
// import { Platform } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Config from 'react-native-config';

// class PushNotificationService {
//   private isInitialized = false;

//   async initialize() {
//     if (this.isInitialized) return;

//     try {
//       // Request user permission
//       const authStatus = await messaging().requestPermission();
//       const enabled =
//         authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//         authStatus === messaging.AuthorizationStatus.PROVISIONAL;

//       if (!enabled) {
//         console.log('❌ Notification permission denied');
//         return;
//       }

//       console.log('✅ Notification permission granted');

//       // Get FCM token and send to backend
//       const fcmToken = await this.getFCMToken();
//       if (fcmToken) {
//         await this.sendTokenToBackend(fcmToken);
//       }

//       // Handle foreground messages
//       this.setupForegroundHandler();

//       // Handle background messages
//       this.setupBackgroundHandler();

//       // Handle notification opened
//       this.setupNotificationOpenedHandler();

//       this.isInitialized = true;
//       console.log('✅ Push notification service initialized');
//     } catch (error) {
//       console.error('❌ Error initializing push notifications:', error);
//     }
//   }

//   private async getFCMToken(): Promise<string | null> {
//     try {
//       const token = await messaging().getToken();
//       console.log('📱 FCM Token:', token);
//       return token;
//     } catch (error) {
//       console.error('Error getting FCM token:', error);
//       return null;
//     }
//   }

//   private async sendTokenToBackend(token: string): Promise<void> {
//     try {
//       const authToken = await AsyncStorage.getItem('token');
//       if (!authToken) {
//         console.log('⚠️ No auth token, skipping FCM token upload');
//         return;
//       }

//       const response = await fetch(
//         `${Config.NEXT_PUBLIC_BACKEND_URL}/notifications/fcm-token`,
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${authToken}`,
//           },
//           body: JSON.stringify({ fcmToken: token, platform: Platform.OS }),
//         }
//       );

//       if (response.ok) {
//         console.log('✅ FCM token sent to backend');
//       } else {
//         console.warn('⚠️ Failed to send FCM token to backend');
//       }
//     } catch (error) {
//       console.error('Error sending FCM token to backend:', error);
//     }
//   }

//   private setupForegroundHandler(): void {
//     // Handle messages when app is in foreground
//     messaging().onMessage(async (message: FirebaseMessagingTypes.RemoteMessage) => {
//       console.log('📬 Foreground notification received:', message);
      
//       // Firebase automatically displays notification on Android
//       // Even in foreground (if notification payload is present)
      
//       // You can add custom handling here if needed
//       if (message.notification) {
//         console.log('Title:', message.notification.title);
//         console.log('Body:', message.notification.body);
//       }
//     });
//   }

//   private setupBackgroundHandler(): void {
//     // Handle background messages
//     messaging().setBackgroundMessageHandler(
//       async (message: FirebaseMessagingTypes.RemoteMessage) => {
//         console.log('📨 Background notification received:', message);
//         return Promise.resolve();
//       }
//     );
//   }

//   private setupNotificationOpenedHandler(): void {
//     // When user taps notification
//     messaging().onNotificationOpenedApp(
//       (message: FirebaseMessagingTypes.RemoteMessage | null) => {
//         if (message) {
//           console.log('📲 Notification tapped (app in background):', message);
//           this.handleNotificationTap(message);
//         }
//       }
//     );

//     // Check if app was opened from notification (killed state)
//     messaging()
//       .getInitialNotification()
//       .then((message: FirebaseMessagingTypes.RemoteMessage | null) => {
//         if (message) {
//           console.log('🚀 App opened from notification (killed state):', message);
//           this.handleNotificationTap(message);
//         }
//       });
//   }

//   private handleNotificationTap(
//     message: FirebaseMessagingTypes.RemoteMessage
//   ): void {
//     // Handle notification tap - navigate based on notification data
//     const notificationType = message.data?.type;
//     const metadata = message.data?.metadata;

//     console.log('🎯 Handling notification tap:', { notificationType, metadata });

//     // You can add navigation logic here later
//     // Example: navigationRef.current?.navigate('NotificationsPage');
//   }
// }

// export const pushNotificationService = new PushNotificationService();
