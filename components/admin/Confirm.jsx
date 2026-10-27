'use client';
import { useState } from 'react';

// Two-step destructive button: the first click asks, the second does it.
export default function Confirm({ action, id, label = 'Delete', confirmLabel = 'Are you sure?' }) {
  const [ask, setAsk] = useState(false);
  if (!ask) return <button type="button" className="a-btn ghost small" onClick={() => setAsk(true)}>{label}</button>;
  return (
    <form action={action} className="a-actions" role="group" aria-label={confirmLabel}>
      <input type="hidden" name="id" value={id} />
      <span style={{ fontWeight: 600, fontSize: 13 }}>{confirmLabel}</span>
      <button type="submit" className="a-btn danger small">Yes, {label.toLowerCase()}</button>
      <button type="button" className="a-btn ghost small" onClick={() => setAsk(false)}>Cancel</button>
    </form>
  );
}
