// The artist profile fields, shared by the seller application and the profile
// editor: display name and bio are required, the Telegram contact is optional.
export const MAX_DISPLAY_NAME_LENGTH = 200;
export const MAX_BIO_LENGTH = 2000;

export type SellerProfileInput = { displayName: string; bio: string; telegramContact?: string };

// Returns the trimmed fields, or null when they are missing or too long.
export function parseSellerProfileForm(formData: FormData): SellerProfileInput | null {
  const displayName = String(formData.get('displayName') ?? '').trim();
  const bio = String(formData.get('bio') ?? '').trim();
  const telegramContactRaw = formData.get('telegramContact');
  const telegramContact =
    typeof telegramContactRaw === 'string' && telegramContactRaw.trim() ? telegramContactRaw.trim() : undefined;

  if (!displayName || !bio || displayName.length > MAX_DISPLAY_NAME_LENGTH || bio.length > MAX_BIO_LENGTH) {
    return null;
  }
  return { displayName, bio, telegramContact };
}
