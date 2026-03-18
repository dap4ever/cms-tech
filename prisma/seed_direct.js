const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = 'postgresql://postgres:2826@127.0.0.1:5432/cms_tech';

async function seed() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    const email = 'gestor@cms.tech';
    const password = 'admin';
    const name = 'Gestor Principal';
    
    // Check if user exists
    const check = await client.query('SELECT id FROM "User" WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      console.log('User already exists');
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    
    await client.query(
      'INSERT INTO "User" (id, name, email, "passwordHash", role, "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW())',
      ['user_default_gestor', name, email, hash, 'GESTOR']
    );

    console.log('Initial Gestor user created successfully!');
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await client.end();
  }
}

seed();
