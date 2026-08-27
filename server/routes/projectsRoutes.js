import express from 'express';
import { getProjects, getMyProjects, getProjectById, createProject, updateProject, deleteProject } from '../controllers/projectsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getProjects);
router.get('/user/me', authenticateToken, getMyProjects);
router.get('/user/my', authenticateToken, getMyProjects);
router.get('/workspace/my-projects', authenticateToken, getMyProjects);
router.get('/:id', getProjectById);
router.post('/', authenticateToken, createProject);
router.put('/:id', authenticateToken, updateProject);
router.delete('/:id', authenticateToken, deleteProject);

export default router;
