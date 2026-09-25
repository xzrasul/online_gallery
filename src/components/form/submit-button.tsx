'use client';

import type { ComponentProps } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

function Spinner() {
  return <span className="btn-spin" aria-hidden="true" />;
}

// A form's submit button that reacts the moment it is pressed: while the
// server action runs it is disabled (a second press can't send the form again)
// and shows a small spinner. `plain` renders a bare <button> for the site's own
// .btn styles; otherwise it is the ui Button with its variants.
export function SubmitButton({
  plain,
  className,
  children,
  disabled,
  ...props
}: ComponentProps<typeof Button> & { plain?: boolean }) {
  const { pending } = useFormStatus();
  const state = {
    type: 'submit' as const,
    disabled: pending || disabled,
    'aria-busy': pending || undefined,
    'data-pending': pending || undefined,
  };
  if (plain) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- ui Button options mean nothing on a bare button
    const { variant, size, asChild, ...native } = props;
    return (
      <button {...native} {...state} className={cn(className, 'submit-btn')}>
        {pending && <Spinner />}
        {children}
      </button>
    );
  }
  return (
    <Button {...props} {...state} className={cn(className, 'submit-btn')}>
      {pending && <Spinner />}
      {children}
    </Button>
  );
}
