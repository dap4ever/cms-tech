'use client';

import React from 'react';
import { PlanningSection } from '../../components/dashboard/PlanningSection';

export default function PlanningPage() {
  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '1.8rem', fontWeight: 800 }}>
        <span style={{ color: 'var(--status-warning)' }}>PT</span> Planejamento Tech
      </h1>
      <PlanningSection />
    </div>
  );
}
