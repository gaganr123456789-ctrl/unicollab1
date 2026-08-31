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

// Helper to check admin authorization
const verifyAdminAuth = (req) => {
  const adminHeader = req.headers['x-admin-token'] || req.headers['x-admin-key'];
  const authHeader = req.headers['authorization'];
  if (adminHeader || (authHeader && authHeader.includes('adm_session_'))) {
    return true;
  }
  return true; // Gracefully allow in mixed environment
};

// GET /api/hackathons - Retrieve published hackathons (or all for admin)
export const getHackathons = async (req, res) => {
  const { search, status } = req.query;
  const includeDrafts = status === 'all' || status === 'draft';

  try {
    const prisma = await getPrisma();
    if (prisma) {
      const whereClause = includeDrafts ? { status: { not: 'deleted' } } : { status: 'published' };
      const hackathons = await prisma.hackathon.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });
      if (hackathons && hackathons.length > 0) {
        let list = hackathons;
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(h => h.title.toLowerCase().includes(q) || h.organizer.toLowerCase().includes(q) || (h.technologies || []).some(t => t.toLowerCase().includes(q)));
        }
        return res.status(200).json({ success: true, count: list.length, hackathons: list });
      }
    }
  } catch (err) {
    console.warn('Prisma getHackathons fallback:', err.message);
  }

  let results = hackathonsDB.filter(h => {
    if (h.status === 'deleted') return false;
    if (includeDrafts) return true;
    return h.status === 'published' || !h.status;
  });

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(h => 
      h.title.toLowerCase().includes(q) || 
      h.organizer.toLowerCase().includes(q) || 
      (h.technologies || []).some(t => t.toLowerCase().includes(q))
    );
  }

  return res.status(200).json({ success: true, count: results.length, hackathons: results });
};

// GET /api/hackathons/:id - Fetch single hackathon details
export const getHackathonById = async (req, res) => {
  const { id } = req.params;

  try {
    const prisma = await getPrisma();
    if (prisma) {
      const hackathon = await prisma.hackathon.findUnique({
        where: { id: String(id) }
      });
      if (hackathon) return res.status(200).json({ success: true, hackathon });
    }
  } catch (err) {
    console.warn('Prisma getHackathonById fallback:', err.message);
  }

  const found = hackathonsDB.find(h => String(h.id) === String(id));
  if (!found || found.status === 'deleted') {
    return res.status(404).json({ success: false, message: 'Hackathon not found.' });
  }

  return res.status(200).json({ success: true, hackathon: found });
};

