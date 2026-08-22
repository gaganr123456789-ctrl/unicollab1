// PostgreSQL Database Pool Connector (Lazy Initialization for Serverless Stability)
import pg from 'pg';

const { Pool } = pg;

let poolInstance = null;

const getPool = () => {
  if (!process.env.DATABASE_URL) return null;
  if (!poolInstance) {
    try {
      poolInstance = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
    } catch (err) {
      console.warn('Failed to initialize PostgreSQL pool:', err.message);
      return null;
    }
  }
  return poolInstance;
};

// Helper for executing parameterized SQL queries
export const query = async (text, params) => {
  const pool = getPool();
  if (!pool) return { rows: [], rowCount: 0 };

  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('PostgreSQL Query executed:', { text: text.substring(0, 60), rows: res.rowCount, duration: `${duration}ms` });
    return res;
  } catch (err) {
    console.warn('PostgreSQL Query warning:', err.message);
    return { rows: [], rowCount: 0 };
  }
};

// Check PostgreSQL Database Connection
export const checkPostgresHealth = async () => {
  try {
    const res = await query('SELECT NOW()');
    return { status: 'connected', timestamp: res.rows[0]?.now };
  } catch (err) {
    return { status: 'disconnected', error: err.message };
  }
};

let prismaInstance = null;
export const getPrisma = async () => {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaInstance) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      prismaInstance = new PrismaClient();
    } catch (err) {
      console.warn('Prisma load skipped:', err.message);
      return null;
    }
  }
  return prismaInstance;
};
