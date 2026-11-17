import {
  TurboModuleRegistry,
  type CodegenTypes,
  type TurboModule,
} from 'react-native';

export type NativeUser = {
  id?: string;
  email?: string;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  signedUpAt?: CodegenTypes.Double;
  userHash?: string;
};

export type NativeDestination = {
  type: string;
  id?: CodegenTypes.Double;
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
  getUnreadConversationCount(): Promise<CodegenTypes.Double>;
  setShowsInAppMessages(enabled: boolean): void;
  setOpensConversationsFromNotifications(enabled: boolean): void;
  setDeviceToken(token: string): void;
  isKaraDeskPush(data: CodegenTypes.UnsafeObject): boolean;
  handlePush(data: CodegenTypes.UnsafeObject): Promise<boolean>;
  getVersion(): string;
  readonly onUnreadConversationCountChange: CodegenTypes.EventEmitter<UnreadCountEvent>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('KaraDeskModule');
