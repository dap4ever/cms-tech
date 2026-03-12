import { NextResponse } from 'next/server';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const host = process.env.TASKROW_HOST || '';
  const token = process.env.TASKROW_TOKEN || '';
  
  if (!host || !token) return NextResponse.json({ success: false, error: 'Sem credentials' });

  try {
    const params = await props.params;
    const taskTrId = params.id; // Ex: TR-2425401
    
    // 1. Busca no endpoint geral (nosso próprio Proxy list) para capturar metadados garantidos
    const rootUrl = request.clone().url.replace(`/task/${params.id}`, '/tasks');
    const rootRes = await fetch(rootUrl);
    const rootData = await rootRes.json();
    
    if (!rootData.success || !rootData.tasks) {
       return NextResponse.json({ success: false, error: 'Lista Base não disponível' });
    }
    
    const rootTask = rootData.tasks.find((t: any) => t.id === taskTrId);
    if (!rootTask) return NextResponse.json({ success: false, error: 'Tarefa não encontrada na Empresa' });

    // 2. Extrai os 3 argumentos cruciais para o TaskDetail Oficial do Taskrow
    const rawData = rootTask.rawData || {};
    const cNick = rawData.clientNickName || rawData.ClientNickName || rawData.clientNickname;
    const jNum = rawData.jobNumber || rawData.JobNumber;
    const tNum = rawData.taskNumber || rawData.TaskNumber;
    
    let detailedData = null;
    if (cNick && jNum && tNum) {
       const detailUrl = `https://${host}/api/v1/Task/TaskDetail?clientNickname=${cNick}&jobNumber=${jNum}&taskNumber=${tNum}&connectionID=abcd`;
       const dRes = await fetch(detailUrl, {
          method: 'GET',
          headers: { '__identifier': token }
       });
       
       if (dRes.ok) {
           const dText = await dRes.text();
           try {
              detailedData = JSON.parse(dText);
           } catch(e) {
              console.warn("Failed to parse Detail API JSON.");
           }
       }
    }

    return NextResponse.json({
      success: true,
      summary: rootTask,
      details: detailedData
    });

  } catch(e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
