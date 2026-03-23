const host = 'f2f.taskrow.com';
const token = 'W3u4DvPUANibxLJEjyzGAkj1C0nDtf8fkUr4-zzDRPf90e1hM8jA-NBENV8c_CnLSLwA4taLKfUeCyIZtcVRZtaAgIQWXfBIjIpwkr46Cxs1';
const headers = { '__identifier': token, 'Content-Type': 'application/json' };

async function fetchErrorBody() {
  const url = `https://${host}/api/v1/Task/TaskDetail?clientNickname=ChegoLa&jobNumber=500&taskNumber=215149&connectionID=123e4567-e89b-12d3-a456-426614174000`;
  const res = await fetch(url, { headers });
  const text = await res.text();
  console.log(`STATUS: ${res.status}`);
  console.log(`BODY: ${text}`);
  console.log(`HEADERS:`, Object.fromEntries(res.headers.entries()));
}

fetchErrorBody().catch(console.error);
