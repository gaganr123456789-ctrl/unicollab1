import { usersDB, projectsDB, hackathonsDB, mentorsDB } from '../db/dataStore.js';

let prismaInstance = null;
const getPrisma = async () => {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaInstance) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      prismaInstance = new PrismaClient();
    } catch (err) {
      console.warn('Prisma load skipped in searchController.');
      return null;
    }
  }
  return prismaInstance;
};

// Helper: check if any skill in array/string matches query
const matchesSkills = (skills, query) => {
  if (!skills) return false;
  const q = query.toLowerCase();
  if (Array.isArray(skills)) {
    return skills.some(s => String(s).toLowerCase().includes(q));
  }
  return String(skills).toLowerCase().includes(q);
};

// GET /api/search?q=query&type=all
export const globalSearch = async (req, res) => {
  const rawQuery = (req.query.q || req.query.query || '').trim();
  const typeFilter = (req.query.type || 'all').toLowerCase();

  if (!rawQuery) {
    return res.status(200).json({
      success: true,
      query: '',
      total: 0,
      results: [],
      grouped: {
        students: [],
        projects: [],
        hackathons: [],
        mentors: []
      }
    });
  }

  const q = rawQuery.toLowerCase();

  try {
    // ------------------------------------------------------------------------
    // 1. Search Students / Teammates (usersDB + Prisma)
    // ------------------------------------------------------------------------
    let allUsers = [...usersDB];
    try {
      const prisma = await getPrisma();
      if (prisma) {
        const dbUsers = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            university: true,
            major: true,
            degree: true,
            skills: true,
            projectFocus: true,
            bio: true,
            avatarBg: true,
            createdAt: true
          }
        });
        if (Array.isArray(dbUsers) && dbUsers.length > 0) {
          const userMap = new Map();
          for (const u of allUsers) {
            if (u && u.email) userMap.set(u.email.toLowerCase().trim(), u);
          }
          for (const u of dbUsers) {
            if (u && u.email) {
              const key = u.email.toLowerCase().trim();
              userMap.set(key, { ...(userMap.get(key) || {}), ...u });
            }
          }
          allUsers = Array.from(userMap.values());
        }
      }
    } catch (dbErr) {
      console.warn('Prisma searchUsers fallback in searchController:', dbErr.message);
    }

    const matchedStudents = allUsers.filter(u => {
      if (!u) return false;
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const major = (u.major || u.degree || '').toLowerCase();
      const university = (u.university || '').toLowerCase();
      const projectFocus = (u.projectFocus || '').toLowerCase();
      const bio = (u.bio || '').toLowerCase();
      const roleTitle = (u.roleTitle || '').toLowerCase();

      return (
        name.includes(q) ||
        email.includes(q) ||
        major.includes(q) ||
        university.includes(q) ||
        projectFocus.includes(q) ||
        bio.includes(q) ||
        roleTitle.includes(q) ||
        matchesSkills(u.skills, q)
      );
    }).map(u => ({
      id: u.id || `usr_${u.email}`,
      entityType: 'student',
      typeLabel: 'Student / Teammate',
      title: u.name || (u.email ? u.email.split('@')[0] : 'Student User'),
      subtitle: u.major || u.degree || 'Engineering & Technology',
      description: u.projectFocus || u.bio || `${u.university || 'University'} Student`,
      skills: Array.isArray(u.skills) ? u.skills : typeof u.skills === 'string' ? u.skills.split(',').map(s => s.trim()) : [],
      university: u.university || 'Campus Network',
      avatarBg: u.avatarBg || '#2563EB',
      avatarColor: u.avatarColor || '#FFFFFF',
      email: u.email,
      targetPage: 'find-teammates',
      raw: u
    }));

    // ------------------------------------------------------------------------
    // 2. Search Projects (projectsDB + Prisma)
    // ------------------------------------------------------------------------
    let allProjects = [...projectsDB];
    try {
      const prisma = await getPrisma();
      if (prisma) {
        const dbProjects = await prisma.project.findMany({
          include: { owner: { select: { name: true, email: true, university: true } } }
        });
        if (Array.isArray(dbProjects) && dbProjects.length > 0) {
          const projMap = new Map();
          for (const p of allProjects) {
            if (p && p.id) projMap.set(String(p.id), p);
          }
          for (const p of dbProjects) {
            if (p && p.id) projMap.set(String(p.id), { ...(projMap.get(String(p.id)) || {}), ...p });
          }
          allProjects = Array.from(projMap.values());
        }
      }
    } catch (projErr) {
      console.warn('Prisma searchProjects fallback:', projErr.message);
    }

    const matchedProjects = allProjects.filter(p => {
      if (!p) return false;
      const title = (p.title || '').toLowerCase();
      const desc = (p.desc || p.description || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      const lead = (p.lead || p.author || p.owner?.name || '').toLowerCase();

      return (
        title.includes(q) ||
        desc.includes(q) ||
        category.includes(q) ||
        lead.includes(q) ||
        matchesSkills(p.tags, q)
      );
    }).map(p => ({
      id: p.id || `proj_${p.title}`,
      entityType: 'project',
      typeLabel: 'Project',
      title: p.title || 'Untitled Project',
      subtitle: `${p.category || 'SOFTWARE'} • ${p.level || 'INTERMEDIATE'}`,
      description: p.desc || p.description || 'Collaborative student capstone project.',
      skills: Array.isArray(p.tags) ? p.tags : typeof p.tags === 'string' ? p.tags.split(',').map(s => s.trim()) : [],
      status: p.status || 'Active',
      lead: p.lead || p.author || p.owner?.name || 'Student Lead',
      commitment: p.commitment || '6-8 hrs/week',
      spots: p.spots || 'Open spots',
      targetPage: 'projects',
      raw: p
    }));

    // ------------------------------------------------------------------------
    // 3. Search Hackathons (hackathonsDB)
    // ------------------------------------------------------------------------
    const matchedHackathons = (hackathonsDB || []).filter(h => {
      if (!h) return false;
      const title = (h.title || '').toLowerCase();
      const desc = (h.description || '').toLowerCase();
      const organizer = (h.organizer || '').toLowerCase();
      const location = (h.location || '').toLowerCase();
      const eligibility = (h.eligibility || '').toLowerCase();

      return (
        title.includes(q) ||
        desc.includes(q) ||
        organizer.includes(q) ||
        location.includes(q) ||
        eligibility.includes(q) ||
        matchesSkills(h.technologies, q)
      );
    }).map(h => ({
      id: h.id || `hack_${h.title}`,
      entityType: 'hackathon',
      typeLabel: 'Hackathon',
      title: h.title,
      subtitle: `${h.organizer || 'UniCollab'} • ${h.prizePool || 'Cash Prizes'}`,
      description: h.description,
      skills: Array.isArray(h.technologies) ? h.technologies : [],
      dateDisplay: h.dateDisplay || 'Upcoming',
      location: h.location || 'Online',
      targetPage: 'hackathons',
      raw: h
    }));

    // ------------------------------------------------------------------------
    // 4. Search Mentors (mentorsDB)
    // ------------------------------------------------------------------------
    const matchedMentors = (mentorsDB || []).filter(m => {
      if (!m) return false;
      const name = (m.name || '').toLowerCase();
      const role = (m.role || m.title || '').toLowerCase();
      const company = (m.company || m.university || '').toLowerCase();
      const category = (m.category || '').toLowerCase();
      const bio = (m.bio || '').toLowerCase();

      return (
        name.includes(q) ||
        role.includes(q) ||
        company.includes(q) ||
        category.includes(q) ||
        bio.includes(q) ||
        matchesSkills(m.skills, q)
      );
    }).map(m => ({
      id: m.id || `mentor_${m.name}`,
      entityType: 'mentor',
      typeLabel: 'Mentor',
      title: m.name,
      subtitle: m.role || m.title || 'Academic Mentor',
      description: m.bio || `Specialist at ${m.company || m.university || 'University Lab'}`,
      skills: Array.isArray(m.skills) ? m.skills : [],
      category: m.category || 'Engineering',
      rating: m.rating || 5.0,
      nextAvailable: m.nextAvailable || 'This Week',
      targetPage: 'mentor-portal',
      raw: m
    }));

    // Grouped Results
    const grouped = {
      students: matchedStudents,
      projects: matchedProjects,
      hackathons: matchedHackathons,
      mentors: matchedMentors
    };

    // Filter by type if requested
    let combined = [];
    if (typeFilter === 'students' || typeFilter === 'teammates') {
      combined = matchedStudents;
    } else if (typeFilter === 'projects') {
      combined = matchedProjects;
    } else if (typeFilter === 'hackathons') {
      combined = matchedHackathons;
    } else if (typeFilter === 'mentors') {
      combined = matchedMentors;
    } else {
      combined = [
        ...matchedStudents,
        ...matchedProjects,
        ...matchedHackathons,
        ...matchedMentors
      ];
    }

    return res.status(200).json({
      success: true,
      query: rawQuery,
      total: combined.length,
      results: combined,
      grouped
    });

  } catch (err) {
    console.error('Global search error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to execute search.',
      error: err.message
    });
  }
};
