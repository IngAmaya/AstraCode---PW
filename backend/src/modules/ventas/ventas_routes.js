const { Router } = require('express');
const verificarToken = require('../../middlewares/auth.middleware');
const permitirRoles = require('../../middlewares/role.middleware');
const { ROLES } = require('../../utils/constants');
const controller = require('./ventas_controller');

const router = Router();
const acceso = [verificarToken, permitirRoles(ROLES.ADMIN, ROLES.VENTAS)];

router.get('/unidades', acceso, controller.listarUnidades);

router.get('/contratos', acceso, controller.listarVentas);
router.get('/contratos/:id', acceso, controller.obtenerVenta);
router.post('/contratos', acceso, controller.crearVenta);
router.get('/contratos/:id/plan-pagos', acceso, controller.planDeVenta);

// Lo que ya consume el frontend: todos los planes de un cliente
router.get('/plan-pagos/:clienteId', acceso, controller.planesDeCliente);

module.exports = router;
