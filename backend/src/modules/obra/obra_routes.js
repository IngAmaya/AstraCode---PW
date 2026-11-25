const { Router } = require('express');
const verificarToken = require('../../middlewares/auth.middleware');
const permitirRoles  = require('../../middlewares/role.middleware');
const { ROLES } = require('../../utils/constants');
const controller = require('./obra_controller');

const router = Router();
const lectura   = [verificarToken, permitirRoles(ROLES.ADMIN, ROLES.GERENTE, ROLES.INGENIERO)];
const escritura = [verificarToken, permitirRoles(ROLES.ADMIN, ROLES.GERENTE)];
const avance    = [verificarToken, permitirRoles(ROLES.ADMIN, ROLES.GERENTE, ROLES.INGENIERO)];

// Partidas
router.get('/partidas',               lectura,   controller.listarPartidas);
router.get('/partidas/:id',           lectura,   controller.obtenerPartida);
router.post('/partidas',              escritura, controller.crearPartida);

// Receta de una partida
router.post('/partidas/:id/receta',              escritura, controller.actualizarRecetaItem);
router.delete('/partidas/:id/receta/:recetaId',  escritura, controller.eliminarRecetaItem);

// Avances
router.get('/avances',                lectura,   controller.listarAvances);
router.get('/avances/:id',            lectura,   controller.obtenerAvance);
router.post('/avances',               avance,    controller.registrarAvance);

module.exports = router;