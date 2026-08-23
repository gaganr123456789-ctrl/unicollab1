import { hackathonsDB, hackathonRegistrationsDB } from '../db/dataStore.js';

let prismaInstance = null;
const getPrisma = async () => {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaInstance) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      prismaInstance = new PrismaClient();
    } catch (err) {
      console.warn('Prisma load skipped in hackathonsController.');
      return null;
    }
  }
  return prismaInstance;
};

// GET /api/hackathons
export const getHackathons = async (req, res) => {
  const { search } = req.query;

  try {
    const prisma = await getPrisma();
    if (prisma) {
      const hackathons = await prisma.hackathon.findMany({
        orderBy: { startDate: 'asc' }
      });
      if (hackathons && hackathons.length > 0) return res.status(200).json({ success: true, count: hackathons.length, hackathons });
    }
  } catch (err) {
    console.warn('Prisma getHackathons fallback:', err.message);
  }

  let results = [...hackathonsDB];
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(h => h.title.toLowerCase().includes(q) || h.organizer.toLowerCase().includes(q));
  }

  return res.status(200).json({ success: true, count: results.length, hackathons: results });
};

// POST /api/hackathons/register & /api/hackathons/:id/register
export const registerForHackathon = async (req, res) => {
  const hackathonId = req.params.id || req.body.hackathonId || 301;
  const {
    hackathonTitle,
    teamName,
    teamDetails,
    mobileNumber,
    email,
    collegeName,
    usn,
    studentName,
    membersCount
  } = req.body;

  const resolvedHackathonTitle = hackathonTitle || (hackathonsDB.find(h => String(h.id) === String(hackathonId))?.title) || 'Global Innovation Hackathon 2026';
  const resolvedStudentName = studentName || req.user?.name || (email ? email.split('@')[0] : 'Student Lead');
  const resolvedEmail = email || req.user?.email || 'student@university.edu';
  const registrationId = `HACK-${Math.floor(100000 + Math.random() * 900000)}`;

  const newRegistration = {
    id: registrationId,
    registrationId,
    hackathonId: String(hackathonId),
    hackathonTitle: resolvedHackathonTitle,
    teamName: teamName || 'Team Code Morphicx',
    teamDetails: teamDetails || '4 members',
    membersCount: Number(membersCount) || 4,
    studentName: resolvedStudentName,
    email: resolvedEmail,
    mobileNumber: mobileNumber || '+91 98765 43210',
    collegeName: collegeName || 'The National Institute of Engineering (NIE)',
    usn: usn || '4NI21CS042',
    status: 'CONFIRMED',
    registeredAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  // 1. Save to in-memory store
  hackathonRegistrationsDB.unshift(newRegistration);

  // 2. Broadcast to Admin Portal in real time via Socket.io
  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      io.to('admin_room').emit('admin:newHackathonRegistration', newRegistration);
      io.emit('admin:newHackathonRegistration', newRegistration);
    }
  } catch (e) {
    console.warn('Hackathon socket broadcast warning:', e);
  }

  // 3. Attempt database persistence if available
  try {
    const prisma = await getPrisma();
    if (prisma && req.user?.id) {
      await prisma.hackathonRegistration.create({
        data: {
          hackathonId: String(hackathonId),
          userId: req.user.id
        }
      });
    }
  } catch (err) {
    console.warn('Prisma hackathon registration notice:', err.message);
  }

  return res.status(201).json({
    success: true,
    message: `Successfully registered team "${newRegistration.teamName}" for ${resolvedHackathonTitle}!`,
    registrationId,
    registration: newRegistration
  });
};

// GET /api/hackathons/registrations - Retrieve all Hackathon Registrations for Admin & Dashboard
export const getHackathonRegistrations = async (req, res) => {
  return res.status(200).json({
    success: true,
    count: hackathonRegistrationsDB.length,
    registrations: hackathonRegistrationsDB
  });
};
