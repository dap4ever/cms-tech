'use client';

import React from 'react';
import { QCSection } from '../../components/dashboard/QCSection';

export default function QualityCheckPage() {
  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '1.8rem', fontWeight: 800 }}>
        <span style={{ color: 'var(--accent-primary)' }}>QC</span> Quality Check
      </h1>
      <QCSection />
    </div>
  );
}
