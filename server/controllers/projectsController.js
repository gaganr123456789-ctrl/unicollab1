import { projectsDB, saveProjectRecord, deleteProjectRecord } from '../db/dataStore.js';

let prismaInstance = null;
const getPrisma = async () => {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaInstance) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      prismaInstance = new PrismaClient();
    } catch (err) {
      console.warn('Prisma load skipped in projectsController.');
      return null;
    }
  }
  return prismaInstance;
};

// GET /api/projects
export const getProjects = async (req, res) => {
  const { category, search } = req.query;

  try {
    const prisma = await getPrisma();
    if (prisma) {
      const projects = await prisma.project.findMany({
        where: {
          ...(category && category !== 'All' ? { category } : {}),
          ...(search ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } }
            ]
          } : {})
        },
        include: { owner: { select: { name: true, email: true, university: true } } },
        orderBy: { createdAt: 'desc' }
      });

      if (projects && projects.length > 0) {
        return res.status(200).json({ success: true, count: projects.length, projects });
      }
    }
  } catch (err) {
    console.warn('Prisma getProjects fallback:', err.message);
  }

  let results = [...projectsDB];
  if (category && category !== 'All') {
    results = results.filter(p => p.category === category);
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  return res.status(200).json({ success: true, count: results.length, projects: results });
};

// GET /api/projects/:id
export const getProjectById = async (req, res) => {
  const projectId = req.params.id;

  try {
    const prisma = await getPrisma();
    if (prisma) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { owner: { select: { name: true, email: true } } }
      });
      if (project) {
        return res.status(200).json({ success: true, project });
      }
    }
  } catch (err) {
    console.warn('Prisma getProjectById fallback:', err.message);
  }

  const project = projectsDB.find(p => p.id === Number(projectId) || p.id === projectId);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  return res.status(200).json({ success: true, project });
};

