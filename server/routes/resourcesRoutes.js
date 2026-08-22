import express from 'express';
import { getResources, createResource } from '../controllers/resourcesController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getResources);
router.post('/', authenticateToken, createResource);

export default router;
