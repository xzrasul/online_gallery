import { Field } from '@/src/components/form/field';
import { NativeSelect } from '@/src/components/form/native-select';
import { ArtworkImage } from '@/src/components/artwork/artwork-image';
import { ArtworkPhotoInput } from '@/src/components/artwork/artwork-photo-input';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';

type Option = { id: string; name: string };
type Defaults = {
  title: string;
  description: string;
  price: number;
  heightCm: number;
  widthCm: number;
  categoryId: string;
  techniqueId: string;
  imageUrl: string;
};

export function ArtworkForm({
  action,
  categories,
  techniques,
  submitLabel,
  imageLabel,
  imageRequired,
  defaults,
  error,
}: {
  action: (formData: FormData) => void | Promise<void>;
  categories: Option[];
  techniques: Option[];
  submitLabel: string;
  imageLabel: string;
  imageRequired: boolean;
  defaults?: Defaults;
  error?: string;
}) {
  return (
    <>
      {error === 'invalid' && (
        <p
          role="alert"
          className="mt-4 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          Проверьте, что все поля заполнены корректно.
        </p>
      )}
      {error === 'image' && (
        <p
          role="alert"
          className="mt-4 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          Не удалось прочитать фото. Сохраните его в формате JPG или PNG и загрузите снова.
        </p>
      )}
      <form action={action} className="mt-6 grid max-w-xl grid-cols-[minmax(0,1fr)] gap-5 rounded-sm border border-border bg-card p-5 sm:p-6">
        <Field label="Название">
          <Input type="text" name="title" defaultValue={defaults?.title} required />
        </Field>
        <Field label="Описание">
          <Textarea name="description" rows={5} defaultValue={defaults?.description} required />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Цена (сомони)">
            <Input type="number" name="price" min="1" defaultValue={defaults?.price} required />
          </Field>
          <Field label="Высота (см)">
            <Input type="number" name="heightCm" min="1" defaultValue={defaults?.heightCm} required />
          </Field>
          <Field label="Ширина (см)">
            <Input type="number" name="widthCm" min="1" defaultValue={defaults?.widthCm} required />
          </Field>
        </div>
        <Field label="Категория">
          <NativeSelect name="categoryId" defaultValue={defaults?.categoryId ?? ''} required>
            {!defaults && <option value="">Выберите категорию</option>}
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Техника">
          <NativeSelect name="techniqueId" defaultValue={defaults?.techniqueId ?? ''} required>
            {!defaults && <option value="">Выберите технику</option>}
            {techniques.map((technique) => (
              <option key={technique.id} value={technique.id}>
                {technique.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {defaults && (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Текущее изображение</p>
            <ArtworkImage src={defaults.imageUrl} alt="" className="w-32" sizes="128px" />
          </div>
        )}
        <Field label={imageLabel}>
          <ArtworkPhotoInput required={imageRequired} />
        </Field>
        <Button type="submit" size="lg" className="justify-self-start">
          {submitLabel}
        </Button>
      </form>
    </>
  );
}
