import { Router } from 'express';
import { getHello } from '../controllers/root.js';
import { getUser } from '../controllers/user.js';
import { getWork } from '../controllers/work.js';

const router = Router();

router.get('/', getHello);
router.get('/user/', getUser);
router.get('/work/', getWork);

export default router;