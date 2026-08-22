import { projectsDB } from '../db/dataStore.js';

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

// POST /api/projects
export const createProject = async (req, res) => {
  const { title, description, desc, category, level, tags, commitment, spots, lead, author } = req.body;
  const projectTitle = (title || 'New Collaborative Project').trim();
  const projectDesc = (description || desc || 'A new university student team project focused on innovation and collaboration.').trim();

  const formattedTags = Array.isArray(tags) 
    ? tags 
    : typeof tags === 'string' 
      ? tags.split(',').map(s => s.trim()).filter(Boolean) 
      : ['React', 'Node.js', 'Engineering'];

  const newProject = {
    id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    title: projectTitle,
    description: projectDesc,
    desc: projectDesc,
    category: category || 'SOFTWARE',
    level: level || 'INTERMEDIATE',
    status: 'Active',
    tags: formattedTags,
    commitment: commitment || '6-8 hrs/week',
    spots: spots || '3 spots left',
    lead: lead || author || req.user?.name || 'Alex Rivera',
    createdAt: new Date().toISOString()
  };

  try {
    const prisma = await getPrisma();
    if (prisma && req.user?.id) {
      await prisma.project.create({
        data: {
          title: projectTitle,
          description: projectDesc,
          category: category || 'SOFTWARE',
          ownerId: req.user.id
        }
      }).catch(e => console.warn('Prisma project create notice:', e.message));
    }
  } catch (err) {
    console.warn('Prisma createProject fallback:', err.message);
  }

  projectsDB.unshift(newProject);

  // Broadcast Socket.io event for live real-time UI updates across all clients
  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      io.emit('project:created', newProject);
    }
  } catch (e) {
    console.warn('Socket broadcast warning:', e.message);
  }

  return res.status(201).json({ success: true, message: 'Project created successfully.', project: newProject });
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

  return res.status(200).json({ success: true, message: 'Project updated successfully.', project: projectsDB[idx] });
};

// DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
  const projectId = req.params.id;

  try {
    const prisma = await getPrisma();
    if (prisma) {
      await prisma.project.delete({ where: { id: projectId } });
      return res.status(200).json({ success: true, message: 'Project deleted successfully.' });
    }
  } catch (err) {
    console.warn('Prisma deleteProject fallback:', err.message);
  }

  const idx = projectsDB.findIndex(p => p.id === Number(projectId) || p.id === projectId);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  projectsDB.splice(idx, 1);
  return res.status(200).json({ success: true, message: 'Project deleted successfully.' });
};
