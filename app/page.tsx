'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Load the full landing page HTML
    fetch('/landing.html')
      .then(res => res.text())
      .then(html => {
        document.open();
        document.write(html);
        document.close();
      });
  }, []);

  return <div>Loading SeePay...</div>;
}