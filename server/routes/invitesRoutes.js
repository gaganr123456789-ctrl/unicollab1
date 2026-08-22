import express from 'express';
import { getPrisma } from '../db/postgres.js';

const router = express.Router();

export const invitesDB = [];
export const notificationsDB = [
  {
    id: 'notif_seed_1',
    userId: 'seed',
    title: 'Team Invitation Received',
    message: 'Sarah Chen invited you to join the FinTrack Mobile capstone project.',
    type: 'TEAM_INVITE',
    category: 'Team Invites',
    time: '10 mins ago',
    read: false,
    actionType: 'invite-buttons',
    targetPage: 'workspace'
  }
];

// POST /api/invites - Create a Team or Mentorship Invite
router.post('/', async (req, res) => {
  const { senderId = 'user_current', senderName = 'Student User', recipientId, recipientName, type = 'TEAM_INVITE', message = '' } = req.body;

  if (!recipientId) {
    return res.status(400).json({ success: false, message: 'Recipient ID or identifier is required.' });
  }

  const normalizedType = type === 'MENTORSHIP_REQUEST' ? 'MENTORSHIP_REQUEST' : 'TEAM_INVITE';

  try {
    const prisma = await getPrisma();
    if (prisma) {
      // Check for duplicate pending invite
      const existing = await prisma.invite.findFirst({
        where: {
          senderId,
          recipientId,
          status: 'PENDING'
        }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'An invitation to this person is already pending.'
        });
      }

      const newInvite = await prisma.invite.create({
        data: {
          senderId,
          recipientId,
          type: normalizedType,
          status: 'PENDING',
          message
        }
      });

      // Create Notification record for recipient
      const notifTitle = normalizedType === 'MENTORSHIP_REQUEST' ? 'Mentorship Request Received 👨‍🏫' : 'Team Invitation Received 🎓';
      const notifMsg = normalizedType === 'MENTORSHIP_REQUEST' 
        ? `${senderName} sent you a mentorship session guidance request.` 
        : `${senderName} invited you to team up on a capstone project!`;

      const notification = await prisma.notification.create({
        data: {
          userId: recipientId,
          title: notifTitle,
          message: notifMsg,
          type: normalizedType,
          inviteId: newInvite.id,
          read: false
        }
      });

      // Emit Socket.io real-time event to recipient
      try {
        const io = req.app?.get('io') || global.io;
        if (io) {
          io.to(`user_${recipientId}`).emit('notification:new', notification);
          io.emit('notification:new', notification);
          console.log(`📡 [SOCKET.IO] Broadcasted notification:new event to user_${recipientId}`);
        }
      } catch (e) {
        console.warn('Socket broadcast warning:', e.message);
      }

      return res.status(201).json({
        success: true,
        message: normalizedType === 'MENTORSHIP_REQUEST' ? 'Mentorship request sent successfully!' : 'Team invitation sent successfully!',
        invite: newInvite
      });
    }
  } catch (err) {
    console.warn('Prisma invite error, falling back to dataStore:', err.message);
  }

  // DataStore In-Memory Fallback
  const existingStoreInvite = invitesDB.find(i => i.senderId === senderId && i.recipientId === recipientId && i.status === 'PENDING');
  if (existingStoreInvite) {
    return res.status(400).json({ success: false, message: 'An invitation to this person is already pending.' });
  }

  const newInvite = {
    id: `inv_${Date.now()}`,
    senderId,
    senderName,
    recipientId,
    recipientName: recipientName || 'User',
    type: normalizedType,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };
  invitesDB.push(newInvite);

  const notifTitle = normalizedType === 'MENTORSHIP_REQUEST' ? 'Mentorship Request Received 👨‍🏫' : 'Team Invitation Received 🎓';
  const notifMsg = normalizedType === 'MENTORSHIP_REQUEST' 
    ? `${senderName} sent you a mentorship session guidance request.` 
    : `${senderName} invited you to team up on a capstone project!`;

  const newNotification = {
    id: `notif_${Date.now()}`,
    userId: recipientId,
    title: notifTitle,
    message: notifMsg,
    type: normalizedType,
    category: normalizedType === 'MENTORSHIP_REQUEST' ? 'Mentorship' : 'Team Invites',
    inviteId: newInvite.id,
    sender: senderName,
    avatarInitials: senderName.split(' ').map(n => n[0]).join('').slice(0, 2),
    unread: true,
    time: 'Just now',
    actionType: 'invite-buttons'
  };

  notificationsDB.unshift(newNotification);

  // Emit Socket.io real-time event to recipient
  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      io.to(`user_${recipientId}`).emit('notification:new', newNotification);
      io.emit('notification:new', newNotification);
    }
  } catch (e) {
    console.warn('Socket broadcast warning:', e.message);
  }

  return res.status(201).json({
    success: true,
    message: normalizedType === 'MENTORSHIP_REQUEST' ? 'Mentorship request sent successfully!' : 'Team invitation sent successfully!',
    invite: newInvite
  });
});

