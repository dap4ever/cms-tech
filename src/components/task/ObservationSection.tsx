"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Save, Loader2, StickyNote } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import styles from "../../app/taskrow/task/[id]/task.module.css";

interface ObservationSectionProps {
  taskId: string;
  historyItems: any[];
}

export function ObservationSection({ taskId, historyItems }: ObservationSectionProps) {
  const [observation, setObservation] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const storageKeyObs = `taskrow_obs_${taskId}`;
  const storageKeyAi = `taskrow_ai_${taskId}`;

  useEffect(() => {
    // Carregar dados salvos ao montar o componente
    const savedObs = localStorage.getItem(storageKeyObs);
    const savedAi = localStorage.getItem(storageKeyAi);

    if (savedObs) setObservation(savedObs);
    if (savedAi) setAiSummary(savedAi);
  }, [taskId, storageKeyAi, storageKeyObs]);

  const handleSaveObservation = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(storageKeyObs, observation);
      setSaveMessage("Observação salva com sucesso!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
       console.error("Erro ao salvar observação:", error);
       setSaveMessage("Erro ao salvar.");
    } finally {
       setIsSaving(false);
    }
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
      // Salvar no localstorage para não perder o resumo
      localStorage.setItem(storageKeyAi, data.summary);

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
            <StickyNote size={18} /> Observações da Tarefa
         </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Bloco de Observações Manuais */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
           <textarea
             className={styles.observationTextarea}
             placeholder="Escreva suas observações, rascunhos ou anotações importantes sobre essa demanda aqui..."
             value={observation}
             onChange={(e) => setObservation(e.target.value)}
             rows={4}
           />
           <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px" }}>
              {saveMessage && <span style={{ fontSize: "0.85rem", color: "var(--success-color)", fontWeight: 500 }}>{saveMessage}</span>}
              <button 
                onClick={handleSaveObservation} 
                className={styles.actionButton}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
                Salvar Anotações
              </button>
           </div>
        </div>

        <hr style={{ border: 0, borderTop: "1px solid var(--border-color)", margin: "8px 0" }} />

        {/* Bloco do Resumo de IA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--bg-main)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Sparkles size={16} style={{ color: "#a855f7" }} /> Resumo Inteligente
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Use a IA para ler o Histórico e Atualizações e extrair o que precisa ser feito nesta demanda.
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
               <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(aiSummary) as string) }} />
             </div>
           )}
        </div>
        
      </div>
    </div>
  );
}
