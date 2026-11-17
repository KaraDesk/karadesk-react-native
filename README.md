# @karadesk/karadesk-react-native

The KaraDesk messenger for React Native. This package bridges the native [KaraDesk iOS SDK](https://github.com/KaraDesk/karadesk-ios) and [KaraDesk Android SDK](https://github.com/KaraDesk/karadesk-android), so your app gets the same messenger, help center, Kara AI agent and push notifications as a native app.

## Requirements

- React Native 0.76 or later, with the New Architecture (the default since 0.76)
- iOS 17 or later
- Android 8.0 (API 26) or later
- Expo: works in development builds and with `expo prebuild`. It doesn't run in Expo Go, because it includes native code.

## Installation

```sh
npm install @karadesk/karadesk-react-native
```

or

```sh
yarn add @karadesk/karadesk-react-native
```

### iOS

Set your deployment target to iOS 17 in `ios/Podfile`:

```ruby
platform :ios, '17.0'
```

Then install pods:

```sh
cd ios && pod install
```

The KaraDesk iOS SDK is added to your project with Swift Package Manager automatically during `pod install`.

### Android

Set `minSdkVersion` to at least 26 in `android/build.gradle`. The KaraDesk Android SDK comes from Maven Central, which React Native projects include by default.

### Expo

Set the minimum versions with [`expo-build-properties`](https://docs.expo.dev/versions/latest/sdk/build-properties/):

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": { "deploymentTarget": "17.0" },
          "android": { "minSdkVersion": 26 }
        }
      ]
    ]
  }
}
```

Then create a development build with `npx expo run:ios` or `npx expo run:android`.

## Usage

### Initialize

Initialize KaraDesk once, as early as possible. Find your space ID and app IDs in KaraDesk under **Settings → Apps**.

```tsx
import KaraDesk from '@karadesk/karadesk-react-native';

KaraDesk.initialize({
  spaceId: 'your-space-id',
  iosAppId: 'your-ios-app-id',
  androidAppId: 'your-android-app-id',
});
```

### Open the messenger

```tsx
KaraDesk.present();
KaraDesk.present({ type: 'messages' });
KaraDesk.present({ type: 'newConversation', message: 'I need help with my order' });
KaraDesk.present({ type: 'conversation', id: 42 });
KaraDesk.present({ type: 'article', id: 7 });
KaraDesk.present({ type: 'helpCenter' }, 'standalone');
```

`standard` (the default) shows the full messenger with its tabs. `standalone` shows only the destination.

Close it with `KaraDesk.dismiss()`, and check whether it's open with `await KaraDesk.isPresented()`.

### Sign users in

When someone signs in to your app, sign them in to KaraDesk too, so their conversations follow them across devices. Call `login` again on each launch while they stay signed in.

```tsx
try {
  await KaraDesk.login({
    id: user.id,
    email: user.email,
    name: user.name,
    userHash: user.karaDeskHash,
  });
} catch (error) {
  console.warn(error.code, error.message);
}
```

If your app requires identity verification, pass `userHash`, the HMAC-SHA256 of the user's ID (or email when there's no ID), computed on your server with your identity verification secret.

Update details later with `KaraDesk.updateUser({ name: 'New name' })`, and call `KaraDesk.logout()` when they sign out.

Errors have a `code`: `not_initialized`, `not_logged_in`, `invalid_configuration`, `identity_verification_failed`, `unavailable`, `network`, `server` or `unexpected_response`.

### Unread conversations

```tsx
import { useUnreadConversationCount } from '@karadesk/karadesk-react-native';

function HelpButton() {
  const unread = useUnreadConversationCount();

  return <Badge count={unread} onPress={() => KaraDesk.present()} />;
}
```

Outside React, use `await KaraDesk.getUnreadConversationCount()` or `KaraDesk.addUnreadConversationCountListener(listener)`, which returns a function that stops listening.

### In-app messages

When your team replies while the messenger is closed, a preview card slides up from the bottom of your app. Turn it off with:

```tsx
KaraDesk.setShowsInAppMessages(false);
```

## Push notifications

KaraDesk sends a push notification when your team replies while the user is away. Add your APNs key and Firebase service account in KaraDesk under **Settings → Apps**, then pass the device token to KaraDesk.

KaraDesk never asks for notification permission itself. Ask when it makes sense in your app.

### With Expo Notifications

```tsx
import * as Notifications from 'expo-notifications';

const { data: token } = await Notifications.getDevicePushTokenAsync();
KaraDesk.setDeviceToken(token);
```

On iOS this is the APNs device token, and on Android the Firebase Cloud Messaging token.

### With React Native Firebase

```tsx
import messaging from '@react-native-firebase/messaging';

KaraDesk.setDeviceToken(await messaging().getToken());

messaging().onMessage(async (message) => {
  if (KaraDesk.isKaraDeskPush(message.data ?? {})) {
    await KaraDesk.handlePush(message.data ?? {});
  }
});
```

On iOS, pass the APNs token instead (`await messaging().getAPNSToken()`).

### Opening conversations from notifications

Tapping a KaraDesk notification opens its conversation automatically. To handle taps yourself, turn this off before `initialize` and call `KaraDesk.handlePush(data)` with the notification's data:

```tsx
KaraDesk.setOpensConversationsFromNotifications(false);
```

## API

| Method | Description |
| --- | --- |
| `initialize({ spaceId, iosAppId, androidAppId })` | Connects to your KaraDesk space. |
| `login(user)` | Signs in a user. Returns a promise. |
| `updateUser(changes)` | Updates the signed-in user. Returns a promise. |
| `logout()` | Signs the user out and starts a fresh visitor. |
| `present(destination?, style?)` | Opens the messenger. |
| `dismiss()` | Closes the messenger. |
| `isPresented()` | Whether the messenger is open. Returns a promise. |
| `getUnreadConversationCount()` | The unread conversation count. Returns a promise. |
| `addUnreadConversationCountListener(listener)` | Listens for unread count changes. |
| `useUnreadConversationCount()` | A hook with the unread count, kept up to date. |
| `setShowsInAppMessages(enabled)` | Turns in-app message previews on or off. |
| `setOpensConversationsFromNotifications(enabled)` | Turns automatic notification handling on or off. |
| `setDeviceToken(token)` | Registers the device for push notifications. |
| `isKaraDeskPush(data)` | Whether a notification came from KaraDesk. |
| `handlePush(data)` | Hands a KaraDesk notification to the SDK. Returns a promise. |
| `version` | The version of the native KaraDesk SDK. |

## Documentation

Guides for every platform are at [docs.karadesk.com](https://docs.karadesk.com).

## License

MIT
