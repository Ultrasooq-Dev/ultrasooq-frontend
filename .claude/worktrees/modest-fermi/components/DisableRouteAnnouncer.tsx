// components/DisableRouteAnnouncer.js
'use client';

import { useEffect } from 'react';

export default function DisableRouteAnnouncer() {
  useEffect(() => {
    const announcer = document.getElementById('next-route-announcer-');
    if (announcer) {
      announcer.remove();
    }
  }, []);

  return null;
}