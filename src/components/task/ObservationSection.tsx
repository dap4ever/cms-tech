"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Save, Loader2, StickyNote } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import styles from "../../app/taskrow/task/[id]/task.module.css";

interface ObservationSectionProps {
  taskId: string;
  historyItems: any[];
  initialObservation?: string;
  initialImages?: string[];
  initialAiSummary?: string;
}

import { Image as ImageIcon, X, Paperclip } from "lucide-react";

export function ObservationSection({ taskId, historyItems, initialObservation = "", initialImages = [], initialAiSummary = "" }: ObservationSectionProps) {
  const [observation, setObservation] = useState(initialObservation);
  const [localImages, setLocalImages] = useState<string[]>(initialImages);
  const [aiSummary, setAiSummary] = useState(initialAiSummary);
  const [aiSuggestedTitle, setAiSuggestedTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleSaveObservation = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/tasks/assignments/observation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          taskId, 
          localObservation: observation, 
          localImages 
        })
      });

      if (!res.ok) throw new Error("Falha ao salvar no banco");

      setSaveMessage("Observação salva no banco!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
       console.error("Erro ao salvar observação:", error);
       setSaveMessage("Erro ao salvar no DB.");
    } finally {
       setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setLocalImages(prev => [...prev, data.url]);
      }
    } catch (err) {
      alert("Erro no upload da imagem");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (url: string) => {
    setLocalImages(prev => prev.filter(img => img !== url));
  };

  const generateAiSummary = async () => {
    if (!historyItems || historyItems.length === 0) {
       alert("Não há histórico para resumir.");
       return;
    }

    setIsLoading(true);
    setAiSummary("");
    try {
      const response = await fetch("/api/taskrow/task/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historyItems }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao gerar resumo.");
      }

      const data = await response.json();
      setAiSummary(data.summary);

      // Persiste o resumo no banco de dados
      fetch('/api/tasks/assignments/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, aiSummary: data.summary }),
      }).catch(console.error);

      if (data.suggestedTitle) {
         setAiSuggestedTitle(data.suggestedTitle);
         window.dispatchEvent(new CustomEvent('ai_title_ready', {
           detail: { taskId, suggestedTitle: data.suggestedTitle }
         }));
      }

      if (data.totalEstimatedStr) {
         fetch("/api/tasks/estimate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId, estimationHr: data.totalEstimatedStr })
         }).then(r => r.json()).then(res => {
            if (res.success) {
               window.dispatchEvent(new CustomEvent('ai_estimation_ready', { 
                 detail: { taskId, estimationHr: data.totalEstimatedStr } 
               }));
            }
         }).catch(console.error);
      }

    } catch (error: any) {
      console.error(error);
      alert(error.message || "Ocorreu um erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.card} style={{ marginBottom: "24px" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
         <h2 className={styles.cardTitle} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StickyNote size={18} /> Observações Internas e Prints
         </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Bloco de Observações Manuais */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
           <textarea
             className={styles.observationTextarea}
             placeholder="Escreva suas observações, rascunhos ou anotações importantes sobre essa demanda aqui... (Dica: Você pode colar prints diretamente aqui)"
             value={observation}
             onChange={(e) => setObservation(e.target.value)}
             onPaste={async (e) => {
               const items = e.clipboardData.items;
               for (let i = 0; i < items.length; i++) {
                 if (items[i].type.indexOf("image") !== -1) {
                   const file = items[i].getAsFile();
                   if (file) {
                     // Simular o evento de upload
                     const fakeEvent = { target: { files: [file] } } as any;
                     handleFileUpload(fakeEvent);
                   }
                 }
               }
             }}
             rows={4}
           />

           {/* Galeria de Imagens Locais */}
           {localImages.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {localImages.map((url, i) => (
                   <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img src={url} alt="anexo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        onClick={() => removeImage(url)}
                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', border: 0, borderRadius: '50%', color: 'white', padding: '2px', cursor: 'pointer' }}
                      >
                        <X size={10} />
                      </button>
                   </div>
                ))}
              </div>
           )}

           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label className={styles.actionButton} style={{ cursor: 'pointer', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                   {isUploading ? <Loader2 size={16} className={styles.spinner} /> : <Paperclip size={16} />}
                   Anexar Print/Imagem
                   <input type="file" accept="image/*" hidden onChange={handleFileUpload} disabled={isUploading} />
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {saveMessage && <span style={{ fontSize: "0.85rem", color: "var(--success-color)", fontWeight: 500 }}>{saveMessage}</span>}
                <button 
                  onClick={handleSaveObservation} 
                  className={styles.actionButton}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
                  Salvar Mudanças
                </button>
              </div>
           </div>
        </div>

        <hr style={{ border: 0, borderTop: "1px solid var(--border-color)", margin: "8px 0" }} />

        {/* Bloco do Resumo de IA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "rgba(168, 85, 247, 0.05)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(168, 85, 247, 0.2)" }}>
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Sparkles size={16} style={{ color: "#a855f7" }} /> Resumo Inteligente (Opcional)
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Extraia o escopo principal a partir do Histórico do Taskrow.
                </p>
              </div>
              <button 
                onClick={generateAiSummary} 
                className={`${styles.actionButton} ${styles.aiButton}`}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 size={16} className={styles.spinner} /> : <Sparkles size={16} />}
                {aiSummary ? "Gerar Novo Resumo" : "Identificar Próximos Passos"}
              </button>
           </div>

           {aiSummary && (
             <div className={styles.aiSummaryResult}>
               {aiSuggestedTitle && (
                 <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.08))', border: '1px solid rgba(168,85,247,0.4)', borderRadius: '8px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                     <Sparkles size={13} color="#a855f7" />
                     <span style={{ fontSize: '0.65rem', color: '#a855f7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Título sugerido pela IA</span>
                   </div>
                   <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>&ldquo;{aiSuggestedTitle}&rdquo;</p>
                   <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Veja o banner acima do título da tarefa para aplicar.</p>
                 </div>
               )}
               <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(aiSummary) as string) }} />
             </div>
           )}
        </div>
        
      </div>
    </div>
  );
}
