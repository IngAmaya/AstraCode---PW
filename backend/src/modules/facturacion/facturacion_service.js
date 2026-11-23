const { Router } = require('express');
const verificarToken = require('../../middlewares/auth.middleware');
const permitirRoles = require('../../middlewares/role.middleware');
const { ROLES } = require('../../utils/constants');
const controller = require('./facturacion.controller');

const router = Router();
const acceso = [verificarToken, permitirRoles(ROLES.ADMIN, ROLES.VENTAS)];

// Registrar un abono emite el documento fiscal correspondiente
router.post('/abonos', acceso, controller.registrarAbono);
router.post('/abonos/:clienteId', acceso, controller.registrarAbono); // variante que usa el frontend

router.get('/facturacion', acceso, controller.listar);
router.get('/facturacion/:id', acceso, controller.obtener);

module.exports = router;
