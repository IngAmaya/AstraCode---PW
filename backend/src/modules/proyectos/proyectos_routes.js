const { Router } = require('express');
const verificarToken = require('../../middlewares/auth.middleware');
const permitirRoles = require('../../middlewares/role.middleware');
const { ROLES } = require('../../utils/constants');
const controller = require('./proyectos_controller');

const router = Router();

// Cualquier usuario autenticado del sistema puede consultar los proyectos
const lectura = [verificarToken, permitirRoles(...Object.values(ROLES))];
// Solo la administración y la gerencia de proyectos los modifican
const escritura = [verificarToken, permitirRoles(ROLES.ADMIN, ROLES.GERENTE)];

router.get('/', lectura, controller.listar);
router.get('/:id', lectura, controller.obtener);
router.post('/', escritura, controller.crear);
router.put('/:id', escritura, controller.actualizar);
router.patch('/:id/estado', escritura, controller.cambiarEstado);
router.put('/:id/permisos', escritura, controller.actualizarPermisos);

module.exports = router;