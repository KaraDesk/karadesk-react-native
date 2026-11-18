import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import NativeKaraDesk, { type NativeUser } from './NativeKaraDeskModule';
import type {
  Destination,
  EventMetadata,
  EventValue,
  PresentationStyle,
  User,
} from './types';

type CleanValue =
  | string
  | number
  | boolean
  | null
  | CleanValue[]
  | { [key: string]: CleanValue };

function cleanValue(value: EventValue): CleanValue | undefined {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (Array.isArray(value)) {
    return value
      .map(cleanValue)
      .filter((item): item is CleanValue => item !== undefined);
  }

  if (typeof value === 'object') {
    return cleanMetadata(value);
  }

  return undefined;
}

function cleanMetadata(metadata: EventMetadata): {
  [key: string]: CleanValue;
} {
  const clean: { [key: string]: CleanValue } = {};

  Object.entries(metadata).forEach(([key, value]) => {
    const converted = cleanValue(value);

    if (converted !== undefined) {
      clean[key] = converted;
    }
  });

  return clean;
}

export type {
  Destination,
  EventMetadata,
  EventValue,
  KaraDeskError,
  KaraDeskErrorCode,
  PresentationStyle,
  User,
} from './types';

export type InitializeOptions = {
  /** Your KaraDesk space ID, from Settings → Apps. */
  spaceId: string;
  /** The ID of your iOS app in KaraDesk. */
  iosAppId: string;
  /** The ID of your Android app in KaraDesk. */
  androidAppId: string;
};

const toNativeUser = (user: User): NativeUser => {
  const native: NativeUser = {};

  if (user.id !== undefined) {
    native.id = user.id;
  }
  if (user.email !== undefined) {
    native.email = user.email;
  }
  if (user.name !== undefined) {
    native.name = user.name;
  }
  if (user.phone !== undefined) {
    native.phone = user.phone;
  }
  if (user.avatarUrl !== undefined) {
    native.avatarUrl = user.avatarUrl;
  }
  if (user.signedUpAt !== undefined) {
    native.signedUpAt = user.signedUpAt.getTime();
  }
  if (user.userHash !== undefined) {
    native.userHash = user.userHash;
  }

  return native;
};

const KaraDesk = {
  /**
   * Connects the SDK to your KaraDesk space. Call it once, as early as possible, before anything
   * else.
   */
  initialize(options: InitializeOptions): void {
    const appId =
      Platform.OS === 'ios' ? options.iosAppId : options.androidAppId;

    NativeKaraDesk.initialize(options.spaceId, appId);
  },

  /**
   * Signs in a user of your app so their conversations follow them across devices. Call it after
   * your own sign-in, and again on each launch while the user stays signed in.
   */
  login(user: User): Promise<void> {
    return NativeKaraDesk.login(toNativeUser(user));
  },

  /** Updates details of the signed-in user. Only the fields you pass change. */
  updateUser(changes: User): Promise<void> {
    return NativeKaraDesk.updateUser(toNativeUser(changes));
  },

  /** Signs the current user out and starts a fresh anonymous visitor. */
  logout(): void {
    NativeKaraDesk.logout();
  },

  /** Shows the messenger over your app. */
  present(
    destination: Destination = { type: 'home' },
    style: PresentationStyle = 'standard'
  ): void {
    NativeKaraDesk.present(destination, style);
  },

  /** Closes the messenger if it's open. */
  dismiss(): void {
    NativeKaraDesk.dismiss();
  },

  /** Whether the messenger is on screen. */
  isPresented(): Promise<boolean> {
    return NativeKaraDesk.isPresented();
  },

  /** The number of conversations with replies the user hasn't seen yet. */
  getUnreadConversationCount(): Promise<number> {
    return NativeKaraDesk.getUnreadConversationCount();
  },

  /**
   * Calls `listener` whenever the unread conversation count changes. Returns a function that
   * stops listening.
   */
  addUnreadConversationCountListener(
    listener: (count: number) => void
  ): () => void {
    const subscription = NativeKaraDesk.onUnreadConversationCountChange(
      (event) => listener(event.count)
    );

    return () => subscription.remove();
  },

  /**
   * Whether a preview card slides up when your team replies while the messenger is closed.
   * Defaults to `true`.
   */
  setShowsInAppMessages(enabled: boolean): void {
    NativeKaraDesk.setShowsInAppMessages(enabled);
  },

  /**
   * Whether tapping a KaraDesk notification opens its conversation automatically. Defaults to
   * `true`. Set it before `initialize`.
   */
  setOpensConversationsFromNotifications(enabled: boolean): void {
    NativeKaraDesk.setOpensConversationsFromNotifications(enabled);
  },

  /**
   * Registers this device for KaraDesk push notifications. Pass the APNs device token (as a hex
   * string) on iOS, or the Firebase Cloud Messaging token on Android.
   */
  setDeviceToken(token: string): void {
    NativeKaraDesk.setDeviceToken(token);
  },

  /** Whether a push notification's data came from KaraDesk. */
  isKaraDeskPush(data: Record<string, unknown>): boolean {
    return NativeKaraDesk.isKaraDeskPush(data);
  },

  /**
   * Hands a KaraDesk push notification to the SDK. On iOS, this opens its conversation. On
   * Android, call it when a push message arrives and KaraDesk shows it. Resolves to `false` for
   * notifications that didn't come from KaraDesk.
   */
  handlePush(data: Record<string, unknown>): Promise<boolean> {
    return NativeKaraDesk.handlePush(data);
  },

  /**
   * Records something the user did in your app, like "Created project" or "Upgraded plan".
   *
   * Events show on the person's profile in KaraDesk with how many times they did it and when.
   * The native SDK saves them on the device and sends them in batches, including events tracked
   * while offline once the connection comes back. Metadata can hold text, numbers, booleans,
   * null, dates, arrays and objects.
   */
  trackEvent(name: string, metadata: EventMetadata = {}): void {
    NativeKaraDesk.trackEvent(name, cleanMetadata(metadata));
  },

  /** The version of the native KaraDesk SDK. */
  get version(): string {
    return NativeKaraDesk.getVersion();
  },
};

/** The unread conversation count, kept up to date. */
export function useUnreadConversationCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;

    KaraDesk.getUnreadConversationCount()
      .then((value) => {
        if (active) {
          setCount(value);
        }
      })
      .catch(() => undefined);

    const stop = KaraDesk.addUnreadConversationCountListener(setCount);

    return () => {
      active = false;
      stop();
    };
  }, []);

  return count;
}

export default KaraDesk;
