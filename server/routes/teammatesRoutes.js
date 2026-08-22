import express from 'express';
import { teammatesDB } from '../db/dataStore.js';

const router = express.Router();

// GET /api/teammates - Query teammates with SQL DB fallback
router.get('/', async (req, res) => {
  const { search, skill, major, department } = req.query;

  try {
    if (process.env.DATABASE_URL) {
      const { query } = await import('../db/postgres.js');
      const dbRes = await query('SELECT * FROM teammates ORDER BY id ASC');
      if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
        let results = dbRes.rows.map(t => ({
          id: t.id,
          name: t.name,
          role: t.title,
          major: t.department,
          university: 'Stanford University',
          skills: t.skills || ['React', 'Engineering'],
          avatarBg: t.avatar_bg || '#2563EB',
          bio: t.bio || '',
          availability: t.availability || 'Available Now',
          rating: Number(t.rating || 4.9),
          verified: t.verified,
          initials: t.initials
        }));

        if (search) {
          const q = search.toLowerCase().trim();
          results = results.filter(t => 
            t.name.toLowerCase().includes(q) || 
            t.role.toLowerCase().includes(q) ||
            t.major.toLowerCase().includes(q) ||
            t.skills.some(s => s.toLowerCase().includes(q))
          );
        }

        return res.status(200).json({
          success: true,
          total: results.length,
          source: 'Supabase PostgreSQL Cloud Database',
          teammates: results
        });
      }
    }
  } catch (err) {
    console.warn('Teammates SQL query fallback:', err.message);
  }

  // Fallback to DataStore
  let results = [...teammatesDB];

  if (search) {
    const q = search.toLowerCase().trim();
    results = results.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.role.toLowerCase().includes(q) ||
      t.major.toLowerCase().includes(q) ||
      t.skills.some(s => s.toLowerCase().includes(q))
    );
  }

  if (skill && skill !== 'All Skills' && skill !== 'All') {
    const sQuery = skill.toLowerCase();
    results = results.filter(t => t.skills.some(s => s.toLowerCase().includes(sQuery)));
  }

  return res.status(200).json({
    success: true,
    total: results.length,
    source: 'Application State',
    teammates: results
  });
});

// GET /api/teammates/:id - Get Single Candidate Profile
router.get('/:id', (req, res) => {
  const candidateId = Number(req.params.id);
  const teammate = teammatesDB.find(t => t.id === candidateId);

  if (!teammate) {
    return res.status(404).json({ success: false, message: 'Teammate profile not found.' });
  }

  return res.status(200).json({ success: true, teammate });
});

// POST /api/teammates - Create New Candidate Profile
router.post('/', (req, res) => {
  const { name, role, major, university, skills, bio } = req.body;

  if (!name || !role) {
    return res.status(400).json({ success: false, message: 'Name and role are required.' });
  }

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'ST';
  const newTeammate = {
    id: teammatesDB.length + 1,
    name: name.trim(),
    role: role.trim(),
    major: major || 'Computer Science & Engineering (CSE)',
    university: university || 'Stanford University',
    skills: Array.isArray(skills) ? skills : ['React', 'Engineering'],
    avatarBg: '#2563EB',
    bio: bio || 'Building innovative student capstone projects.',
    availability: 'Available Now',
    rating: 5.0,
    verified: true,
    initials
  };

  teammatesDB.push(newTeammate);

  return res.status(201).json({
    success: true,
    message: 'Teammate profile created successfully.',
    teammate: newTeammate
  });
});

// POST /api/teammates/match - AI Matchmaking Algorithm with Project Focus & Next Project signals
router.post('/match', async (req, res) => {
  const { 
    userSkills = ['React', 'Node.js'], 
    projectFocus = '', 
    nextProject = '', 
    degree = '',
    currentProject = ''
  } = req.body;

  let candidates = [...teammatesDB];

  // Fetch registered student users from Prisma/usersDB if available
  try {
    if (process.env.DATABASE_URL) {
      const { PrismaClient } = await import('@prisma/client');
      const prismaClient = new PrismaClient();
      const studentUsers = await prismaClient.user.findMany({
        where: { role: 'STUDENT' }
      });
      if (studentUsers && studentUsers.length > 0) {
        candidates = studentUsers.map((u, i) => ({
          id: u.id,
          name: u.name,
          role: u.major || 'Engineering Student',
          major: u.major || 'Computer Science & Engineering (CSE)',
          degree: u.degree || 'B.Tech',
          university: u.university || 'Campus Network',
          skills: u.skills || ['React', 'Engineering'],
          projectFocus: u.projectFocus || 'Web Dev',
          currentProject: u.currentProject || '',
          nextProject: u.nextProject || '',
          bio: u.bio || `${u.degree || 'Student'} specializing in ${u.major || 'Engineering'}`,
          rating: 4.9,
          initials: u.name.split(' ').map(n => n[0]).join('').slice(0, 2)
        }));
      }
    }
  } catch (err) {
    console.warn('Prisma teammates match query fallback:', err.message);
  }

  const rankedCandidates = candidates.map(candidate => {
    let score = 70;

    // 1. Next Project & Project Focus matching (High Signal Priority!)
    if (nextProject && candidate.nextProject) {
      const np1 = nextProject.toLowerCase();
      const np2 = candidate.nextProject.toLowerCase();
      if (np1.includes(np2) || np2.includes(np1)) {
        score += 20;
      }
    }

    if (projectFocus && candidate.projectFocus) {
      if (projectFocus.toLowerCase() === candidate.projectFocus.toLowerCase()) {
        score += 15;
      }
    }

    // 2. Skills matching
    const matchingSkills = (candidate.skills || []).filter(s => 
      userSkills.some(us => us.toLowerCase() === s.toLowerCase())
    );
    score += Math.min(15, matchingSkills.length * 5);

    const matchScore = Math.min(99, Math.round(score));

    return {
      ...candidate,
      matchScore,
      matchingSkills
    };
  }).sort((a, b) => b.matchScore - a.matchScore);

  return res.status(200).json({
    success: true,
    message: 'AI Matchmaking candidates calculated.',
    matches: rankedCandidates
  });
});

export default router;
