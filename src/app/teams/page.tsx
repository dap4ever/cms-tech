'use client';

import React from 'react';
import { TeamSection } from '../../components/dashboard/TeamSection';

export default function TeamsPage() {
  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '1.8rem', fontWeight: 800 }}>
        <span style={{ color: 'var(--status-success)' }}>GE</span> Gestão de Equipe
      </h1>
      <TeamSection />
    </div>
  );
}
