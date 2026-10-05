import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

async function verifyProductionDB() {
  console.log('--- PRODUCTION DATABASE VERIFICATION ---');
  
  const DATABASE_URL = process.env.DATABASE_URL;
  console.log(`DATABASE_URL status: ${DATABASE_URL ? 'SET' : 'MISSING'}`);
  
  if (!DATABASE_URL) {
    console.log('Result: Production is likely using JSON Local Store.');
    return;
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    console.log('dbReady: true (Connected to PostgreSQL)');
    
    const tablesToCheck = [
      'news_sources',
      'news_locations',
      'news_location_aliases',
      'news_articles',
      'news_fetch_jobs',
      'news_settings'
    ];

    for (const table of tablesToCheck) {
      try {
        const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`Table "${table}": EXISTS (Count: ${res.rows[0].count})`);
      } catch (err: any) {
        console.log(`Table "${table}": MISSING (${err.message})`);
      }
    }

    client.release();
  } catch (err: any) {
    console.log(`dbReady: false (Connection Failed: ${err.message})`);
  } finally {
    await pool.end();
  }
}

verifyProductionDB();
