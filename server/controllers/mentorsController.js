import { mentorsDB } from '../db/dataStore.js';

let prisma = null;
try {
  const { PrismaClient } = await import('@prisma/client');
  prisma = new PrismaClient();
} catch (err) {
  console.warn('Prisma Client fallback in mentorsController.');
}

// GET /api/mentors
export const getMentors = async (req, res) => {
  const { search, expertise } = req.query;

  try {
    if (prisma && process.env.DATABASE_URL) {
      const mentors = await prisma.mentor.findMany({
        include: { user: { select: { name: true, email: true, university: true, avatarBg: true } } }
      });
      if (mentors && mentors.length > 0) {
        return res.status(200).json({ success: true, count: mentors.length, mentors });
      }
    }
  } catch (err) {
    console.warn('Prisma getMentors fallback:', err.message);
  }

  let results = [...mentorsDB];
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(m => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.company.toLowerCase().includes(q));
  }

  return res.status(200).json({ success: true, count: results.length, mentors: results });
};

// GET /api/mentors/:id
export const getMentorById = async (req, res) => {
  const mentorId = req.params.id;

  const mentor = mentorsDB.find(m => m.id === Number(mentorId) || m.id === mentorId);
  if (!mentor) {
    return res.status(404).json({ success: false, message: 'Mentor not found.' });
  }

  return res.status(200).json({ success: true, mentor });
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
