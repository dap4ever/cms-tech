import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { taskId, taskTitle, taskDescription } = await req.json();
    if (!taskId) return NextResponse.json({ error: 'taskId obrigatório' }, { status: 400 });

    // Helper: converte strings como "4h", "2.5h", "90m" para horas numéricas
    const parseHours = (val?: string | null): number => {
      if (!val) return 0;
      const hoursMatch = val.match(/([\d.]+)h/);
      const minsMatch = val.match(/([\d.]+)m/);
      return (hoursMatch ? parseFloat(hoursMatch[1]) : 0) +
             (minsMatch ? parseFloat(minsMatch[1]) / 60 : 0);
    };

    const now = new Date();

    type AssignmentSelect = {
      taskId: string;
      title: string;
      status: string;
      estimationHr: string | null;
      trackedTime: string | null;
      sprint: { endDate: Date; name: string } | null;
    };
    type AbsenceSelect = { start: Date; end: Date; type: string };
    type DevSelect = {
      id: string;
      name: string;
      avatarUrl: string | null;
      skills: string[];
      assignments: AssignmentSelect[];
      timeEntries: { hours: number }[];
      absences: AbsenceSelect[];
    };

    // 1. Buscar todos os devs com skills, tarefas e ausências
    const devs: DevSelect[] = await prisma.user.findMany({
      where: { roles: { hasSome: ['DESENVOLVEDOR'] }, isBlocked: false },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        skills: true,
        assignments: {
          where: { status: { notIn: ['DONE', 'APPROVED'] } },
          select: {
            taskId: true,
            title: true,
            status: true,
            estimationHr: true,
            trackedTime: true,
            sprint: { select: { endDate: true, name: true } },
          },
        },
        timeEntries: {
          where: {
            createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
          },
          select: { hours: true },
        },
        absences: {
          where: {
            start: { lte: now },
            end: { gte: now },
          },
          select: { start: true, end: true, type: true },
        },
      },
    });

    // 2. Calcular carga atual de cada dev (inclui estimativa restante, prazos e ausências)
    const devsWithLoad = devs.map(dev => {
      const activeTasks = dev.assignments.length;
      const hoursLast2weeks = dev.timeEntries.reduce((sum: number, e: { hours: number }) => sum + e.hours, 0);

      // Ausência ativa (férias, licença, etc.)
      const activeAbsence = dev.absences[0] ?? null;
      const isAbsent = !!activeAbsence;
      const absenceType = activeAbsence?.type ?? null;
      const absenceUntil = activeAbsence
        ? new Date(activeAbsence.end).toLocaleDateString('pt-BR')
        : null;

      // Horas restantes estimadas: Σ(estimativa - já apontado) para tarefas ativas
      const estimatedRemainingHours = dev.assignments.reduce((sum, a) => {
        const estimated = parseHours(a.estimationHr);
        const tracked = parseHours(a.trackedTime);
        return sum + Math.max(0, estimated - tracked);
      }, 0);

      // Prazo mais próximo entre as tarefas ativas
      const deadlines = dev.assignments
        .filter(a => a.sprint?.endDate)
        .map(a => ({ date: new Date(a.sprint!.endDate), sprintName: a.sprint!.name }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      const nearestDeadline = deadlines[0] ?? null;
      const daysUntilDeadline = nearestDeadline
        ? Math.ceil((nearestDeadline.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Resumo das tarefas ativas com estimativas
      const activeTaskDetails = dev.assignments.slice(0, 5).map(a => {
        const est = parseHours(a.estimationHr);
        const trk = parseHours(a.trackedTime);
        const remaining = Math.max(0, est - trk);
        const deadlineStr = a.sprint?.endDate
          ? ` | prazo: ${new Date(a.sprint.endDate).toLocaleDateString('pt-BR')}`
          : '';
        return `"${a.title}" [${remaining.toFixed(1)}h restantes${deadlineStr}]`;
      });

      return {
        id: dev.id,
        name: dev.name,
        avatarUrl: dev.avatarUrl,
        skills: dev.skills,
        activeTasks,
        hoursLast2weeks: Math.round(hoursLast2weeks * 10) / 10,
        estimatedRemainingHours: Math.round(estimatedRemainingHours * 10) / 10,
        daysUntilDeadline,
        nearestSprintName: nearestDeadline?.sprintName ?? null,
        activeTaskDetails,
        isAbsent,
        absenceType,
        absenceUntil,
      };
    });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      // Fallback sem API key: rankeia por horas restantes estimadas + tarefas ativas
      const sorted = [...devsWithLoad].sort((a, b) =>
        (a.estimatedRemainingHours + a.activeTasks * 2) - (b.estimatedRemainingHours + b.activeTasks * 2)
      );
      return NextResponse.json({
        success: true,
        suggestions: sorted.map(d => ({
          ...d,
          score: Math.max(0, Math.round(10 - d.activeTasks * 1.5 - d.estimatedRemainingHours * 0.3)),
          reason: d.activeTasks === 0
            ? 'Desenvolvedor disponível, sem tarefas ativas.'
            : `${d.activeTasks} tarefa(s) ativa(s), ~${d.estimatedRemainingHours}h restantes estimadas.`,
          aiPowered: false,
        })),
      });
    }

    // 3. Chamar Gemini para ranking inteligente
    const prompt = `
Você é um Tech Lead responsável por atribuir tarefas aos desenvolvedores da equipe.

Tarefa a ser atribuída:
- Título: ${taskTitle || 'Não informado'}
- Descrição: ${taskDescription || 'Não informada'}

Desenvolvedores disponíveis (dados de carga atual):
${devsWithLoad.map(d => `
- Nome: ${d.name}
  Skills declaradas: ${d.skills.length > 0 ? d.skills.join(', ') : 'Não definidas'}
  ${d.isAbsent ? `⚠️ AUSENTE até ${d.absenceUntil} (${d.absenceType ?? 'ausência'}) — NÃO deve ser atribuído` : 'Disponível'}
  Tarefas ativas: ${d.activeTasks}
  Horas apontadas nos últimos 14 dias: ${d.hoursLast2weeks}h
  Horas restantes estimadas nas demandas atuais: ${d.estimatedRemainingHours}h
  ${d.daysUntilDeadline !== null ? `Prazo mais próximo: ${d.daysUntilDeadline} dia(s) (sprint: ${d.nearestSprintName})` : 'Sem sprint com prazo definido'}
  Demandas atuais com estimativas: ${d.activeTaskDetails.length > 0 ? d.activeTaskDetails.join(' | ') : 'Nenhuma'}
`).join('')}

Avalie cada desenvolvedor e retorne um JSON com o seguinte formato EXATO (sem markdown, só JSON puro):
{
  "rankings": [
    {
      "devName": "nome exato como listado acima",
      "score": <número de 0 a 10>,
      "reason": "<explicação curta em pt-BR de até 140 caracteres>"
    }
  ]
}

Critérios de decisão (em ordem de prioridade):
1. AUSÊNCIA: Dev ausente (férias, licença) recebe score 0 e NÃO deve ser recomendado
2. SKILLS: Skills compatíveis com a tarefa a ser atribuída aumentam a pontuação
3. DISPONIBILIDADE REAL: Horas restantes estimadas nas demandas atuais — quem tem menos horas comprometidas é preferido
4. PRAZO CRÍTICO: Devs com prazo de sprint chegando em menos de 3 dias estão sobrecarregados
5. CARGA HISTÓRICA: Alto volume de horas apontadas nos últimos 14 dias indica possível sobrecarga
6. QUANTIDADE DE TAREFAS: Muitas tarefas ativas penalizam a pontuação

Ordene do mais recomendado (maior score) para o menos recomendado.
`;

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const rawText = geminiResponse.text || '';

    let aiRankings: { devName: string; score: number; reason: string }[] = [];
    try {
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      aiRankings = parsed.rankings || [];
    } catch {
      // fallback sem AI
      const sorted = [...devsWithLoad].sort((a, b) =>
        (a.estimatedRemainingHours + a.activeTasks * 2) - (b.estimatedRemainingHours + b.activeTasks * 2)
      );
      return NextResponse.json({
        success: true,
        suggestions: sorted.map(d => ({
          ...d,
          score: Math.max(0, Math.round(10 - d.activeTasks * 1.5 - d.estimatedRemainingHours * 0.3)),
          reason: `${d.activeTasks} tarefa(s) ativa(s), ~${d.estimatedRemainingHours}h restantes estimadas.`,
          aiPowered: false,
        })),
      });
    }

    // Mesclar ranking IA com dados dos devs
    const suggestions = aiRankings
      .map(ranking => {
        const dev = devsWithLoad.find(d => d.name === ranking.devName);
        if (!dev) return null;
        return { ...dev, score: ranking.score, reason: ranking.reason, aiPowered: true };
      })
      .filter(Boolean);

    // Adicionar devs não rankeados pela IA no final
    devsWithLoad.forEach(dev => {
      if (!suggestions.find(s => s?.id === dev.id)) {
        suggestions.push({ ...dev, score: 0, reason: 'Não avaliado pela IA.', aiPowered: false });
      }
    });

    return NextResponse.json({ success: true, suggestions });
  } catch (error: any) {
    console.error('[suggest-assignees] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
