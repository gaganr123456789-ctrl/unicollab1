import express from 'express';
import cors from 'cors';
import authRoutes from '../server/routes/authRoutes.js';
import adminRoutes from '../server/routes/adminRoutes.js';
import dashboardRoutes from '../server/routes/dashboardRoutes.js';
import usersRoutes from '../server/routes/usersRoutes.js';
import projectsRoutes from '../server/routes/projectsRoutes.js';
import boardsRoutes from '../server/routes/boardsRoutes.js';
import mentorsRoutes from '../server/routes/mentorsRoutes.js';
import resourcesRoutes from '../server/routes/resourcesRoutes.js';
import hackathonsRoutes from '../server/routes/hackathonsRoutes.js';
import messagesRoutes from '../server/routes/messagesRoutes.js';
import teammatesRoutes from '../server/routes/teammatesRoutes.js';
import workspaceRoutes from '../server/routes/workspaceRoutes.js';
import aiRoutes from '../server/routes/aiRoutes.js';
import invitesRoutes from '../server/routes/invitesRoutes.js';
import notificationsRoutes from '../server/routes/notificationsRoutes.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'UniCollab Vercel Serverless REST API Backend',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/dashboard', dashboardRoutes);

app.use('/api/users', usersRoutes);
app.use('/users', usersRoutes);

app.use('/api/projects', projectsRoutes);
app.use('/projects', projectsRoutes);

app.use('/api/boards', boardsRoutes);
app.use('/boards', boardsRoutes);

app.use('/api/mentors', mentorsRoutes);
app.use('/mentors', mentorsRoutes);

app.use('/api/resources', resourcesRoutes);
app.use('/resources', resourcesRoutes);

app.use('/api/hackathons', hackathonsRoutes);
app.use('/hackathons', hackathonsRoutes);

app.use('/api/messages', messagesRoutes);
app.use('/messages', messagesRoutes);

app.use('/api/teammates', teammatesRoutes);
app.use('/teammates', teammatesRoutes);

app.use('/api/workspace', workspaceRoutes);
app.use('/workspace', workspaceRoutes);

app.use('/api/ai', aiRoutes);
app.use('/ai', aiRoutes);

app.use('/api/invites', invitesRoutes);
app.use('/invites', invitesRoutes);

app.use('/api/notifications', notificationsRoutes);
app.use('/notifications', notificationsRoutes);

// Catch-all Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVERLESS API ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error.'
  });
});

export default function handler(req, res) {
  return app(req, res);
}
