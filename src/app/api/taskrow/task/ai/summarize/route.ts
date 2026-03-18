import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { historyItems } = await req.json();

    if (!historyItems || !Array.isArray(historyItems) || historyItems.length === 0) {
      return NextResponse.json({ error: 'Nenhum histórico fornecido para sumarizar.' }, { status: 400 });
    }

    // Prepare history text for the prompt
    let historyText = '';
    historyItems.forEach((item: any) => {
       const actorName = item.CreationUserLogin || item.NewOwnerName || item.Request?.CreationUserLogin || 'Usuário';
       const date = item.Date ? new Date(parseInt(item.Date.match(/\d+/)[0], 10)).toLocaleString('pt-BR') : 'Data desconhecida';
       let action = '';
       
       if (item.NewOwnerName) {
           action += `Transferiu a responsabilidade para ${item.NewOwnerName}. `;
       }
       if (item.TaskItemComment) {
           // Strip basic HTML tags for cleaner prompt
           const textComment = item.TaskItemComment.replace(/<[^>]*>?/gm, '');
           action += `Comentou: "${textComment}". `;
       }
       if (action) {
           historyText += `Em ${date}, ${actorName} fez a seguinte ação: ${action}\n`;
       }
    });

    if (!historyText) {
      return NextResponse.json({ error: 'Nenhuma ação relevante encontrada no histórico.' }, { status: 400 });
    }

    // Google Gemini API Settings
    const GEMINI_API_KEY = 'AIzaSyCEPACKf42uM_cHTMMsfrFdQ-JhnSA9yNM';
    
    // Inicializar o cliente oficial da nuvem do Google GenAI
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `
Você é um desenvolvedor Sênior (Tech Lead) analisando uma nova demanda de tarefa.
Abaixo está o histórico de interações e comentários dessa tarefa. 
Seu objetivo é analisar este histórico e gerar um **Guia de Implementação (Action Plan)** para o desenvolvedor que vai assumir a tarefa.

Não faça apenas um resumo do que solicitaram. Em vez disso:
1. Extraia o objetivo principal da demanda.
2. Forneça orientação técnica e os passos lógicos necessários para a implementação (arquivos prováveis, lógicas de front/back, cuidados com performance ou dados antigos, etc.).
3. Liste qualquer pendência de negócio que o dev deve perguntar para o PO/Cliente antes de começar.

Seja direto, profissional e formate a sua resposta em Markdown.

Histórico da Tarefa:
${historyText}

Por favor, forneça o guia de orientação e os próximos passos:
`;

    try {
        // Chamada oficial SDK
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        const summary = response.text;

        if (!summary) {
            throw new Error('Resposta vazia da IA.');
        }

        return NextResponse.json({ summary });
    } catch (apiError: any) {
        console.error('Gemini SDK Error:', apiError);
        
        // Tratar erro 429 via status interno do erro do SDK (pode vir como 'status' ou dentro de 'message')
        const isQuotaExceeded = apiError.status === 429 || (apiError.message && apiError.message.includes('429'));
        
        if (isQuotaExceeded) {
            throw new Error('Limite de uso da API do Gemini excedido (Cota estourou). Tente novamente mais tarde ou verifique a chave de API.');
        }
        
        throw new Error(`Falha na API do Gemini: ${apiError.message || 'Erro desconhecido'}`);
    }

  } catch (error: any) {
    console.error('AI Summarize Error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao processar resumo com IA.' }, { status: 500 });
  }
}
