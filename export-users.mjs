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

async function exportUsers() {
  console.log('Iniciando exportacao de usuarios de', host);
  const res = await fetch(`https://${host}/api/v1/User/ListUsers`, {
    method: 'GET',
    headers: {
      '__identifier': token,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
     console.error('Falha ao exportar:', res.status, res.statusText);
     return;
  }

  const users = await res.json();
  const arr = Array.isArray(users) ? users : (users.Entity || users.data || []);
  
  const outPath = path.resolve('docs', 'TASKROW_USERS_EXPORT.json');
  fs.writeFileSync(outPath, JSON.stringify(arr, null, 2));
  console.log(`Exportado com sucesso ${arr.length} usuarios para: ${outPath}`);
}

exportUsers();
