import express from 'express';
import { getPrisma } from '../db/postgres.js';
import { invitesDB, teamsDB, teamMembersDB, usersDB, saveConnectionRecord, saveInviteRecord } from '../db/dataStore.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'unicollab_jwt_secret_key_2026';

export const notificationsDB = [
  {
    id: 'notif_seed_drone',
    userId: 'seed',
    title: 'Team Invitation Received',
    message: 'Dr. Ananya Sharma invited you to join the Autonomous Drone Navigation team.',
    type: 'TEAM_INVITE',
    category: 'Team Invites',
    time: '10 mins ago',
    read: false,
    inviteId: 'inv_seed_drone',
    teamId: 'team_drone_1',
    teamName: 'Autonomous Drone Navigation',
    sender: 'Dr. Ananya Sharma',
    avatarInitials: 'AS',
    actionType: 'invite-buttons',
    targetPage: 'workspace'
  }
];

// Auth Helper
const getAuthenticatedUser = (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded) return decoded;
    } catch (e) {
      // Non-blocking JWT verification
    }
  }
  return null;
};

// --------------------------------------------------------------------------
// 1. POST /api/invites - Create a Team Invitation Request
// --------------------------------------------------------------------------
router.post('/', async (req, res) => {
  const authUser = getAuthenticatedUser(req);

  const senderId = authUser?.id || req.body.senderId || 'user_current';
  const senderName = authUser?.name || req.body.senderName || 'Student User';
  const senderEmail = (authUser?.email || req.body.senderEmail || '').toLowerCase().trim();

  const {
    recipientId,
    receiverId,
    recipientEmail = '',
    recipientName = 'Classmate',
    teamId = 'team_custom',
    teamName = 'Capstone Project Team',
    teamDesc = 'University collaborative engineering capstone project.',
    teamLeader = senderName,
    projectCategory = 'Engineering',
    requiredSkills = ['Full-Stack', 'Problem Solving'],
    type = 'TEAM_INVITE',
    message = ''
  } = req.body;

  const targetRecipientId = recipientId || receiverId || recipientEmail;

  if (!targetRecipientId) {
    return res.status(400).json({ success: false, message: 'Recipient identifier or email is required.' });
  }

  const normalizedRecipientEmail = recipientEmail.toLowerCase().trim();

  // Check 1: Is recipient already a member of this team?
  const isAlreadyMember = teamMembersDB.some(m => 
    m.teamId === teamId && (
      (m.userId && targetRecipientId && String(m.userId) === String(targetRecipientId)) ||
      (m.email && normalizedRecipientEmail && m.email.toLowerCase().trim() === normalizedRecipientEmail)
    )
  );

  if (isAlreadyMember) {
    return res.status(400).json({
      success: false,
      message: `${recipientName} is already a member of the ${teamName} team.`
    });
  }

  // Check 2: Is there already an active pending invitation for this recipient and team?
  const isAlreadyPending = invitesDB.some(inv =>
    inv.teamId === teamId &&
    inv.status === 'pending' && (
      (inv.recipientId && targetRecipientId && String(inv.recipientId) === String(targetRecipientId)) ||
      (inv.recipientEmail && normalizedRecipientEmail && inv.recipientEmail.toLowerCase().trim() === normalizedRecipientEmail)
    )
  );

  if (isAlreadyPending) {
    return res.status(400).json({
      success: false,
      message: `An invitation for the ${teamName} team is already pending for this student.`
    });
  }

  // Ensure team exists in teamsDB
  const existingTeam = teamsDB.find(t => t.id === teamId || t.name.toLowerCase() === teamName.toLowerCase());
  const resolvedTeamId = existingTeam ? existingTeam.id : teamId;
  const resolvedTeamName = existingTeam ? existingTeam.name : teamName;
  const resolvedTeamDesc = existingTeam ? existingTeam.description : teamDesc;
  const resolvedSkills = existingTeam ? existingTeam.requiredSkills : (Array.isArray(requiredSkills) ? requiredSkills : ['Collaboration']);

  if (!existingTeam) {
    teamsDB.push({
      id: resolvedTeamId,
      name: resolvedTeamName,
      description: resolvedTeamDesc,
      category: projectCategory,
      leadId: senderId,
      leadName: senderName,
      leadEmail: senderEmail,
      requiredSkills: resolvedSkills,
      createdAt: new Date().toISOString()
    });
  }

  const newInviteId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const inviteMessage = message || `${senderName} invited you to join the ${resolvedTeamName} team.`;

  const newInvite = {
    id: newInviteId,
    senderId,
    senderName,
    senderEmail,
    recipientId: targetRecipientId,
    receiverId: targetRecipientId,
    recipientName,
    recipientEmail: normalizedRecipientEmail,
    type: 'TEAM_INVITE',
    status: 'pending',
    teamId: resolvedTeamId,
    teamName: resolvedTeamName,
    teamDesc: resolvedTeamDesc,
    teamLeader: existingTeam?.leadName || senderName,
    projectCategory: existingTeam?.category || projectCategory,
    requiredSkills: resolvedSkills,
    message: inviteMessage,
    createdAt: new Date().toISOString()
  };

  // Push to invitesDB
  invitesDB.unshift(newInvite);

  // Create Connected Actionable Notification
  const newNotification = {
    id: `notif_${Date.now()}`,
    userId: targetRecipientId,
    recipientEmail: normalizedRecipientEmail,
    title: 'Team Invitation Received',
    message: `${senderName} invited you to join the ${resolvedTeamName} team.`,
    type: 'TEAM_INVITE',
    category: 'Team Invites',
    time: 'Just now',
    read: false,
    inviteId: newInvite.id,
    teamId: resolvedTeamId,
    teamName: resolvedTeamName,
    sender: senderName,
    avatarInitials: senderName.split(' ').map(n => n[0]).join('').slice(0, 2),
    actionType: 'invite-buttons',
    targetPage: 'workspace',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  notificationsDB.unshift(newNotification);

  // PostgreSQL Prisma Sync (if available)
  try {
    const prisma = await getPrisma();
    if (prisma) {
      const validSenderId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(senderId) ? senderId : null;
      const validRecipientId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetRecipientId) ? targetRecipientId : null;

      if (validSenderId && validRecipientId) {
        await prisma.invite.create({
          data: {
            id: newInvite.id,
            senderId: validSenderId,
            recipientId: validRecipientId,
            type: 'TEAM_INVITE',
            status: 'pending',
            teamId: resolvedTeamId,
            teamName: resolvedTeamName,
            teamDesc: resolvedTeamDesc,
            teamLeader: existingTeam?.leadName || senderName,
            projectCategory: existingTeam?.category || projectCategory,
            requiredSkills: resolvedSkills,
            message: inviteMessage
          }
        });
      }
    }
  } catch (err) {
    console.warn('Prisma invite creation notice:', err.message);
  }

  // Socket.IO Real-Time Dispatch
  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      io.to(`user_${targetRecipientId}`).emit('notification:new', newNotification);
      io.to(`user_${normalizedRecipientEmail}`).emit('notification:new', newNotification);
      io.emit('notification:new', newNotification);
      io.emit('invite:received', newInvite);
      console.log(`📡 [SOCKET.IO] Dispatched team invitation to ${targetRecipientId} (${resolvedTeamName})`);
    }
  } catch (e) {
    console.warn('Socket emit notice:', e.message);
  }

  return res.status(201).json({
    success: true,
    message: `Team invitation sent to ${recipientName} for ${resolvedTeamName}!`,
    invite: newInvite,
    notification: newNotification
  });
});

