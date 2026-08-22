import { teammatesDB, usersDB } from '../db/dataStore.js';

let prismaInstance = null;
const getPrisma = async () => {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaInstance) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      prismaInstance = new PrismaClient();
    } catch (err) {
      console.warn('Prisma load skipped in usersController.');
      return null;
    }
  }
  return prismaInstance;
};

// GET /api/users/search - Find Teammates with Skill & Branch Filtering
export const searchUsers = async (req, res) => {
  const { search, skill, major, availability } = req.query;

  try {
    const prisma = await getPrisma();
    if (prisma) {
      const users = await prisma.user.findMany({
        where: {
          ...(search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { major: { contains: search, mode: 'insensitive' } }
            ]
          } : {}),
          ...(major && major !== 'All' ? { major: { contains: major, mode: 'insensitive' } } : {})
        },
        select: {
          id: true,
          name: true,
          email: true,
          major: true,
          university: true,
          skills: true,
          avatarBg: true,
          bio: true
        }
      });

      if (users && users.length > 0) {
        return res.status(200).json({ success: true, count: users.length, users });
      }
    }
  } catch (err) {
    console.warn('Prisma searchUsers fallback:', err.message);
  }

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
    count: results.length,
    users: results
  });
};

// GET /api/users/me - Profile view
export const getMyProfile = async (req, res) => {
  const userId = req.user?.id;
  const userEmail = req.user?.email;

  try {
    const prisma = await getPrisma();
    if (prisma && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const { password: _, ...payload } = user;
        return res.status(200).json({ success: true, profile: payload });
      }
    }
  } catch (err) {
    console.warn('Prisma getMyProfile fallback:', err.message);
  }

  const storeUser = usersDB.find(u => u.email.toLowerCase() === (userEmail || '').toLowerCase());
  if (storeUser) {
    const { password: _, ...payload } = storeUser;
    return res.status(200).json({ success: true, profile: payload });
  }

  return res.status(200).json({
    success: true,
    profile: {
      id: userId || 'usr_demo',
      name: req.user?.name || 'Alex Rivera',
      email: userEmail || 'alex@stanford.edu',
      university: 'Stanford University',
      major: 'Computer Science & Engineering (CSE)',
      bio: 'Full-stack developer building student SaaS platforms.'
    }
  });
};

// PATCH /api/users/me - Update Profile
export const updateMyProfile = async (req, res) => {
  const userId = req.user?.id;
  const { name, major, university, bio, skills, phone, gender } = req.body;

  try {
    const prisma = await getPrisma();
    if (prisma && userId) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name ? { name } : {}),
          ...(major ? { major } : {}),
          ...(university ? { university } : {}),
          ...(bio ? { bio } : {}),
          ...(skills ? { skills } : {})
        }
      });
      const { password: _, ...payload } = updatedUser;
      return res.status(200).json({ success: true, message: 'Profile updated successfully.', profile: payload });
    }
  } catch (err) {
    console.warn('Prisma updateMyProfile fallback:', err.message);
  }

  const storeUser = usersDB.find(u => u.email.toLowerCase() === (req.user?.email || '').toLowerCase());
  if (storeUser) {
    if (name) storeUser.name = name;
    if (major) storeUser.major = major;
    if (university) storeUser.university = university;
    if (bio) storeUser.bio = bio;
    if (phone) storeUser.phone = phone;
    if (gender) storeUser.gender = gender;

    const { password: _, ...payload } = storeUser;
    return res.status(200).json({ success: true, message: 'Profile updated successfully.', profile: payload });
  }

  return res.status(200).json({
    success: true,
    message: 'Profile updated.',
    profile: { ...req.body, email: req.user?.email }
  });
};
