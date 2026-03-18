const { execSync } = require('child_process');
try {
  console.log('Testing DATABASE_URL from .env file...');
  const result = execSync('npx prisma migrate status', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: "postgresql://postgres:2826@localhost:5432/cms_tech" } });
  console.log('Migration status checked successfully.');
} catch (error) {
  console.error('Failed to run prisma command:', error.message);
}
