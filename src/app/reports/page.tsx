'use client';

import React from 'react';
import { ReportingSection } from '../../components/dashboard/ReportingSection';

export default function ReportsPage() {
  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '1.8rem', fontWeight: 800 }}>
        <span style={{ color: 'var(--status-warning)' }}>REL</span> Relatórios Mensais
      </h1>
      <ReportingSection />
    </div>
  );
}
