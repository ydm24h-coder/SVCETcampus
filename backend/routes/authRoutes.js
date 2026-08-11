const express = require('express');
const { loginUser, seedAdmin } = require('../controllers/authController');

const router = express.Router();

router.post('/login', loginUser);
router.post('/seed-admin', seedAdmin);

module.exports = router;