// GET /api/invites/sent - Get pending sent invite recipient IDs for current user
router.get('/sent', (req, res) => {
  const { senderId = 'user_current' } = req.query;
  const pendingRecipients = invitesDB
    .filter(i => (i.senderId === senderId || senderId === 'user_current') && i.status === 'PENDING')
    .map(i => i.recipientId);

  return res.status(200).json({
    success: true,
    pendingRecipients
  });
});

// POST /api/invites/:id/respond - Accept or Decline an invite
router.post('/:id/respond', async (req, res) => {
  const inviteId = req.params.id;
  const { action, responderName = 'Student User' } = req.body; // 'ACCEPT' or 'DECLINE'

  const normalizedAction = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';

  try {
    const prisma = await getPrisma();
    if (prisma) {
      const invite = await prisma.invite.update({
        where: { id: inviteId },
        data: { status: normalizedAction }
      });

      // Create notification for original sender
      const notifTitle = normalizedAction === 'ACCEPTED' ? 'Invite Accepted! 🎉' : 'Invite Declined';
      const notifMsg = `${responderName} ${normalizedAction === 'ACCEPTED' ? 'accepted your invitation to team up!' : 'declined the invitation.'}`;

      const senderNotification = await prisma.notification.create({
        data: {
          userId: invite.senderId,
          title: notifTitle,
          message: notifMsg,
          type: 'RESPONSE',
          read: false
        }
      });

      try {
        const io = req.app?.get('io') || global.io;
        if (io) {
          io.to(`user_${invite.senderId}`).emit('notification:new', senderNotification);
          io.emit('notification:new', senderNotification);
        }
      } catch (e) {
        console.warn('Socket broadcast error:', e.message);
      }

      return res.status(200).json({
        success: true,
        message: `Invite ${normalizedAction.toLowerCase()} successfully!`,
        invite
      });
    }
  } catch (err) {
    console.warn('Prisma invite respond fallback:', err.message);
  }

  // DataStore Fallback
  const invite = invitesDB.find(i => i.id === inviteId);
  if (invite) {
    invite.status = normalizedAction;

    const notifTitle = normalizedAction === 'ACCEPTED' ? 'Invite Accepted! 🎉' : 'Invite Declined';
    const notifMsg = `${responderName} ${normalizedAction === 'ACCEPTED' ? 'accepted your invitation to team up!' : 'declined the invitation.'}`;

    const senderNotif = {
      id: `notif_resp_${Date.now()}`,
      userId: invite.senderId,
      title: notifTitle,
      message: notifMsg,
      type: 'RESPONSE',
      category: 'Team Invites',
      sender: responderName,
      unread: true,
      time: 'Just now'
    };
    notificationsDB.unshift(senderNotif);

    try {
      const io = req.app?.get('io') || global.io;
      if (io) {
        io.to(`user_${invite.senderId}`).emit('notification:new', senderNotif);
        io.emit('notification:new', senderNotif);
      }
    } catch (e) {
      console.warn('Socket broadcast error:', e.message);
    }

    return res.status(200).json({
      success: true,
      message: `Invite ${normalizedAction.toLowerCase()} successfully!`,
      invite
    });
  }

  return res.status(404).json({ success: false, message: 'Invite not found.' });
});

export default router;
