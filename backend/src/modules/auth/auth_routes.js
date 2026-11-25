const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const verificarToken = require('../../middlewares/auth.middleware');
const permitirRoles = require('../../middlewares/role.middleware');
const { ROLES } = require('../../utils/constants');
const controller = require('./auth_controller');

const router = Router();

// Freno a la fuerza bruta: 10 intentos fallidos por IP cada 15 minutos (los logins correctos no cuentan)
const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_MAX_INTENTOS) || 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, message: 'Demasiados intentos de inicio de sesión. Intente de nuevo en 15 minutos.' },
});


router.post('/login', limitarLogin, controller.login);
router.get('/perfil', verificarToken, controller.perfil);

// Solo un ADMIN crea usuarios. Si fuera público, cualquiera se daría un rol con permisos.
router.post('/register', verificarToken, permitirRoles(ROLES.ADMIN), controller.registrar);

module.exports = router;