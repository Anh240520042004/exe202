import { Router } from 'express';
import { notificationController } from '../controllers/index.js';
import { protect } from '../middleware/index.js';

const router = Router();

router.use(protect);

router.get('/', notificationController.getAll);
router.get('/unread', notificationController.getUnread);
router.put('/read-all', notificationController.markAllAsRead);
router.post('/', notificationController.create);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.delete);

export default router;