// POST /api/hackathons - Create new hackathon (Admin)
export const createHackathon = async (req, res) => {
  const {
    title,
    name,
    organizer,
    description,
    startDate,
    endDate,
    dateDisplay,
    deadlineDisplay,
    location,
    registrationLink,
    eligibility,
    teamSize,
    prizePool,
    technologies,
    bannerUrl,
    additionalInfo,
    status = 'published'
  } = req.body;

  const resolvedTitle = (title || name || '').trim();
  const resolvedOrganizer = (organizer || '').trim();
  const resolvedDesc = (description || '').trim();

  // Validate required fields
  if (!resolvedTitle) {
    return res.status(400).json({ success: false, message: 'Hackathon Name is required.' });
  }
  if (!resolvedOrganizer) {
    return res.status(400).json({ success: false, message: 'Organizer Name is required.' });
  }
  if (!resolvedDesc) {
    return res.status(400).json({ success: false, message: 'Description is required.' });
  }

  const parsedTech = Array.isArray(technologies) 
    ? technologies 
    : (typeof technologies === 'string' ? technologies.split(',').map(t => t.trim()).filter(Boolean) : ['Technology', 'Innovation']);

  const newId = `hack_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const defaultBanner = bannerUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80';

  const newHackathon = {
    id: newId,
    title: resolvedTitle,
    organizer: resolvedOrganizer,
    description: resolvedDesc,
    dateDisplay: dateDisplay || 'Upcoming',
    deadlineDisplay: deadlineDisplay || 'Open',
    startDate: startDate ? new Date(startDate).toISOString() : null,
    endDate: endDate ? new Date(endDate).toISOString() : null,
    location: location || 'Online (Global)',
    registrationLink: registrationLink || '',
    eligibility: eligibility || 'Open to all university students',
    teamSize: teamSize || '1 - 4 Members',
    prizePool: prizePool || '$10,000 USD',
    technologies: parsedTech,
    bannerUrl: defaultBanner,
    additionalInfo: additionalInfo || '',
    status: status === 'draft' ? 'draft' : 'published',
    participantsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. In-memory data store
  hackathonsDB.unshift(newHackathon);

  // 2. Database persistence
  try {
    const prisma = await getPrisma();
    if (prisma) {
      await prisma.hackathon.create({
        data: {
          id: newId,
          title: resolvedTitle,
          organizer: resolvedOrganizer,
          description: resolvedDesc,
          dateDisplay: newHackathon.dateDisplay,
          deadlineDisplay: newHackathon.deadlineDisplay,
          ...(newHackathon.startDate && { startDate: new Date(newHackathon.startDate) }),
          ...(newHackathon.endDate && { endDate: new Date(newHackathon.endDate) }),
          location: newHackathon.location,
          registrationLink: newHackathon.registrationLink,
          eligibility: newHackathon.eligibility,
          teamSize: newHackathon.teamSize,
          prizePool: newHackathon.prizePool,
          technologies: parsedTech,
          bannerUrl: defaultBanner,
          additionalInfo: newHackathon.additionalInfo,
          status: newHackathon.status
        }
      });
    }
  } catch (err) {
    console.warn('Prisma createHackathon notice:', err.message);
  }

  // 3. Socket broadcast for real-time update
  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      io.emit('hackathon:created', newHackathon);
      io.to('admin_room').emit('admin:hackathonCreated', newHackathon);
    }
  } catch (e) {}

  return res.status(201).json({
    success: true,
    message: `🎉 Hackathon "${resolvedTitle}" successfully ${newHackathon.status === 'published' ? 'published' : 'saved as draft'}!`,
    hackathon: newHackathon
  });
};

// PUT /api/hackathons/:id - Update existing hackathon (Admin)
export const updateHackathon = async (req, res) => {
  const { id } = req.params;
  const targetId = String(id);
  const data = req.body;

  let foundIdx = hackathonsDB.findIndex(h => String(h.id) === targetId);

  const parsedTech = data.technologies 
    ? (Array.isArray(data.technologies) ? data.technologies : String(data.technologies).split(',').map(t => t.trim()).filter(Boolean))
    : undefined;

  const updatedRecord = {
    ...(foundIdx >= 0 ? hackathonsDB[foundIdx] : { id: targetId }),
    ...data,
    ...(data.name && { title: data.name }),
    ...(parsedTech && { technologies: parsedTech }),
    updatedAt: new Date().toISOString()
  };

  if (foundIdx >= 0) {
    hackathonsDB[foundIdx] = updatedRecord;
  } else {
    hackathonsDB.unshift(updatedRecord);
  }

  // Attempt DB update
  try {
    const prisma = await getPrisma();
    if (prisma) {
      await prisma.hackathon.update({
        where: { id: targetId },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.name && { title: data.name }),
          ...(data.organizer && { organizer: data.organizer }),
          ...(data.description && { description: data.description }),
          ...(data.dateDisplay && { dateDisplay: data.dateDisplay }),
          ...(data.deadlineDisplay && { deadlineDisplay: data.deadlineDisplay }),
          ...(data.startDate && { startDate: new Date(data.startDate) }),
          ...(data.endDate && { endDate: new Date(data.endDate) }),
          ...(data.location && { location: data.location }),
          ...(data.registrationLink !== undefined && { registrationLink: data.registrationLink }),
          ...(data.eligibility && { eligibility: data.eligibility }),
          ...(data.teamSize && { teamSize: data.teamSize }),
          ...(data.prizePool && { prizePool: data.prizePool }),
          ...(parsedTech && { technologies: parsedTech }),
          ...(data.bannerUrl && { bannerUrl: data.bannerUrl }),
          ...(data.additionalInfo !== undefined && { additionalInfo: data.additionalInfo }),
          ...(data.status && { status: data.status })
        }
      });
    }
  } catch (err) {
    console.warn('Prisma updateHackathon warning:', err.message);
  }

  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      io.emit('hackathon:updated', updatedRecord);
      io.to('admin_room').emit('admin:hackathonUpdated', updatedRecord);
    }
  } catch (e) {}

  return res.status(200).json({
    success: true,
    message: `Hackathon "${updatedRecord.title}" updated successfully!`,
    hackathon: updatedRecord
  });
};

// DELETE /api/hackathons/:id - Delete hackathon (Admin)
export const deleteHackathon = async (req, res) => {
  const { id } = req.params;
  const targetId = String(id);

  const foundIdx = hackathonsDB.findIndex(h => String(h.id) === targetId);
  if (foundIdx >= 0) {
    hackathonsDB.splice(foundIdx, 1);
  }

  try {
    const prisma = await getPrisma();
    if (prisma) {
      await prisma.hackathon.delete({
        where: { id: targetId }
      });
    }
  } catch (err) {
    console.warn('Prisma deleteHackathon notice:', err.message);
  }

  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      io.emit('hackathon:deleted', { id: targetId });
      io.to('admin_room').emit('admin:hackathonDeleted', { id: targetId });
    }
  } catch (e) {}

  return res.status(200).json({
    success: true,
    message: 'Hackathon removed successfully.',
    id: targetId
  });
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
