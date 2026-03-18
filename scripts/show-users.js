const { Client } = require('pg');
const connectionString = 'postgresql://postgres:2826@127.0.0.1:5432/cms_tech';

async function showUsers() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query('SELECT id, name, email, role FROM "User"');
    console.log('--- Current Users in "User" Table ---');
    console.table(res.rows);
  } catch (err) {
    console.error('Error querying users:', err.message);
  } finally {
    await client.end();
  }
}

showUsers();
