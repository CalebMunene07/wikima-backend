import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Railway does NOT support IPv6.
// Supabase's direct host (db.xxx.supabase.co:5432) resolves to IPv6 in some regions
// causing ENETUNREACH. Solution: use the Supabase SESSION POOLER which is IPv4-only.
//
// Get the pooler URL from:
//   Supabase Dashboard → Settings → Database → Connection pooling → Session mode
//
// The URL looks like:
//   postgresql://postgres.bsxzqjalhrhbwsqrqoao:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
//
// Set this as DATABASE_URL in your Railway environment variables.

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  // Force IPv4 — prevents ENETUNREACH on Railway which blocks IPv6
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
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};
