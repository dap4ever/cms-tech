'use client';

import React, { useState } from 'react';
import { QualityReport } from './QualityReport';

interface QualityReportContainerProps {
  taskId: string;
  initialTopics: any[];
}

// Normaliza entre os dois formatos possíveis:
// QCEditor salva: { id, name, open, ajustes: [{ id, title, desc, done, img }] }
// QualityReport espera: { id, title, adjustments: [{ id, description, images, isFixed }] }
function normalizeTopics(raw: any[]): any[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((t: any) => ({
    id: String(t.id ?? t.taskId ?? Math.random()),
    title: t.title ?? t.name ?? '',
    adjustments: (t.adjustments ?? t.ajustes ?? []).map((a: any) => ({
      id: String(a.id ?? Math.random()),
      description: a.description ?? a.desc ?? a.title ?? '',
      images: Array.isArray(a.images)
        ? a.images
        : (a.img ? [a.img] : []),
      isFixed: a.isFixed ?? a.done ?? false,
    })),
  }));
}

export const QualityReportContainer: React.FC<QualityReportContainerProps> = ({ taskId, initialTopics }) => {
  const [topics, setTopics] = useState(() => normalizeTopics(initialTopics));

  const handleFixToggle = async (topicId: string, adjId: string) => {
    const newTopics = topics.map(topic => {
      if (topic.id === topicId) {
        return {
          ...topic,
          adjustments: topic.adjustments.map((adj: any) => {
            if (adj.id === adjId) {
              return { ...adj, isFixed: !adj.isFixed };
            }
            return adj;
          })
        };
      }
      return topic;
    });

    setTopics(newTopics);

    // Salvar no banco (formato normalizado)
    try {
      await fetch('/api/tasks/assignments/qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, qcMetadata: newTopics })
      });
    } catch (err) {
      console.error('Erro ao salvar correção:', err);
    }
  };

  if (!topics || topics.length === 0) return null;

  return (
    <QualityReport
      topics={topics}
      onFixToggle={handleFixToggle}
    />
  );
};
