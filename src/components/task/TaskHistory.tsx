"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from '../../app/taskrow/task/[id]/task.module.css';

interface TaskHistoryProps {
  items: any[];
  taskOwner: string;
}

function rewriteTaskrowImages(html: string): string {
  if (!html) return html;
  return html.replace(
    /src=["'](?:https?:\/\/[^/]+\/|\/)?File\/TaskImageByGuid\/\?identification=([^&"']+)&(?:amp;)?mimeType=([^&"']+)(?:[^"']*)["']/gi,
    (_match, identification, mimeType) => {
      const id = decodeURIComponent(identification);
      const mime = decodeURIComponent(mimeType);
      return `src="/api/taskrow/image?identification=${encodeURIComponent(id)}&mimeType=${encodeURIComponent(mime)}"`;
    }
  );
}

export function TaskHistory({ items, taskOwner }: TaskHistoryProps) {
  // Começa sempre colapsado
  const [isExpanded, setIsExpanded] = useState(false);

  const validItems = items.filter(item => item.TaskItemComment || item.NewOwnerName || item.PipelineStepID);
  const reversedItems = [...validItems].reverse();
  const totalCount = reversedItems.length;

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Botão de Toggle do Histórico */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={styles.historyToggleBtn}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {isExpanded
            ? 'Ocultar Histórico'
            : totalCount === 0
              ? 'Sem atualizações'
              : `Ver Histórico (${totalCount} atualização${totalCount !== 1 ? 'ões' : ''})`}
        </span>
        {!isExpanded && totalCount > 0 && (
          <span className={styles.historyPreviewBadge}>{totalCount}</span>
        )}
      </button>

      {/* Conteúdo expansível */}
      {isExpanded && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {totalCount === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nenhum comentário ou atualização registrado.</p>
          ) : reversedItems.map((item: any, i: number) => {
            let actorName = item.CreationUserLogin || item.NewOwnerName || taskOwner;
            if (item.Request?.CreationUserLogin) actorName = item.Request.CreationUserLogin;
            const isFirst = i === reversedItems.length - 1;

            return (
              <div key={i} style={{ display: 'flex', gap: '16px', borderLeft: isFirst ? '2px solid #f59e0b' : '2px solid var(--border-color)', paddingLeft: '16px', marginLeft: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div className={styles.avatar} style={{ width: 24, height: 24, fontSize: '0.6rem' }}>{actorName.substring(0, 2).toUpperCase()}</div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{actorName}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {item.Date ? new Date(parseInt(item.Date.match(/\d+/)[0], 10)).toLocaleString('pt-BR') : 'Data desconhecida'}
                    </span>
                  </div>

                  {item.NewOwnerName && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontStyle: 'italic' }}>
                      → Transferiu a responsabilidade para <strong>{item.NewOwnerName}</strong>
                    </div>
                  )}

                  {item.TaskItemComment && (
                    <div
                      className={styles.commentText}
                      style={{ background: isFirst ? 'var(--bg-main)' : 'transparent', padding: isFirst ? '16px' : '0', borderRadius: '8px' }}
                      dangerouslySetInnerHTML={{ __html: rewriteTaskrowImages(item.TaskItemComment) }}
                    />
                  )}

                  {item.Attachments?.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {item.Attachments.map((subA: any, sx: number) => {
                        const isImg = subA.MimeType?.startsWith('image/');
                        const iUrl = `/api/taskrow/image?identification=${encodeURIComponent(subA.Identification)}&mimeType=${encodeURIComponent(subA.MimeType || 'image/png')}`;
                        const dUrl = `${iUrl}&download=1`;
                        return (
                          <div key={sx} className={styles.chatAttachment}>
                            {isImg && <div className={styles.chatImageWrapper}><img src={iUrl} alt={subA.Name} /></div>}
                            <a href={dUrl} target="_blank" rel="noopener noreferrer" className={styles.chatAttachmentLink}>
                              📎 {subA.Name || `Anexo #${sx}`}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
