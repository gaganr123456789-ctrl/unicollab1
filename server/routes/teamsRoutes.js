import express from 'express';
import { teamsDB, teamMembersDB } from '../db/dataStore.js';

const router = express.Router();

// GET /api/teams - List all active teams
router.get('/', (req, res) => {
  const teamsWithMembers = teamsDB.map(team => {
    const members = teamMembersDB.filter(m => m.teamId === team.id);
    return {
      ...team,
      members,
      membersCount: members.length
    };
  });

  return res.status(200).json({
    success: true,
    total: teamsWithMembers.length,
    teams: teamsWithMembers
  });
});

// GET /api/teams/:id - Get detailed team info with member roster
router.get('/:id', (req, res) => {
  const teamId = req.params.id;
  const team = teamsDB.find(t => t.id === teamId || t.name.toLowerCase() === teamId.toLowerCase());

  if (!team) {
    return res.status(404).json({ success: false, message: 'Team not found.' });
  }

  const members = teamMembersDB.filter(m => m.teamId === team.id);

  return res.status(200).json({
    success: true,
    team: {
      ...team,
      members,
      membersCount: members.length
    }
  });
});

export default router;
