'use server';

import { revalidatePath } from 'next/cache';
import { requireStaff } from '@/src/lib/auth/staff';
import { getDb } from '@/src/db';
import { isUuid } from '@/src/lib/gallery/types';
import { clearCollageSlot, setCollageSlot } from '@/src/lib/home/collage';
import { isCollageSlot } from '@/src/lib/home/collage-slots';

function changed() {
  revalidatePath('/admin/collage');
  revalidatePath('/');
}

export async function pickCollageWork(formData: FormData) {
  await requireStaff('admin');
  const slot = String(formData.get('slot') ?? '');
  const artworkId = String(formData.get('artworkId') ?? '');
  if (!isCollageSlot(slot) || !isUuid(artworkId)) return;
  await setCollageSlot(getDb(), slot, artworkId);
  changed();
}

export async function resetCollageSlot(formData: FormData) {
  await requireStaff('admin');
  const slot = String(formData.get('slot') ?? '');
  if (!isCollageSlot(slot)) return;
  await clearCollageSlot(getDb(), slot);
  changed();
}
