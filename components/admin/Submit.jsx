'use client';
import { useFormStatus } from 'react-dom';

export default function Submit({ children, className = 'a-btn', pendingText = 'Working…', ...rest }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending} {...rest}>
      {pending ? pendingText : children}
    </button>
  );
}
