const { Client } = require('pg');
const connectionString = 'postgresql://postgres:2826@localhost:5432/cms_tech';

const client = new Client({
  connectionString: connectionString,
});

async function testConnection() {
  try {
    await client.connect();
    console.log('Successfully connected to the database!');
    const res = await client.query('SELECT NOW()');
    console.log('Query executed successfully:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
}

testConnection();
