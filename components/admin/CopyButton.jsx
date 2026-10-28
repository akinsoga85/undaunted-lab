'use client';
import { useState } from 'react';

// Copies text, such as a sender's email, to paste into any mail app. Works even where mailto links do nothing.
export default function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { window.prompt('Copy this:', text); return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return <button type="button" className="a-btn ghost small" onClick={copy}>{copied ? 'Copied ✓' : label}</button>;
}
