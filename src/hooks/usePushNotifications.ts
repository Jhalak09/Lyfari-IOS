// src/hooks/usePushNotifications.ts
import { useEffect } from 'react';
import { pushNotificationService } from '../services/PushNotificationService';

export const usePushNotifications = () => {
  useEffect(() => {
    // Initialize push notifications when app starts
    pushNotificationService.initialize();
  }, []);
};
