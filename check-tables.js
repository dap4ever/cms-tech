const { Client } = require('pg');
const connectionString = 'postgresql://postgres:2826@127.0.0.1:5432/cms_tech';

const client = new Client({
  connectionString: connectionString,
});

async function checkTables() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in database:', res.rows.map(r => r.table_name));
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkTables();
