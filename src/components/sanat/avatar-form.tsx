import { ArtworkPhotoInput } from '@/src/components/artwork/artwork-photo-input';
import { ArtistAvatar } from '@/src/components/sanat/artist-avatar';
import { AVATAR_SIDE } from '@/src/lib/sellers/avatar';
import { SubmitButton } from '@/src/components/form/submit-button';

// An artist's photo with "upload" and "remove". `userId` goes along for the
// admin's form (the cabinet's action knows whose photo it is).
export function AvatarForm({
  action,
  name,
  url,
  userId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  name: string;
  url: string | null;
  userId?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-5">
      <ArtistAvatar name={name} url={url} />
      <form action={action} className="grid min-w-0 flex-1 gap-2">
        {userId && <input type="hidden" name="userId" value={userId} />}
        <ArtworkPhotoInput required name="avatar" maxSide={AVATAR_SIDE} />
        <div className="flex flex-wrap gap-2">
          <SubmitButton variant="outline">
            Загрузить фото
          </SubmitButton>
        </div>
      </form>
      {url && (
        <form action={action}>
          {userId && <input type="hidden" name="userId" value={userId} />}
          <input type="hidden" name="remove" value="1" />
          <SubmitButton variant="ghost">
            Убрать фото
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
