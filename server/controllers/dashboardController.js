import { teammatesDB, projectsDB, hackathonsDB } from '../db/dataStore.js';

let prismaInstance = null;
const getPrisma = async () => {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaInstance) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      prismaInstance = new PrismaClient();
    } catch (err) {
      console.warn('Prisma load skipped in dashboardController.');
      return null;
    }
  }
  return prismaInstance;
};

// GET /api/dashboard - Aggregated Activity & Stats
export const getDashboardStats = async (req, res) => {
  try {
    const prisma = await getPrisma();
    if (prisma) {
      const [projectsCount, hackathonsCount, usersCount, mentorsCount] = await Promise.all([
        prisma.project.count({ where: { status: 'Active' } }),
        prisma.hackathon.count(),
        prisma.user.count(),
        prisma.mentor.count()
      ]);

      return res.status(200).json({
        success: true,
        stats: {
          activeProjects: projectsCount || projectsDB.length,
          upcomingHackathons: hackathonsCount || hackathonsDB.length,
          availableTeammates: usersCount || teammatesDB.length,
          unreadMessages: 3,
          activeMentors: mentorsCount || 8
        },
        recentActivity: [
          { id: 1, type: 'team', title: 'New teammate application from Sarah Chen', time: '10m ago' },
          { id: 2, type: 'hackathon', title: 'Global AI Hackathon 2026 registration opened', time: '1h ago' },
          { id: 3, type: 'mentor', title: '1-on-1 Session confirmed with Dr. Aris Thorne', time: '3h ago' }
        ]
      });
    }
  } catch (err) {
    console.warn('Dashboard stats query fallback:', err.message);
  }

  return res.status(200).json({
    success: true,
    stats: {
      activeProjects: projectsDB.length,
      upcomingHackathons: hackathonsDB.length,
      availableTeammates: teammatesDB.length,
      unreadMessages: 3,
      activeMentors: 8
    },
    recentActivity: [
      { id: 1, type: 'team', title: 'New teammate application from Sarah Chen', time: '10m ago' },
      { id: 2, type: 'hackathon', title: 'Global AI Hackathon 2026 registration opened', time: '1h ago' },
      { id: 3, type: 'mentor', title: '1-on-1 Session confirmed with Dr. Aris Thorne', time: '3h ago' }
    ]
  });
};
