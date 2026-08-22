import { tasksDB } from '../db/dataStore.js';

let prismaInstance = null;
const getPrisma = async () => {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaInstance) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      prismaInstance = new PrismaClient();
    } catch (err) {
      console.warn('Prisma load skipped in boardsController.');
      return null;
    }
  }
  return prismaInstance;
};

// GET /api/boards
export const getBoards = async (req, res) => {
  try {
    const prisma = await getPrisma();
    if (prisma) {
      const boards = await prisma.board.findMany({
        include: {
          columns: {
            include: { cards: { orderBy: { position: 'asc' } } },
            orderBy: { position: 'asc' }
          }
        }
      });
      return res.status(200).json({ success: true, boards });
    }
  } catch (err) {
    console.warn('Prisma getBoards fallback:', err.message);
  }

  return res.status(200).json({
    success: true,
    boards: [
      {
        id: 'board_main',
        name: 'Main Sprint Board',
        columns: [
          { id: 'backlog', name: 'Backlog', cards: tasksDB.filter(t => t.column === 'backlog') },
          { id: 'in_progress', name: 'In Progress', cards: tasksDB.filter(t => t.column === 'in_progress') },
          { id: 'peer_review', name: 'Peer Review', cards: tasksDB.filter(t => t.column === 'peer_review') },
          { id: 'completed', name: 'Completed', cards: tasksDB.filter(t => t.column === 'completed') }
        ]
      }
    ]
  });
};

// GET /api/boards/:id
export const getBoardById = async (req, res) => {
  const { id } = req.params;

  try {
    const prisma = await getPrisma();
    if (prisma) {
      const board = await prisma.board.findUnique({
        where: { id },
        include: {
          columns: {
            include: { cards: { orderBy: { position: 'asc' } } },
            orderBy: { position: 'asc' }
          }
        }
      });
      if (board) return res.status(200).json({ success: true, board });
    }
  } catch (err) {
    console.warn('Prisma getBoardById fallback:', err.message);
  }

  return res.status(200).json({
    success: true,
    board: {
      id,
      name: 'Sprint Board',
      columns: [
        { id: 'backlog', name: 'Backlog', cards: tasksDB.filter(t => t.column === 'backlog') },
        { id: 'in_progress', name: 'In Progress', cards: tasksDB.filter(t => t.column === 'in_progress') }
      ]
    }
  });
};

// POST /api/boards/:id/columns
export const createColumn = async (req, res) => {
  const { id: boardId } = req.params;
  const { name, position } = req.body;

  if (!name) return res.status(400).json({ success: false, message: 'Column name is required.' });

  try {
    const prisma = await getPrisma();
    if (prisma) {
      const column = await prisma.boardColumn.create({
        data: {
          name: name.trim(),
          position: position || 0,
          boardId
        }
      });
      return res.status(201).json({ success: true, column });
    }
  } catch (err) {
    console.warn('Prisma createColumn fallback:', err.message);
  }

  return res.status(201).json({ success: true, column: { id: `col_${Date.now()}`, name, position: position || 0 } });
};

// POST /api/boards/:id/cards
export const createCard = async (req, res) => {
  const { columnId, title, description, priority, position } = req.body;

  if (!title || !columnId) {
    return res.status(400).json({ success: false, message: 'Title and columnId are required.' });
  }

  try {
    const prisma = await getPrisma();
    if (prisma) {
      const card = await prisma.card.create({
        data: {
          title: title.trim(),
          description: description || '',
          priority: priority || 'Medium',
          position: position || 0,
          columnId
        }
      });
      return res.status(201).json({ success: true, card });
    }
  } catch (err) {
    console.warn('Prisma createCard fallback:', err.message);
  }

  const newCard = { id: Date.now(), title, desc: description, priority, column: columnId, date: 'Oct 28' };
  tasksDB.push(newCard);
  return res.status(201).json({ success: true, card: newCard });
};

// PATCH /api/boards/:id/cards/:cardId - Updates ONLY columnId + position on Drag-and-Drop
export const updateCardPosition = async (req, res) => {
  const { cardId } = req.params;
  const { columnId, position } = req.body;

  try {
    const prisma = await getPrisma();
    if (prisma) {
      const updatedCard = await prisma.card.update({
        where: { id: cardId },
        data: {
          ...(columnId ? { columnId } : {}),
          ...(position !== undefined ? { position: parseFloat(position) } : {})
        }
      });
      return res.status(200).json({
        success: true,
        message: 'Card position updated.',
        card: updatedCard
      });
    }
  } catch (err) {
    console.warn('Prisma updateCardPosition fallback:', err.message);
  }

  const cardIndex = tasksDB.findIndex(t => t.id === Number(cardId) || t.id === cardId);
  if (cardIndex !== -1) {
    if (columnId) tasksDB[cardIndex].column = columnId;
    return res.status(200).json({ success: true, message: 'Card position updated.', card: tasksDB[cardIndex] });
  }

  return res.status(200).json({ success: true, message: 'Card position updated.', card: { id: cardId, columnId, position } });
};
