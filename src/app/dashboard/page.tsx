'use client';

import React from 'react';
import { HoursSection } from '../../components/dashboard/HoursSection';

export default function Dashboard() {
  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '1.8rem', fontWeight: 800 }}>
        <span style={{ color: 'var(--accent-secondary)' }}>DASH</span> Dashboard de Horas
      </h1>
      <HoursSection />
    </div>
  );
}
