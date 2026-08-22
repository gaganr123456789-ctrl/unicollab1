-- UniCollab PostgreSQL Database Schema DDL & Seed Script

-- 1. Create Users Table
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

-- 2. Create Teammates Candidates Table
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
  availability VARCHAR(100) DEFAULT 'Available Now',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Tasks Kanban Table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Software',
  column_status VARCHAR(50) DEFAULT 'todo',
  priority VARCHAR(50) DEFAULT 'Medium',
  assignee VARCHAR(255) DEFAULT 'Alex Rivera',
  due_date VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Mentors Table
CREATE TABLE IF NOT EXISTS mentors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  rating NUMERIC(3, 2) DEFAULT 4.90,
  reviews INT DEFAULT 40,
  hourly_rate VARCHAR(100) DEFAULT 'Free (University Sponsored)',
  availability VARCHAR(255) DEFAULT 'Mon, Wed, Fri (4 PM - 7 PM)',
  initials VARCHAR(10) DEFAULT 'AS',
  avatar_bg VARCHAR(50) DEFAULT '#EFF6FF',
  avatar_color VARCHAR(50) DEFAULT '#2563EB',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Hackathons Table
CREATE TABLE IF NOT EXISTS hackathons (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  organizer VARCHAR(255) NOT NULL,
  prize_pool VARCHAR(100) DEFAULT '$25,000 USD',
  deadline VARCHAR(100) NOT NULL,
  tags TEXT[] NOT NULL,
  participants_count INT DEFAULT 420,
  status VARCHAR(100) DEFAULT 'Registration Open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  text TEXT NOT NULL,
  timestamp VARCHAR(100) DEFAULT 'Just now',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT DEFAULT 1,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  time_ago VARCHAR(100) DEFAULT 'Just now',
  type VARCHAR(50) DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  level VARCHAR(50) DEFAULT 'INTERMEDIATE',
  major VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  commitment VARCHAR(100) DEFAULT '6-8 hrs/week',
  spots VARCHAR(100) DEFAULT '3 spots left',
  lead_name VARCHAR(255) NOT NULL,
  likes INT DEFAULT 10,
  applications INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for Fast Query Performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_teammates_major ON teammates(major);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(column_status);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
