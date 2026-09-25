import { Input } from '@/src/components/ui/input';
import { SubmitButton } from '@/src/components/form/submit-button';

type Item = { id: string; name: string };
type Action = (formData: FormData) => void | Promise<void>;

export function ReferenceList({
  title,
  items,
  renameAction,
  addAction,
  addPlaceholder,
}: {
  title: string;
  items: Item[];
  renameAction: Action;
  addAction: Action;
  addPlaceholder: string;
}) {
  return (
    <>
      <h1>{title}</h1>
      <ul className="mt-6 grid max-w-xl gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <form action={renameAction} className="flex gap-2">
              <input type="hidden" name="id" value={item.id} />
              <Input type="text" name="name" defaultValue={item.name} aria-label={`Название: ${item.name}`} />
              <SubmitButton variant="outline">
                Переименовать
              </SubmitButton>
            </form>
          </li>
        ))}
      </ul>
      <form action={addAction} className="mt-6 flex max-w-xl gap-2 border-t border-border pt-6">
        <Input type="text" name="name" placeholder={addPlaceholder} required />
        <SubmitButton>Добавить</SubmitButton>
      </form>
    </>
  );
}
