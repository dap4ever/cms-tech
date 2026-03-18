const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const connectionString = 'postgresql://postgres:2826@127.0.0.1:5432/cms_tech';

async function testPassword() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query('SELECT email, "passwordHash" FROM "User" WHERE email = \'gestor@cms.tech\'');
    
    if (res.rows.length === 0) {
      console.log('User not found');
      return;
    }
    
    const { email, passwordHash } = res.rows[0];
    console.log('User found:', email);
    console.log('Hash in DB:', passwordHash);
    
    const isValid = await bcrypt.compare('admin', passwordHash);
    console.log('Is "admin" valid?', isValid);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

testPassword();
