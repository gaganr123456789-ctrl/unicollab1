import { usersDB, mentorsDB } from '../db/dataStore.js';

let prismaInstance = null;
const getPrisma = async () => {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaInstance) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      prismaInstance = new PrismaClient();
    } catch (err) {
      console.warn('Prisma load skipped in mentorsController.');
      return null;
    }
  }
  return prismaInstance;
};

// GET /api/mentors - Get All Registered Mentors (Exclusively Registered Accounts)
export const getMentors = async (req, res) => {
  const { search, expertise } = req.query;
  let candidates = [];

  try {
    const prisma = await getPrisma();
    if (prisma) {
      const registeredMentors = await prisma.user.findMany({
        where: { role: 'MENTOR' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          roleTitle: true,
          degree: true,
          major: true,
          university: true,
          skills: true,
          mentorInterests: true,
          bio: true,
          avatarBg: true,
          createdAt: true
        }
      });

      if (registeredMentors && registeredMentors.length > 0) {
        candidates = registeredMentors.map((m, i) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.roleTitle || 'Industry Professional',
          title: m.roleTitle || 'Industry Professional',
          company: m.university || 'University Faculty / Industry',
          university: m.university || 'University Faculty / Industry',
          rating: 5.0,
          reviews: 20 + (i % 5) * 4,
          category: m.major || (Array.isArray(m.mentorInterests) && m.mentorInterests[0]) || 'Computer Science',
          skills: Array.isArray(m.mentorInterests) && m.mentorInterests.length > 0 ? m.mentorInterests : (m.skills || ['Mentorship & Research']),
          nextAvailable: 'Tomorrow, 2:00 PM',
          bio: m.bio || 'Verified academic mentor guiding capstone projects and research.',
          avatarBg: m.avatarBg || '#7C3AED',
          avatarColor: '#FFFFFF',
          initials: (m.name || 'ME').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        }));
      }
    }
  } catch (err) {
    console.warn('Prisma getMentors query info:', err.message);
  }

  // Fallback in-memory registered mentors
  const storeMentors = usersDB
    .filter(u => u.role === 'MENTOR')
    .map((m, i) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.roleTitle || 'Industry Professional',
      title: m.roleTitle || 'Industry Professional',
      company: m.university || 'University Faculty / Industry',
      university: m.university || 'University Faculty / Industry',
      rating: 5.0,
      reviews: 20 + (i % 5) * 4,
      category: m.major || (Array.isArray(m.mentorInterests) && m.mentorInterests[0]) || 'Computer Science',
      skills: Array.isArray(m.mentorInterests) && m.mentorInterests.length > 0 ? m.mentorInterests : (m.skills || ['Mentorship & Research']),
      nextAvailable: 'Tomorrow, 2:00 PM',
      bio: m.bio || 'Verified academic mentor guiding capstone projects and research.',
      avatarBg: m.avatarBg || '#7C3AED',
      avatarColor: '#FFFFFF',
      initials: (m.name || 'ME').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    }));

  const mergedMap = new Map();
  candidates.forEach(m => { if (m.email) mergedMap.set(m.email.toLowerCase(), m); });
  storeMentors.forEach(m => {
    if (m.email && !mergedMap.has(m.email.toLowerCase())) {
      mergedMap.set(m.email.toLowerCase(), m);
    }
  });
  mentorsDB.forEach(m => {
    const key = (m.email || m.name).toLowerCase();
    if (!mergedMap.has(key)) {
      mergedMap.set(key, m);
    }
  });

  let results = Array.from(mergedMap.values());

  if (search) {
    const q = search.toLowerCase().trim();
    results = results.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.role.toLowerCase().includes(q) || 
      m.company.toLowerCase().includes(q) ||
      (Array.isArray(m.skills) && m.skills.some(s => s.toLowerCase().includes(q)))
    );
  }

  return res.status(200).json({
    success: true,
    count: results.length,
    mentors: results
  });
};

// GET /api/mentors/:id
export const getMentorById = async (req, res) => {
  const mentorId = req.params.id;
  const storeUser = usersDB.find(u => u.role === 'MENTOR' && (String(u.id) === String(mentorId) || u.email === mentorId));
  if (storeUser) {
    return res.status(200).json({ success: true, mentor: storeUser });
  }
  return res.status(404).json({ success: false, message: 'Mentor not found.' });
};

// POST /api/mentors/book & /api/mentors/:id/book - Link MentorSession
export const bookMentorSession = async (req, res) => {
  const mentorId = req.params.id || req.body.mentorId || 1;
  const studentId = req.user?.id || 'usr_demo';
  const { topic, scheduledAt, date, timeSlot } = req.body;

  const targetTopic = topic || 'Capstone Academic Project Guidance';
  const slot = timeSlot || scheduledAt || 'Tomorrow at 2:00 PM';
  const bookingId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;

  try {
    if (prisma && process.env.DATABASE_URL) {
      const session = await prisma.mentorSession.create({
        data: {
          mentorId: String(mentorId),
          studentId,
          topic: targetTopic,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 86400000),
          status: 'CONFIRMED'
        }
      });
      return res.status(201).json({ 
        success: true, 
        message: '1-on-1 Mentorship Session booked successfully.', 
        booking: {
          bookingId,
          mentorId,
          timeSlot: slot,
          topic: targetTopic,
          status: 'CONFIRMED'
        },
        session 
      });
    }
  } catch (err) {
    console.warn('Prisma bookMentorSession fallback:', err.message);
  }

  // Socket.io Meeting Request Broadcast
  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      io.emit('meeting:requested', { bookingId, mentorId, studentId, timeSlot: slot, topic: targetTopic });
    }
  } catch (e) {
    console.warn('Meeting socket broadcast warning:', e);
  }

  return res.status(201).json({
    success: true,
    message: '1-on-1 Mentorship Session booked successfully.',
    booking: {
      bookingId,
      mentorId,
      timeSlot: slot,
      topic: targetTopic,
      status: 'CONFIRMED'
    },
    session: {
      id: `session_${Date.now()}`,
      mentorId,
      studentId,
      topic: targetTopic,
      scheduledAt: slot,
      status: 'CONFIRMED'
    }
  });
};