// --------------------------------------------------------------------------
// 2. GET /api/invites - Get Received and Sent Invites for Logged-In User
// --------------------------------------------------------------------------
router.get('/', (req, res) => {
  const authUser = getAuthenticatedUser(req);
  const myId = authUser?.id || req.query.userId || 'user_current';
  const myEmail = (authUser?.email || req.query.email || '').toLowerCase().trim();

  // Find received invitations (or seed/all demo invites)
  const received = invitesDB.filter(inv => {
    if (inv.recipientId === 'all' || inv.recipientId === 'seed') return true;
    if (myId && String(inv.recipientId) === String(myId)) return true;
    if (myEmail && inv.recipientEmail && inv.recipientEmail === myEmail) return true;
    return false;
  });

  const sent = invitesDB.filter(inv => {
    if (myId && String(inv.senderId) === String(myId)) return true;
    if (myEmail && inv.senderEmail && inv.senderEmail === myEmail) return true;
    return false;
  });

  return res.status(200).json({
    success: true,
    totalReceived: received.length,
    totalSent: sent.length,
    received,
    sent,
    invites: received
  });
});

// --------------------------------------------------------------------------
// 3. GET /api/invites/sent - Get pending sent invite recipient IDs
// --------------------------------------------------------------------------
router.get('/sent', (req, res) => {
  const authUser = getAuthenticatedUser(req);
  const myId = authUser?.id || req.query.senderId || 'user_current';
  const myEmail = (authUser?.email || '').toLowerCase().trim();

  const sentInvites = invitesDB.filter(i => 
    (String(i.senderId) === String(myId) || (myEmail && i.senderEmail === myEmail))
  );

  return res.status(200).json({
    success: true,
    sentInvites,
    pendingRecipients: sentInvites.filter(i => i.status === 'pending').map(i => i.recipientId || i.recipientEmail)
  });
});

