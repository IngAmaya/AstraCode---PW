const { Router } = require('express');

const router = Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, message: 'API funcionando' });
});

router.use('/ventas/clientes', require('../modules/clientes/clientes_routes'));
router.use('/ventas', require('../modules/ventas/ventas_routes'));
router.use('/ventas', require('../modules/facturacion/facturacion_routes'));
router.use('/rrhh/empleados', require('../modules/empleados/empleados_routes'));
router.use('/rrhh/planilla', require('../modules/planilla/planilla_routes'));

module.exports = router;