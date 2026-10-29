'use client';
import { useEffect } from 'react';

// Counts a page view on pages outside the map (the map's own beacons live in Site.jsx).
export default function TrackView() {
  useEffect(() => {
    try {
      const body = JSON.stringify({ t: 'view', path: location.pathname, ref: document.referrer });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
      else fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
    } catch { /* never block the page */ }
  }, []);
  return null;
}
