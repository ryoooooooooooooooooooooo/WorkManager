import { Router } from 'express';
import { getCreate, postCreate } from '../controllers/root.js';
import { getLogin, postLogin } from '../controllers/login.js';

const router = Router();

router.get('/', getCreate);
router.get('/create', getCreate);
router.post('/create', postCreate);
router.get('/login', getLogin);
router.post('/login', postLogin);

export default router;