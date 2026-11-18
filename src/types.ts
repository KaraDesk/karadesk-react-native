export type User = {
  /** Your own identifier for the user. A user needs an `id` or an `email`. */
  id?: string;
  email?: string;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  /** When the user signed up for your app. */
  signedUpAt?: Date;
  /**
   * The HMAC-SHA256 of the user's `id` (or `email` when there is no id), computed on your server
   * with your identity verification secret.
   */
  userHash?: string;
};

/** A place in the messenger to open. */
export type Destination =
  | { type: 'home' }
  | { type: 'messages' }
  | { type: 'newConversation'; message?: string }
  | { type: 'conversation'; id: number }
  | { type: 'helpCenter' }
  | { type: 'article'; id: number };

/**
 * `standard` shows the full messenger with its tabs. `standalone` shows only the destination,
 * like a single conversation or the help center.
 */
export type PresentationStyle = 'standard' | 'standalone';

export type KaraDeskErrorCode =
  | 'not_initialized'
  | 'not_logged_in'
  | 'invalid_configuration'
  | 'identity_verification_failed'
  | 'unavailable'
  | 'network'
  | 'server'
  | 'unexpected_response';

/** Errors from `login` and `updateUser` carry one of these codes in `error.code`. */
export type KaraDeskError = Error & { code: KaraDeskErrorCode };

export type EventValue =
  | string
  | number
  | boolean
  | null
  | Date
  | EventValue[]
  | { [key: string]: EventValue };

export type EventMetadata = Record<string, EventValue>;
