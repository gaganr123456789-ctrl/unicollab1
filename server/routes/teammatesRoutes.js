import express from 'express';
import { usersDB, teammatesDB } from '../db/dataStore.js';

const router = express.Router();

let prismaTeammatesInstance = null;
const getTeammatesPrisma = async () => {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaTeammatesInstance) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      prismaTeammatesInstance = new PrismaClient();
    } catch (err) {
      console.warn('Prisma load skipped in teammatesRoutes.');
      return null;
    }
  }
  return prismaTeammatesInstance;
};

// GET /api/teammates - Query all registered student accounts excluding current authenticated user
router.get('/', async (req, res) => {
  const { search, skill, major } = req.query;

  // 1. Extract authenticated user details from JWT token or request
  let currentUserId = req.user?.id || req.query.currentUserId || null;
  let currentUserEmail = (req.user?.email || req.query.excludeEmail || '').toLowerCase().trim();

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const { default: jwt } = await import('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'unicollab_jwt_secret_key_2026';
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded) {
        if (decoded.id) currentUserId = decoded.id;
        if (decoded.email) currentUserEmail = decoded.email.toLowerCase().trim();
      }
    } catch (e) {
      // Non-blocking JWT verify
    }
  }

  let candidates = [];

  // 2. Fetch all registered students from Prisma PostgreSQL Database excluding current user
  try {
    const prisma = await getTeammatesPrisma();
    if (prisma) {
      const whereConditions = [
        { role: { notIn: ['ADMIN', 'MENTOR'] } }
      ];

      // Exclude logged in user server-side in Prisma query
      if (currentUserEmail) {
        whereConditions.push({
          email: { not: { equals: currentUserEmail, mode: 'insensitive' } }
        });
      }
      if (currentUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUserId)) {
        whereConditions.push({
          id: { not: currentUserId }
        });
      }

      const dbUsers = await prisma.user.findMany({
        where: {
          AND: whereConditions
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          major: true,
          degree: true,
          university: true,
          skills: true,
          bio: true,
          avatarBg: true,
          createdAt: true
        }
      });

      if (dbUsers && dbUsers.length > 0) {
        candidates = dbUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.degree || `B.Tech ${u.major || 'Computer Science & Engineering (CSE)'}`,
          major: u.major || (u.degree ? u.degree.replace(/^B\.Tech\s+/i, '') : 'Computer Science & Engineering (CSE)'),
          degree: u.degree || 'B.Tech',
          university: u.university || 'Stanford University',
          skills: Array.isArray(u.skills) && u.skills.length > 0 ? u.skills : ['React', 'Node.js', 'Engineering'],
          avatarBg: u.avatarBg || '#EFF6FF',
          avatarColor: '#2563EB',
          bio: u.bio || `Student specializing in ${u.major || 'Engineering'} at ${u.university || 'Campus Network'}. Open to collaborations.`,
          rating: 5.0,
          projectsCount: 5,
          availability: 'Available Now',
          verified: true,
          initials: u.name ? u.name.slice(0, 2).toUpperCase() : 'ST',
          createdAt: u.createdAt
        }));
      }
    }
  } catch (err) {
    console.warn('Teammates Prisma query info:', err.message);
  }

  // 3. Fallback / Memory Store merge
  const storeStudents = usersDB
    .filter(u => {
      if (u.role === 'ADMIN' || u.role === 'MENTOR') return false;
      if (currentUserEmail && u.email && u.email.toLowerCase().trim() === currentUserEmail) return false;
      if (currentUserId && String(u.id) === String(currentUserId)) return false;
      return true;
    })
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.degree || `B.Tech ${u.major || 'Computer Science & Engineering (CSE)'}`,
      major: u.major || (u.degree ? u.degree.replace(/^B\.Tech\s+/i, '') : 'Computer Science & Engineering (CSE)'),
      degree: u.degree || 'B.Tech',
      university: u.university || 'Stanford University',
      skills: Array.isArray(u.skills) && u.skills.length > 0 ? u.skills : ['React', 'Node.js', 'Engineering'],
      avatarBg: u.avatarBg || '#EFF6FF',
      avatarColor: '#2563EB',
      bio: u.bio || `Student specializing in ${u.major || 'Engineering'} at ${u.university || 'Campus Network'}. Open to collaborations.`,
      rating: 5.0,
      projectsCount: 5,
      availability: 'Available Now',
      verified: true,
      initials: u.name ? u.name.slice(0, 2).toUpperCase() : 'ST',
      createdAt: u.createdAt
    }));

  // Merge unique by email
  const mergedMap = new Map();
  candidates.forEach(c => { if (c.email) mergedMap.set(c.email.toLowerCase(), c); });
  storeStudents.forEach(c => {
    if (c.email && !mergedMap.has(c.email.toLowerCase())) {
      mergedMap.set(c.email.toLowerCase(), c);
    }
  });

  let results = Array.from(mergedMap.values());

  // Strictly filter out the current logged-in user from candidate results
  if (currentUserEmail) {
    results = results.filter(t => !t.email || t.email.toLowerCase().trim() !== currentUserEmail);
  }
  if (currentUserId) {
    results = results.filter(t => String(t.id) !== String(currentUserId));
  }

  // Search filter
  if (search) {
    const q = search.toLowerCase().trim();
    results = results.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.role.toLowerCase().includes(q) ||
      t.major.toLowerCase().includes(q) ||
      t.university.toLowerCase().includes(q) ||
      (Array.isArray(t.skills) && t.skills.some(s => s.toLowerCase().includes(q)))
    );
  }

  // Major filter
  if (major && major !== 'All') {
    const mQuery = major.toLowerCase();
    results = results.filter(t => t.major.toLowerCase().includes(mQuery) || mQuery.includes(t.major.toLowerCase()));
  }

  // Skill filter
  if (skill && skill !== 'All Skills' && skill !== 'All') {
    const sQuery = skill.toLowerCase();
    results = results.filter(t => Array.isArray(t.skills) && t.skills.some(s => s.toLowerCase().includes(sQuery)));
  }

  return res.status(200).json({
    success: true,
    total: results.length,
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
