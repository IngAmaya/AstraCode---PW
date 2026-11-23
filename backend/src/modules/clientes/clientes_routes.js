const { Router } = require('express');
const verificarToken = require('../../middlewares/auth.middleware');
const permitirRoles = require('../../middlewares/role.middleware');
const { ROLES } = require('../../utils/constants');
const controller = require('./clientes_controller');

const router = Router();
const acceso = [verificarToken, permitirRoles(ROLES.ADMIN, ROLES.VENTAS)];

router.get('/', acceso, controller.listar);
router.get('/:id', acceso, controller.obtener);
router.post('/', acceso, controller.crear);
router.put('/:id', acceso, controller.actualizar);
router.patch('/:id/estado', acceso, controller.cambiarEstado);
router.delete('/:id', acceso, controller.eliminar);

module.exports = router;
