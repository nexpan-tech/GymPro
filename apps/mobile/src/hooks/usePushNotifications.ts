import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerPushToken } from '../api/notification.api';
import { useNotificationStore } from '../stores/notification.store';
import type { Notification } from '../types/notification.types';

export interface PushNotificationHook {
  expoPushToken: string | null;
  permissionGranted: boolean;
  isRegistered: boolean;
}

// SDK 54 handler shape: shouldShowBanner / shouldShowList replace shouldShowAlert.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Requests notification permission, registers the Expo push token with the
 * backend (POST /push/register-token), and forwards foreground notifications
 * into the in-memory notification store. Backgrounded/tapped notifications are
 * delivered by the OS; deep-link routing can be layered on the response
 * listener later.
 */
export function usePushNotifications(): PushNotificationHook {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const receivedSub = useRef<ReturnType<
    typeof Notifications.addNotificationReceivedListener
  > | null>(null);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      const settings = await Notifications.getPermissionsAsync();
      let status = settings.status;
      if (status !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        status = req.status;
      }

      const granted = status === 'granted';
      if (!mounted) return;
      setPermissionGranted(granted);
      if (!granted) return;

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        if (!mounted) return;
        setExpoPushToken(tokenData.data);

        const platform = (Platform.OS === 'ios' ? 'ios' : 'android') as
          | 'ios'
          | 'android';
        await registerPushToken(tokenData.data, platform);
        if (mounted) setIsRegistered(true);
      } catch {
        // Token fetch requires a projectId / dev build; ignore in Expo Go.
      }
    }

    void setup();

    receivedSub.current = Notifications.addNotificationReceivedListener(
      (event) => {
        const content = event.request.content;
        addNotification({
          id: event.request.identifier,
          userId: '',
          title: content.title ?? '',
          body: content.body ?? '',
          type: (content.data?.type as string) ?? 'general',
          isRead: false,
          data: (content.data as Record<string, unknown> | null) ?? null,
          createdAt: new Date().toISOString(),
        } satisfies Notification);
      },
    );

    return () => {
      mounted = false;
      receivedSub.current?.remove();
    };
  }, [addNotification]);

  return { expoPushToken, permissionGranted, isRegistered };
}
