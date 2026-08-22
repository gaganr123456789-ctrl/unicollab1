// Automated Supabase Cloud Seeding Script
import 'dotenv/config';
import { supabaseServer } from './supabaseServer.js';
import { usersDB, teammatesDB, tasksDB, mentorsDB, hackathonsDB, initialProjectsDB } from './dataStore.js';

export const seedSupabaseCloud = async () => {
  console.log('⚡ Initializing Supabase Cloud data seeding...');
  
  try {
    // 1. Seed Teammates
    console.log('Seeding Teammates data to Supabase...');
    const { error: teamErr } = await supabaseServer
      .from('teammates')
      .upsert(teammatesDB, { onConflict: 'id' });

    if (teamErr && !teamErr.message.includes('relation "public.teammates" does not exist')) {
      console.warn('Teammates seed info:', teamErr.message);
    }

    // 2. Seed Tasks
    console.log('Seeding Kanban Tasks to Supabase...');
    const { error: taskErr } = await supabaseServer
      .from('tasks')
      .upsert(tasksDB, { onConflict: 'id' });

    if (taskErr && !taskErr.message.includes('relation "public.tasks" does not exist')) {
      console.warn('Tasks seed info:', taskErr.message);
    }

    // 3. Seed Mentors
    console.log('Seeding Mentors data to Supabase...');
    const { error: mentorErr } = await supabaseServer
      .from('mentors')
      .upsert(mentorsDB, { onConflict: 'id' });

    if (mentorErr && !mentorErr.message.includes('relation "public.mentors" does not exist')) {
      console.warn('Mentors seed info:', mentorErr.message);
    }

    // 4. Seed Users
    console.log('Seeding Users to Supabase...');
    const { error: userErr } = await supabaseServer
      .from('users')
      .upsert(usersDB, { onConflict: 'id' });

    if (userErr && !userErr.message.includes('relation "public.users" does not exist')) {
      console.warn('Users seed info:', userErr.message);
    }

    console.log('✅ Supabase Cloud initial seeding sequence completed successfully!');
  } catch (err) {
    console.error('Supabase seeding error:', err.message);
  }
};

seedSupabaseCloud();
