// Automated PostgreSQL Schema Migration & Initial Seeding Script
import 'dotenv/config';
import { pool } from './postgres.js';
import { usersDB, teammatesDB, tasksDB, mentorsDB, hackathonsDB } from './dataStore.js';

export const seedPostgresDatabase = async () => {
  console.log('🐘 Initializing PostgreSQL database tables & seeding data...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        major VARCHAR(255) DEFAULT 'Computer Science & Engineering (CSE)',
        university VARCHAR(255) DEFAULT 'Stanford University',
        age INT DEFAULT 21,
        phone VARCHAR(50),
        gender VARCHAR(50) DEFAULT 'Other',
        initials VARCHAR(10) DEFAULT 'US',
        bio TEXT,
        skills TEXT[],
        rating NUMERIC(3, 2) DEFAULT 5.00,
        projects_completed INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create Teammates Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teammates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        major VARCHAR(255) NOT NULL,
        university VARCHAR(255) NOT NULL,
        skills TEXT[] NOT NULL,
        rating NUMERIC(3, 2) DEFAULT 4.80,
        avatar_bg VARCHAR(50) DEFAULT '#EFF6FF',
        avatar_color VARCHAR(50) DEFAULT '#2563EB',
        initials VARCHAR(10) DEFAULT 'US',
        match_score INT DEFAULT 90,
        availability VARCHAR(100) DEFAULT 'Available Now'
      );
    `);

    // 3. Create Tasks Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'Software',
        column_status VARCHAR(50) DEFAULT 'todo',
        priority VARCHAR(50) DEFAULT 'Medium',
        assignee VARCHAR(255) DEFAULT 'Alex Rivera',
        due_date VARCHAR(100)
      );
    `);

    // 4. Seed Users
    for (const u of usersDB) {
      await client.query(`
        INSERT INTO users (name, email, password, major, university, age, phone, gender, initials, bio, skills, rating)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (email) DO NOTHING;
      `, [u.name, u.email, u.password || 'password123', u.major, u.university, u.age, u.phone, u.gender, u.initials, u.bio, u.skills, u.rating]);
    }

    // 5. Seed Teammates
    for (const t of teammatesDB) {
      await client.query(`
        INSERT INTO teammates (name, role, major, university, skills, rating, avatar_bg, avatar_color, initials, match_score, availability)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING;
      `, [t.name, t.role, t.major, t.university, t.skills, t.rating, t.avatarBg, t.avatarColor, t.initials, t.matchScore, t.availability]);
    }

    // 6. Seed Tasks
    for (const task of tasksDB) {
      await client.query(`
        INSERT INTO tasks (title, category, column_status, priority, assignee, due_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING;
      `, [task.title, task.category, task.column, task.priority, task.assignee, task.dueDate]);
    }

    await client.query('COMMIT');
    console.log('✅ PostgreSQL database tables created & seeded successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ PostgreSQL seeding error:', err.message);
  } finally {
    client.release();
  }
};

// Execute if run directly via Node
if (process.argv[1].includes('seedPostgres.js')) {
  seedPostgresDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
