'use client';
import { useFormStatus } from 'react-dom';

// `pending` overrides the form status, for forms that submit through useAdminForm rather than the action prop.
export default function Submit({ children, className = 'a-btn', pendingText = 'Working…', pending: busy, ...rest }) {
  const status = useFormStatus();
  const pending = busy ?? status.pending;
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending} {...rest}>
      {pending ? pendingText : children}
    </button>
  );
}
