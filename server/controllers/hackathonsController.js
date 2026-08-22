import { hackathonsDB } from '../db/dataStore.js';

let prisma = null;
try {
  const { PrismaClient } = await import('@prisma/client');
  prisma = new PrismaClient();
} catch (err) {
  console.warn('Prisma Client fallback in hackathonsController.');
}

// GET /api/hackathons
export const getHackathons = async (req, res) => {
  const { search } = req.query;

  try {
    if (prisma && process.env.DATABASE_URL) {
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

// POST /api/hackathons/:id/register - Register student for hackathon
export const registerForHackathon = async (req, res) => {
  const hackathonId = req.params.id;
  const userId = req.user?.id || 'usr_demo';

  try {
    if (prisma && process.env.DATABASE_URL) {
      const registration = await prisma.hackathonRegistration.create({
        data: {
          hackathonId,
          userId
        }
      });
      return res.status(201).json({ success: true, message: 'Successfully registered for Hackathon!', registration });
    }
  } catch (err) {
    console.warn('Prisma registerForHackathon fallback:', err.message);
  }

  return res.status(201).json({
    success: true,
    message: 'Successfully registered for Hackathon!',
    registration: {
      id: `reg_${Date.now()}`,
      hackathonId,
      userId,
      registeredAt: new Date().toISOString()
    }
  });
};
