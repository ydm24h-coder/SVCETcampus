const express = require('express');
const { getStudents, addStudent, getFaculty, addFaculty } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes here should be protected and only accessible by ADMIN
router.use(protect);
router.use(authorize('ADMIN'));

router.route('/students')
  .get(getStudents)
  .post(addStudent);

router.route('/faculty')
  .get(getFaculty)
  .post(addFaculty);

module.exports = router;