// --------------------------------------------------------------------------
// 4. GET /api/invites/:id - Get Details of Specific Invitation & Team
// --------------------------------------------------------------------------
router.get('/:id', (req, res) => {
  const inviteId = req.params.id;
  const invite = invitesDB.find(i => i.id === inviteId);

  if (!invite) {
    return res.status(404).json({ success: false, message: 'Invitation not found.' });
  }

  const team = teamsDB.find(t => t.id === invite.teamId || t.name === invite.teamName) || {
    id: invite.teamId,
    name: invite.teamName,
    description: invite.teamDesc,
    leadName: invite.teamLeader,
    category: invite.projectCategory,
    requiredSkills: invite.requiredSkills
  };

  const members = teamMembersDB.filter(m => m.teamId === invite.teamId);

  return res.status(200).json({
    success: true,
    invite,
    team: {
      ...team,
      members,
      membersCount: members.length || 3
    }
  });
});

// --------------------------------------------------------------------------
// 5. POST /api/invites/:id/respond - Accept or Decline Team Invitation
// --------------------------------------------------------------------------
router.post('/:id/respond', async (req, res) => {
  const inviteId = req.params.id;
  const { action, responderName = 'Student User', responderEmail = '', responderId = '' } = req.body; // 'ACCEPT' | 'DECLINE'

  const authUser = getAuthenticatedUser(req);
  const effectiveUserId = authUser?.id || responderId || 'user_current';
  const effectiveUserEmail = (authUser?.email || responderEmail || '').toLowerCase().trim();
  const effectiveUserName = authUser?.name || responderName || 'Student User';

  const normalizedAction = (action || '').toUpperCase() === 'ACCEPT' ? 'accepted' : 'declined';

  const invite = invitesDB.find(i => i.id === inviteId);

  if (!invite) {
    return res.status(404).json({ success: false, message: 'Invitation not found or has expired.' });
  }

  // Authorization Check: Must be the intended recipient
  const isAuthorizedRecipient = 
    invite.recipientId === 'all' || 
    invite.recipientId === 'seed' ||
    (invite.recipientId && String(invite.recipientId) === String(effectiveUserId)) ||
    (invite.recipientEmail && effectiveUserEmail && invite.recipientEmail === effectiveUserEmail);

  if (!isAuthorizedRecipient && req.headers['authorization']) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to respond to this invitation.'
    });
  }

  // State check: Prevent duplicate response
  if (invite.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: `This invitation has already been ${invite.status}.`,
      currentStatus: invite.status
    });
  }

  // Update Invitation Status
  invite.status = normalizedAction;
  invite.respondedAt = new Date().toISOString();
  saveInviteRecord(invite);

  // Update associated Notification in notificationsDB
  const linkedNotif = notificationsDB.find(n => n.inviteId === inviteId);
  if (linkedNotif) {
    linkedNotif.status = normalizedAction;
    linkedNotif.actionDone = normalizedAction === 'accepted' ? 'Accepted' : 'Declined';
    linkedNotif.read = true;
  }

  // If Accepted: Add User to Team Members List and Auto-Connect both users permanently
  let autoConn = null;
  if (normalizedAction === 'accepted') {
    const isMember = teamMembersDB.some(m => 
      m.teamId === invite.teamId && (
        (m.userId && String(m.userId) === String(effectiveUserId)) ||
        (m.email && effectiveUserEmail && m.email.toLowerCase().trim() === effectiveUserEmail)
      )
    );

    if (!isMember) {
      teamMembersDB.push({
        id: `tm_${Date.now()}`,
        teamId: invite.teamId,
        teamName: invite.teamName,
        userId: effectiveUserId,
        name: effectiveUserName,
        email: effectiveUserEmail,
        role: 'Collaborator',
        joinedAt: new Date().toISOString()
      });
      console.log(`✅ [TEAM ROSTER] Added ${effectiveUserName} to team ${invite.teamName}`);
    }

    // Auto-create permanent bidirectional teammate connection
    const sId = invite.senderId || 'usr_sender';
    const sEmail = (invite.senderEmail || '').toLowerCase().trim();
    const sName = invite.senderName || 'Team Leader';
    const rId = effectiveUserId;
    const rEmail = effectiveUserEmail;
    const rName = effectiveUserName;

    autoConn = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      senderId: sId,
      senderEmail: sEmail,
      senderName: sName,
      receiverId: rId,
      receiverEmail: rEmail,
      receiverName: rName,
      status: 'ACCEPTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveConnectionRecord(autoConn);

    // Create or unlock conversation between the two connected teammates
    const pairKey = [(sEmail || sId).toLowerCase(), (rEmail || rId).toLowerCase()].sort().join(':');
    let conv = conversationsDB.find(c => c.pairKey === pairKey);
    if (!conv) {
      conversationsDB.unshift({
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        pairKey,
        participants: [sEmail || sId, rEmail || rId],
        participantDetails: [
          { id: sId, email: sEmail, name: sName },
          { id: rId, email: rEmail, name: rName }
        ],
        name: sName,
        role: 'Connected Teammate',
        avatarBg: '#EFF6FF',
        avatarColor: '#2563EB',
        initials: (sName || 'ST').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        type: 'direct',
        lastMsg: `Joined ${invite.teamName}! You are now connected teammates.`,
        time: 'Just now',
        unread: 0,
        updatedAt: new Date().toISOString()
      });
    }
  }

  // Create Notification for the Sender
  const notifTitle = normalizedAction === 'accepted' ? 'Team Invitation Accepted! 🎉' : 'Team Invitation Declined';
  const notifMsg = normalizedAction === 'accepted'
    ? `${effectiveUserName} accepted your invitation and joined the ${invite.teamName} team!`
    : `${effectiveUserName} declined the invitation to join ${invite.teamName}.`;

  const senderNotif = {
    id: `notif_resp_${Date.now()}`,
    userId: invite.senderId,
    recipientEmail: invite.senderEmail,
    title: notifTitle,
    message: notifMsg,
    type: 'TEAM_INVITE_RESPONSE',
    category: 'Team Invites',
    sender: effectiveUserName,
    avatarInitials: effectiveUserName.split(' ').map(n => n[0]).join('').slice(0, 2),
    unread: true,
    time: 'Just now',
    teamId: invite.teamId,
    teamName: invite.teamName,
    status: normalizedAction,
    createdAt: new Date().toISOString()
  };

  notificationsDB.unshift(senderNotif);

  // PostgreSQL Prisma sync
  try {
    const prisma = await getPrisma();
    if (prisma) {
      await prisma.invite.update({
        where: { id: inviteId },
        data: { status: normalizedAction }
      }).catch(e => console.warn('Prisma invite update:', e.message));

      if (autoConn) {
        await prisma.connection.upsert({
          where: {
            senderId_receiverId: { senderId: autoConn.senderId, receiverId: autoConn.receiverId }
          },
          update: { status: 'ACCEPTED' },
          create: {
            id: autoConn.id,
            senderId: autoConn.senderId,
            receiverId: autoConn.receiverId,
            status: 'ACCEPTED'
          }
        }).catch(async () => {
          await prisma.connection.updateMany({
            where: {
              OR: [
                { senderId: autoConn.senderId, receiverId: autoConn.receiverId },
                { senderId: autoConn.receiverId, receiverId: autoConn.senderId }
              ]
            },
            data: { status: 'ACCEPTED' }
          }).catch(e => console.warn('Prisma autoConn update fallback:', e.message));
        });
      }
    }
  } catch (err) {
    console.warn('Prisma invite update notice:', err.message);
  }

  // Socket.IO Broadcast
  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      io.to(`user_${invite.senderId}`).emit('notification:new', senderNotif);
      io.to(`user_${invite.senderEmail}`).emit('notification:new', senderNotif);
      io.emit('notification:new', senderNotif);
      io.emit('invite:updated', { inviteId, status: normalizedAction, teamId: invite.teamId, member: effectiveUserName });
      io.emit('team:member_joined', { teamId: invite.teamId, teamName: invite.teamName, memberName: effectiveUserName });
    }
  } catch (e) {
    console.warn('Socket broadcast notice:', e.message);
  }

  const successMessage = normalizedAction === 'accepted'
    ? 'You have joined the team successfully!'
    : 'Invitation Declined';

  return res.status(200).json({
    success: true,
    message: successMessage,
    status: normalizedAction,
    invite,
    teamId: invite.teamId
  });
});

export default router;
