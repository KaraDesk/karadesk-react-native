import { TurboModuleRegistry, type TurboModule } from 'react-native';
import type {
  Double,
  EventEmitter,
  UnsafeObject,
} from 'react-native/Libraries/Types/CodegenTypes';

export type NativeUser = {
  id?: string;
  email?: string;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  signedUpAt?: Double;
  userHash?: string;
};

export type NativeDestination = {
  type: string;
  id?: Double;
  message?: string;
};

export type UnreadCountEvent = {
  count: number;
};

export interface Spec extends TurboModule {
  initialize(spaceId: string, appId: string): void;
  login(user: NativeUser): Promise<void>;
  updateUser(user: NativeUser): Promise<void>;
  logout(): void;
  present(destination: NativeDestination, style: string): void;
  dismiss(): void;
  isPresented(): Promise<boolean>;
  getUnreadConversationCount(): Promise<Double>;
  setShowsInAppMessages(enabled: boolean): void;
  setOpensConversationsFromNotifications(enabled: boolean): void;
  setDeviceToken(token: string): void;
  isKaraDeskPush(data: UnsafeObject): boolean;
  handlePush(data: UnsafeObject): Promise<boolean>;
  trackEvent(name: string, metadata: UnsafeObject): void;
  getVersion(): string;
  readonly onUnreadConversationCountChange: EventEmitter<UnreadCountEvent>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('KaraDeskModule');
