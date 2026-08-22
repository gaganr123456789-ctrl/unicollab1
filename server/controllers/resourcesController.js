let prisma = null;
try {
  const { PrismaClient } = await import('@prisma/client');
  prisma = new PrismaClient();
} catch (err) {
  console.warn('Prisma Client fallback in resourcesController.');
}

const resourcesStore = [
  { id: 1, title: 'Complete React 19 Architecture Guide', category: 'Frontend', author: 'Code Morphicx', downloads: 1420, rating: 4.9 },
  { id: 2, title: 'Express & PostgreSQL Security Blueprint', category: 'Backend', author: 'Alex Rivera', downloads: 980, rating: 4.8 },
  { id: 3, title: 'UI/UX Design Systems for Capstone Projects', category: 'Design', author: 'Sarah Chen', downloads: 850, rating: 4.9 }
];

// GET /api/resources
export const getResources = async (req, res) => {
  const { category, search } = req.query;

  try {
    if (prisma && process.env.DATABASE_URL) {
      const resources = await prisma.resource.findMany({
        where: {
          ...(category && category !== 'All' ? { category } : {}),
          ...(search ? { title: { contains: search, mode: 'insensitive' } } : {})
        },
        include: { author: { select: { name: true, email: true } } }
      });
      if (resources && resources.length > 0) return res.status(200).json({ success: true, count: resources.length, resources });
    }
  } catch (err) {
    console.warn('Prisma getResources fallback:', err.message);
  }

  let results = [...resourcesStore];
  if (category && category !== 'All') results = results.filter(r => r.category === category);
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(r => r.title.toLowerCase().includes(q));
  }

  return res.status(200).json({ success: true, count: results.length, resources: results });
};

// POST /api/resources - Create resource with optional file attachment
export const createResource = async (req, res) => {
  const { title, description, category, fileUrl } = req.body;
  const authorId = req.user?.id || 'usr_demo';

  if (!title || !category) {
    return res.status(400).json({ success: false, message: 'Title and category are required.' });
  }

  try {
    if (prisma && process.env.DATABASE_URL) {
      const resource = await prisma.resource.create({
        data: {
          title: title.trim(),
          description: description || '',
          category,
          fileUrl: fileUrl || '',
          authorId
        }
      });
      return res.status(201).json({ success: true, message: 'Resource published successfully.', resource });
    }
  } catch (err) {
    console.warn('Prisma createResource fallback:', err.message);
  }

  const newResource = {
    id: Date.now(),
    title: title.trim(),
    description: description || '',
    category,
    author: req.user?.name || 'Alex Rivera',
    downloads: 1,
    rating: 5.0
  };

  resourcesStore.push(newResource);
  return res.status(201).json({ success: true, message: 'Resource published successfully.', resource: newResource });
};
