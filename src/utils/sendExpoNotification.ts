import { Expo } from 'expo-server-sdk'

const expo = new Expo()

export async function sendExpoNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: any
) {
  if (!Expo.isExpoPushToken(expoPushToken)) {
    throw new Error('Invalid Expo push token')
  }
  const messages = [
    {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    },
  ]
  await expo.sendPushNotificationsAsync(messages)
}