// GET /api/projects/user/me - Scoped to logged in user (Owner or Team Member)
export const getMyProjects = async (req, res) => {
  const userId = req.user?.id || req.user?.userId;
  const userEmail = (req.user?.email || '').trim().toLowerCase();
  const userName = (req.user?.name || '').trim().toLowerCase();

  try {
    const prisma = await getPrisma();
    if (prisma && userId) {
      const userProjects = await prisma.project.findMany({
        where: {
          OR: [
            { ownerId: userId },
            ...(userEmail ? [{ owner: { email: { equals: userEmail, mode: 'insensitive' } } }] : []),
            { team: { members: { some: { userId: userId } } } },
            ...(userEmail ? [{ team: { members: { some: { user: { email: { equals: userEmail, mode: 'insensitive' } } } } } }] : [])
          ]
        },
        include: {
          owner: { select: { id: true, name: true, email: true, university: true, major: true, avatarBg: true } },
          team: {
            include: {
              members: {
                include: {
                  user: { select: { id: true, name: true, email: true, university: true, major: true, role: true, avatarBg: true } }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (userProjects) {
        return res.status(200).json({ success: true, count: userProjects.length, projects: userProjects });
      }
    }
  } catch (err) {
    console.warn('Prisma getMyProjects fallback:', err.message);
  }

  // In-memory fallback scoped strictly to user
  const userScoped = projectsDB.filter(p => {
    const isOwnerId = p.ownerId && p.ownerId === userId;
    const isOwnerEmail = p.ownerEmail && p.ownerEmail.toLowerCase() === userEmail;
    const isLeadName = p.lead && userName && p.lead.toLowerCase() === userName;
    const isMember = Array.isArray(p.teamMembers) && (p.teamMembers.includes(userId) || p.teamMembers.includes(userEmail));
    return isOwnerId || isOwnerEmail || isLeadName || isMember;
  }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return res.status(200).json({ success: true, count: userScoped.length, projects: userScoped });
};

// POST /api/projects
export const createProject = async (req, res) => {
  const { title, description, desc, category, level, tags, commitment, spots, lead, author } = req.body;
  const projectTitle = (title || 'New Collaborative Project').trim();
  const projectDesc = (description || desc || 'A new university student team project focused on innovation and collaboration.').trim();
  const userId = req.user?.id || req.user?.userId;
  const userEmail = req.user?.email;
  const userName = req.user?.name || lead || author || 'Alex Rivera';

  const formattedTags = Array.isArray(tags) 
    ? tags 
    : typeof tags === 'string' 
      ? tags.split(',').map(s => s.trim()).filter(Boolean) 
      : ['React', 'Node.js', 'Engineering'];

  let createdProject = null;

  try {
    const prisma = await getPrisma();
    if (prisma && userId) {
      // 1. Create default team for this project with owner as first member
      let team = null;
      try {
        team = await prisma.team.create({
          data: {
            name: `${projectTitle} Team`,
            members: {
              create: {
                userId: userId,
                role: 'Owner'
              }
            }
          }
        });
      } catch (teamErr) {
        console.warn('Prisma team create notice:', teamErr.message);
      }

      // 2. Create Project in Postgres DB
      createdProject = await prisma.project.create({
        data: {
          title: projectTitle,
          description: projectDesc,
          category: category || 'SOFTWARE',
          ownerId: userId,
          ...(team ? { teamId: team.id } : {})
        },
        include: {
          owner: { select: { id: true, name: true, email: true, university: true, major: true, avatarBg: true } },
          team: {
            include: {
              members: {
                include: {
                  user: { select: { id: true, name: true, email: true, university: true, major: true, role: true, avatarBg: true } }
                }
              }
            }
          }
        }
      });
    }
  } catch (err) {
    console.warn('Prisma createProject fallback:', err.message);
  }

  const fallbackProj = {
    id: createdProject?.id || `proj_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    title: projectTitle,
    description: projectDesc,
    desc: projectDesc,
    category: category || 'SOFTWARE',
    level: level || 'INTERMEDIATE',
    status: 'Active',
    tags: formattedTags,
    commitment: commitment || '6-8 hrs/week',
    spots: spots || '3 spots left',
    lead: userName,
    ownerId: userId,
    ownerEmail: userEmail,
    createdAt: new Date().toISOString()
  };

  const finalProject = createdProject || fallbackProj;
  saveProjectRecord(finalProject);

  // Broadcast Socket.io event for live real-time UI updates across all clients
  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      io.emit('project:created', finalProject);
      if (userId) {
        io.emit(`project:created:${userId}`, finalProject);
      }
    }
  } catch (e) {
    console.warn('Socket broadcast warning:', e.message);
  }

  return res.status(201).json({ success: true, message: 'Project created successfully.', project: finalProject });
};

// PUT /api/projects/:id
export const updateProject = async (req, res) => {
  const projectId = req.params.id;
  const { title, description, category, status } = req.body;

  try {
    const prisma = await getPrisma();
    if (prisma) {
      const updated = await prisma.project.update({
        where: { id: projectId },
        data: {
          ...(title ? { title } : {}),
          ...(description ? { description } : {}),
          ...(category ? { category } : {}),
          ...(status ? { status } : {})
        }
      });
      saveProjectRecord(updated);
      return res.status(200).json({ success: true, message: 'Project updated successfully.', project: updated });
    }
  } catch (err) {
    console.warn('Prisma updateProject fallback:', err.message);
  }

  const idx = projectsDB.findIndex(p => p.id === Number(projectId) || p.id === projectId);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  if (title) projectsDB[idx].title = title;
  if (description) projectsDB[idx].description = description;
  if (category) projectsDB[idx].category = category;
  if (status) projectsDB[idx].status = status;

  saveProjectRecord(projectsDB[idx]);
  return res.status(200).json({ success: true, message: 'Project updated successfully.', project: projectsDB[idx] });
};

// DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
  const projectId = req.params.id;

  try {
    const prisma = await getPrisma();
    if (prisma) {
      await prisma.project.delete({ where: { id: projectId } });
      deleteProjectRecord(projectId);
      return res.status(200).json({ success: true, message: 'Project deleted successfully.' });
    }
  } catch (err) {
    console.warn('Prisma deleteProject fallback:', err.message);
  }

  deleteProjectRecord(projectId);
  return res.status(200).json({ success: true, message: 'Project deleted successfully.' });
};
