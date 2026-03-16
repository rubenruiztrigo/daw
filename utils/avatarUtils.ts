
export const DEFAULT_AVATAR = '/img/imagen-por-defecto.png';

/**
 * Returns a safe avatar URL.
 * Replaces AI-generated (Dicebear) or Base64 avatars with the default avatar.
 */
export const getSafeAvatar = (avatar: string | null | undefined): string => {
  if (!avatar) return DEFAULT_AVATAR;
  if (avatar.includes('dicebear')) return DEFAULT_AVATAR;
  return avatar;
};
