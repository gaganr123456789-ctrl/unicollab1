import express from 'express';
import { notificationsDB } from './invitesRoutes.js';
import { getPrisma } from '../db/postgres.js';

const router = express.Router();

// GET /api/notifications
router.get('/', async (req, res) => {
  const { userId } = req.query;

  try {
    const prisma = await getPrisma();
    if (prisma) {
      const dbNotifs = await prisma.notification.findMany({
        where: userId ? { userId } : {},
        orderBy: { createdAt: 'desc' }
      });

      if (dbNotifs && dbNotifs.length > 0) {
        return res.status(200).json({
          success: true,
          total: dbNotifs.length,
          unreadCount: dbNotifs.filter(n => !n.read).length,
          notifications: dbNotifs.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type === 'MENTORSHIP_REQUEST' ? 'mentorship' : 'team-invite',
            category: n.type === 'MENTORSHIP_REQUEST' ? 'Mentorship' : 'Team Invites',
            time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: !n.read,
            inviteId: n.inviteId,
            sender: n.title.includes('Mentorship') ? 'Academic Mentor' : 'Teammate Candidate',
            avatarInitials: n.title.includes('Mentorship') ? 'AM' : 'TM',
            actionType: n.inviteId ? 'invite-buttons' : 'view'
          }))
        });
      }
    }
  } catch (err) {
    console.warn('Prisma notifications query fallback:', err.message);
  }

  return res.status(200).json({
    success: true,
    total: notificationsDB.length,
    unreadCount: notificationsDB.filter(n => n.unread || !n.read).length,
    notifications: notificationsDB
  });
});

// POST /api/notifications/mark-read
router.post('/mark-read', (req, res) => {
  const { notificationId } = req.body;
  
  if (notificationId) {
    const notif = notificationsDB.find(n => n.id === Number(notificationId));
    if (notif) notif.read = true;
  } else {
    notificationsDB.forEach(n => n.read = true);
  }

  return res.status(200).json({
    success: true,
    message: 'Notifications marked as read.',
    unreadCount: notificationsDB.filter(n => !n.read).length
  });
});

// POST /api/notifications/clear-all
router.post('/clear-all', (req, res) => {
  notificationsDB.length = 0;
  return res.status(200).json({
    success: true,
    message: 'All notifications cleared.',
    notifications: []
  });
});

export default router;
