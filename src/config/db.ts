import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// This is more reliable for local Linux development
dotenv.config({ path: path.join(process.cwd(), '.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ CRITICAL ERROR: DATABASE_URL is missing from environment variables.');
  process.exit(1); 
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  // @ts-ignore
  family: 4, 
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('✓ Connected to Supabase PostgreSQL');
  }
});

pool.on('error', (err) => {
  console.error('DB pool error:', err.message);
});

export { pool };
export default pool;

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Supabase PostgreSQL connected at:', result.rows[0].now);
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    process.exit(1);
  }
};
