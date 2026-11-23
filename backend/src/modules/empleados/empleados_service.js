const { Router } = require('express');
const verificarToken = require('../../middlewares/auth.middleware');
const permitirRoles = require('../../middlewares/role.middleware');
const { ROLES } = require('../../utils/constants');
const controller = require('./empleados.controller');

const router = Router();
const acceso = [verificarToken, permitirRoles(ROLES.ADMIN, ROLES.RRHH)];

router.get('/', acceso, controller.listar);
router.get('/:id', acceso, controller.obtener);
router.post('/', acceso, controller.crear);
router.put('/:id', acceso, controller.actualizar);
router.delete('/:id', acceso, controller.desactivar);

module.exports = router;
