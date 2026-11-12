const { Router } = require('express');

const router = Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, message: 'API funcionando' });
});

// Aquí se irán montando los módulos:
// router.use('/auth', require('../modules/auth/auth.routes'));

module.exports = router;