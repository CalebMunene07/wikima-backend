import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Supabase PostgreSQL connection
// DATABASE_URL format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required for Supabase
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('✓ Connected to Supabase PostgreSQL');
  }
});

pool.on('error', (err) => {
  console.error('DB pool error:', err.message);
});

// Named export used throughout controllers
export { pool };

// Default export kept for compatibility
export default pool;

// Connect & verify on startup
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
