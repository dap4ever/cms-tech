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

async function fetchPage(page) {
  const payload = {
    Closed: false,
    Pagination: { PageNumber: page, PageSize: 500 }
  };

  const res = await fetch(`https://${host}/api/v2/search/tasks/advancedsearch`, {
    method: 'POST',
    headers: {
      '__identifier': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const body = await res.json();
  const tasks = body.data || body.items || body || [];
  return tasks;
}

async function testFetch() {
  const page1 = await fetchPage(1);
  const page2 = await fetchPage(2);
  const page3 = await fetchPage(3);
  
  console.log(`Page 1 tasks: ${page1.length}`);
  console.log(`Page 2 tasks: ${page2.length}`);
  console.log(`Page 3 tasks: ${page3.length}`);
  
  const allTasks = [...page1, ...page2, ...page3];
  let techCount = 0;
  allTasks.forEach(t => {
     const title = (t.taskTitle || '').toLowerCase();
     const owner = (t.ownerUserLogin || '').toLowerCase();
     if(title.includes('tech') || owner.includes('ingrid') || owner.includes('raissa') || owner.includes('kaique')) {
         techCount++;
     }
  });
  console.log(`Total Tech match in 3 pages: ${techCount}`);
}

testFetch();
