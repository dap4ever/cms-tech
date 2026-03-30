'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, X, ZoomIn } from 'lucide-react';
import styles from './QualityReport.module.css';

interface QCAdjustment {
  id: string;
  description: string;
  images: string[];
  isFixed: boolean;
}

interface QCTopic {
  id: string;
  title: string;
  adjustments: QCAdjustment[];
}

interface QualityReportProps {
  topics: QCTopic[];
  onFixToggle?: (topicId: string, adjId: string) => void;
}

export const QualityReport: React.FC<QualityReportProps> = ({ topics, onFixToggle }) => {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!topics || topics.length === 0) return null;

  const totalItems = topics.reduce((acc, t) => acc + (t.adjustments?.length ?? 0), 0);
  const fixedItems = topics.reduce((acc, t) => acc + (t.adjustments?.filter(a => a.isFixed).length ?? 0), 0);
  const progress = totalItems > 0 ? (fixedItems / totalItems) * 100 : 0;

  return (
    <>
      {/* Lightbox modal */}
      {lightbox && (
        <div className={styles.lightboxOverlay} onClick={() => setLightbox(null)}>
          <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>
            <X size={22} />
          </button>
          <img
            src={lightbox}
            alt="Evidência ampliada"
            className={styles.lightboxImg}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <AlertTriangle size={20} className={styles.failIcon} />
            <div>
              <h3 className={styles.title}>Relatório de Auditoria Técnica</h3>
              <p className={styles.subtitle}>Ajustes necessários apontados pelo Quality Check</p>
            </div>
          </div>
          <div className={styles.progressTracker}>
            <span className={styles.progressText}>{fixedItems}/{totalItems} corrigidos</span>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </header>

        <div className={styles.topicsGrid}>
          {topics.map(topic => (
            <div key={topic.id} className={styles.topicCard}>
              <h4 className={topic.adjustments?.every(a => a.isFixed) ? styles.topicTitleFixed : styles.topicTitle}>
                {topic.title}
              </h4>
              <div className={styles.adjList}>
                {(topic.adjustments ?? []).map(adj => (
                  <div key={adj.id} className={`${styles.adjItem} ${adj.isFixed ? styles.adjFixed : ''}`}>
                    <div className={styles.adjContent}>
                      <button
                        className={styles.checkBtn}
                        onClick={() => onFixToggle?.(topic.id, adj.id)}
                      >
                        <CheckCircle2 size={18} color={adj.isFixed ? 'var(--status-success)' : 'var(--text-secondary)'} />
                      </button>
                      <span className={styles.adjText}>{adj.description}</span>
                    </div>

                    {adj.images && adj.images.length > 0 && (
                      <div className={styles.adjImages}>
                        {adj.images.map((img, idx) => (
                          <button
                            key={idx}
                            className={styles.imgThumb}
                            onClick={() => setLightbox(img)}
                            title="Ampliar imagem"
                            type="button"
                          >
                            <img src={img} alt="Evidência" />
                            <div className={styles.imgOverlay}><ZoomIn size={14} /></div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {progress === 100 && (
          <div className={styles.successMessage}>
            <CheckCircle2 size={16} /> Tudo corrigido! Envie novamente para Revisão.
          </div>
        )}
      </div>
    </>
  );
};
