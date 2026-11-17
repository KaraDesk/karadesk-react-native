# Changelog

All notable changes to the KaraDesk React Native package are documented here. This project follows [Semantic Versioning](https://semver.org).

## 1.0.1

- Works with React Native 0.76 or later. Version 1.0.0 needed React Native 0.80.

## 1.0.0

- First release. Brings the KaraDesk messenger to React Native apps by bridging the KaraDesk iOS SDK (1.1.1 or later) and Android SDK (1.1.1).
- Initialize with your space ID and an app ID for each platform, sign users in and out, and update their details. Sign-in errors have a `code`, such as `identity_verification_failed` or `network`.
- Open the messenger at its home, the list of conversations, a new conversation (optionally with a message filled in), a specific conversation, the help center or an article, with or without its tabs. Close it, or check whether it's open.
- Read the unread conversation count, listen for changes, or use the `useUnreadConversationCount()` hook.
- Register for push notifications with the APNs token on iOS or the Firebase Cloud Messaging token on Android, recognize KaraDesk notifications and hand them to the SDK. Tapping a notification opens its conversation unless you turn that off.
- Turn in-app message previews on or off.
- Requires React Native 0.80 or later with the New Architecture, iOS 17 and Android 8.0 (API 26). Works with Expo development builds.
