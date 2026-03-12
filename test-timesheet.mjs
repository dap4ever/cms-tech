import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const envPath = path.resolve('.env');
let host = '';
let token = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hostMatch = envContent.match(/TASKROW_HOST="?([^"\n]+)"?/);
  const tokenMatch = envContent.match(/TASKROW_TOKEN="?([^"\n]+)"?/);
  if (hostMatch) host = hostMatch[1];
  if (tokenMatch) token = tokenMatch[1];
}

async function testTaskDetail() {
  // Dados baseados na imagem: #211959 MRZL_IDT_TECH_ANALISE ... Empresa: Merz IDT ... 
  // Pegaremos a primeira do AdvancedSearch para garantir
  const payloadSearch = { Pagination: { PageNumber: 1, PageSize: 5 } };
  const resSearch = await fetch(`https://${host}/api/v2/search/tasks/advancedsearch`, {
    method: 'POST',
    headers: { '__identifier': token, 'Content-Type': 'application/json'},
    body: JSON.stringify(payloadSearch)
  });
  const dataSearch = await resSearch.json();
  const task = (Array.isArray(dataSearch) ? dataSearch : (dataSearch.data || dataSearch.items || []))[0];

  if (!task) return;

  const clientNickname = task.clientNickName;
  const jobNumber = task.jobNumber;
  const taskNumber = task.taskNumber;
  const connectionID = crypto.randomUUID();

  console.log(`Buscando TaskDetail: client=${clientNickname}, job=${jobNumber}, task=${taskNumber}`);
  
  const detailUrl = `https://${host}/api/v1/Task/TaskDetail?clientNickname=${clientNickname}&jobNumber=${jobNumber}&taskNumber=${taskNumber}&connectionID=${connectionID}`;
  
  const resDetail = await fetch(detailUrl, {
    method: 'GET',
    headers: { '__identifier': token, 'Content-Type': 'application/json'}
  });

  if (resDetail.ok) {
     const dataDetail = await resDetail.json();
     console.log('Chaves principais do TaskDetail:', Object.keys(dataDetail));
     if(dataDetail.TaskData) {
         const tData = dataDetail.TaskData;
         console.log('Propriedades de TaskData com Hours/Effort/Estimate:', Object.keys(tData).filter(k => k.toLowerCase().includes('hour') || k.toLowerCase().includes('estimat') || k.toLowerCase().includes('effort') || k.toLowerCase().includes('budget') || k.toLowerCase().includes('time')));
         console.log('Exemplos de valores:', {
             EstimatedEffort: tData.EstimatedEffort,
             Effort: tData.Effort,
             TotalMinutesSpent: tData.TotalMinutesSpent,
             MinutesSpent: tData.MinutesSpent,
             Budget: tData.Budget
         });
     }
  } else {
     console.log('Falha TaskDetail:', resDetail.status, await resDetail.text());
  }
}

testTaskDetail();
