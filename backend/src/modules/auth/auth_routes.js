const { Router } = require('express');
const verificarToken = require('../../middlewares/auth.middleware');
const permitirRoles = require('../../middlewares/role.middleware');
const { ROLES } = require('../../utils/constants');
const controller = require('./auth_controller');

const router = Router();

router.post('/login', controller.login);
router.get('/perfil', verificarToken, controller.perfil);

// Solo un ADMIN crea usuarios. Si fuera público, cualquiera se daría un rol con permisos.
router.post('/register', verificarToken, permitirRoles(ROLES.ADMIN), controller.registrar);

module.exports = router;