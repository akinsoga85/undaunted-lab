'use client';
import { startTransition, useActionState } from 'react';

// For admin forms whose action returns validation errors. React 19 resets a <form action={…}> once the action
// finishes, which would throw away what was typed and put selects, checkboxes and radios back to the saved values
// while the rest of the screen shows the new ones (so the next save would quietly undo the change). Submitting
// through onSubmit instead keeps the form as the admin left it. Pass `pending` to <Submit>, since useFormStatus
// only follows forms that use the action prop.
export function useAdminForm(fn) {
  const [state, dispatch, pending] = useActionState(fn, null);
  const onSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  };
  return { state, pending, onSubmit };
}
