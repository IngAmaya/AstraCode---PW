const { Router } = require('express');
const verificarToken = require('../../middlewares/auth.middleware');
const permitirRoles  = require('../../middlewares/role.middleware');
const { ROLES } = require('../../utils/constants');
const controller = require('./inventario_controller');

const router = Router();
const lectura   = [verificarToken, permitirRoles(ROLES.ADMIN, ROLES.BODEGUERO, ROLES.GERENTE, ROLES.INGENIERO)];
const escritura = [verificarToken, permitirRoles(ROLES.ADMIN, ROLES.BODEGUERO)];

// Materiales
router.get('/materiales',      lectura,   controller.listarMateriales);
router.get('/materiales/:id',  lectura,   controller.obtenerMaterial);
router.post('/materiales',     escritura, controller.crearMaterial);
router.put('/materiales/:id',  escritura, controller.actualizarMaterial);

// Bodegas
router.get('/bodegas',         lectura,   controller.listarBodegas);
router.get('/bodegas/:id/stock', lectura, controller.stockDeBodega);

// Kardex
router.get('/kardex',          lectura,   controller.listarKardex);

// Ingresos (compras a bodega central)
router.get('/ingresos',        lectura,   controller.listarIngresos);
router.get('/ingresos/:id',    lectura,   controller.obtenerIngreso);
router.post('/ingresos',       escritura, controller.registrarIngreso);

// Traslados (central -> proyecto)
router.get('/traslados',       lectura,   controller.listarTraslados);
router.get('/traslados/:id',   lectura,   controller.obtenerTraslado);
router.post('/traslados',      escritura, controller.registrarTraslado);

module.exports = router;