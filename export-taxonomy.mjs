import fs from 'fs';
import path from 'path';

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

async function exportTaxonomy() {
  console.log('Iniciando exportacao da taxonomia...');

  // 1. Clientes (Empresas)
  console.log('Buscando clientes... (SearchClients)');
  // A documentação diz que SearchClients aceita 'q' e 'showInactives'
  const resClients = await fetch(`https://${host}/api/v1/Search/SearchClients?q=&showInactives=false`, {
    headers: { '__identifier': token, 'Content-Type': 'application/json' }
  });
  
  if (resClients.ok) {
     const clients = await resClients.json();
     const arr = Array.isArray(clients) ? clients : (clients.Entity || clients.data || []);
     const outPathClients = path.resolve('docs', 'TASKROW_CLIENTS_EXPORT.json');
     fs.writeFileSync(outPathClients, JSON.stringify(arr, null, 2));
     console.log(`Salvo: ${arr.length} clientes em ${outPathClients}`);
  } else {
     console.error('Falha de API Clientes:', resClients.status, await resClients.text());
  }

  // 2. Projetos (Jobs) - Via SearchJobs para garantir retorno mais estável
  console.log('Buscando projetos... (SearchJobs)');
  const resJobs = await fetch(`https://${host}/api/v1/Search/SearchJobs?q=`, {
    headers: { '__identifier': token, 'Content-Type': 'application/json' }
  });

  if (resJobs.ok) {
     const jobs = await resJobs.json();
     const arrJobs = Array.isArray(jobs) ? jobs : (jobs.Entity || jobs.data || []);
     const outPathJobs = path.resolve('docs', 'TASKROW_JOBS_EXPORT.json');
     fs.writeFileSync(outPathJobs, JSON.stringify(arrJobs, null, 2));
     console.log(`Salvo: ${arrJobs.length} projetos em ${outPathJobs}`);
  } else {
     console.error('Falha de API Projetos:', resJobs.status, await resJobs.text());
  }
}

exportTaxonomy();
