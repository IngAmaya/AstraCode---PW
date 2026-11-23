const { Router } = require('express');
const verificarToken = require('../../middlewares/auth.middleware');
const permitirRoles = require('../../middlewares/role.middleware');
const { ROLES } = require('../../utils/constants');
const controller = require('./planilla.controller');

const router = Router();
const acceso = [verificarToken, permitirRoles(ROLES.ADMIN, ROLES.RRHH)];

// Las rutas fijas van antes que '/:id' para que Express no las confunda con un id
router.get('/boletas/:id', acceso, controller.obtenerBoleta);
router.get('/empleado/:empleadoId/boletas', acceso, controller.boletasDeEmpleado);
router.post('/calcular', acceso, controller.vistaPrevia);

router.get('/', acceso, controller.listar);
router.get('/:id', acceso, controller.obtener);
router.post('/', acceso, controller.crear);
router.patch('/:id/estado', acceso, controller.cambiarEstado);
router.delete('/:id', acceso, controller.eliminar);

module.exports = router;
