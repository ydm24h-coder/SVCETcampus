const express = require('express');
const { getStudents, addStudent, updateStudent, deleteStudent, getFaculty, addFaculty, updateFaculty, deleteFaculty } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes here should be protected and only accessible by ADMIN
router.use(protect);
router.use(authorize('ADMIN'));

router.route('/students')
  .get(getStudents)
  .post(addStudent);

router.route('/students/:id')
  .put(updateStudent)
  .delete(deleteStudent);

router.route('/faculty')
  .get(getFaculty)
  .post(addFaculty);

router.route('/faculty/:id')
  .put(updateFaculty)
  .delete(deleteFaculty);

module.exports = router;
