import express from 'express';
import { 
  sendConnectionRequest, 
  getConnections, 
  acceptConnection, 
  rejectConnection, 
  removeConnection,
  getConnectionStatus 
} from '../controllers/connectionsController.js';

const router = express.Router();

router.post('/request', sendConnectionRequest);
router.get('/', getConnections);
router.post('/:id/accept', acceptConnection);
router.post('/accept', acceptConnection);
router.post('/:id/reject', rejectConnection);
router.post('/reject', rejectConnection);
router.delete('/:id', removeConnection);
router.post('/:id/remove', removeConnection);
router.post('/remove', removeConnection);
router.get('/status', getConnectionStatus);

export default router;
