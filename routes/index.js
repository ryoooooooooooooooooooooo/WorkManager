import { Router } from 'express';
import { getCreate, postCreate } from '../controllers/root.js';
import { getLogin, postLogin } from '../controllers/login.js';
import { getHome } from '../controllers/home.js';

const router = Router();

router.get('/', getCreate);
router.get('/home', getHome);
router.get('/create', getCreate);
router.post('/create', postCreate);
router.get('/login', getLogin);
router.post('/login', postLogin);

export default router;