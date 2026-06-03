import { Platform } from 'react-native';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';

// Register FCM token for the current user in Firestore
export const registerPushToken = async (uid: string): Promise<void> => {
  if (Platform.OS === 'web') return;

  try {
    // Dynamically import expo-notifications to avoid web crashes
    const Notifications = await import('expo-notifications');

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    // Get Expo push token (works with FCM under the hood)
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    });

    const token = tokenData.data;
    if (!token) return;

    // Save token to Firestore user document
    await updateDoc(doc(db, 'users', uid), {
      fcmTokens: arrayUnion(token),
    });

    // Configure notification handler for foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (error) {
    console.warn('Push notification setup failed:', error);
  }
};

export const sendLocalNotification = async (title: string, body: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch (error) {
    console.warn('Local notification failed:', error);
  }
};
